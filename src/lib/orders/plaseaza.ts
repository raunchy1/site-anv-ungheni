"use server";

import { z } from "zod";
import { db, dbWrite } from "@/lib/supabase/server";
import { getSettings } from "@/lib/db/queries";
import { trimiteEmailComanda } from "./email";
import { comandaText, type OrderData, type OrderLine } from "./mesaj";
import { SITE_URL, whatsappLink } from "@/lib/format";
import { COST_LIVRARE } from "./livrare";
import type { Locale } from "@/lib/types";

/**
 * PLASAREA COMENZII.
 *
 * Trei reguli, în ordinea importanței:
 *
 * 1. PREȚURILE SE RECALCULEAZĂ DIN BAZĂ. Coșul trăiește în `localStorage`, deci
 *    oricine îl poate edita. Din client vin doar `id` și cantitatea; titlul și
 *    prețul le luăm noi. Un produs care între timp a rămas fără preț sau fără
 *    stoc e refuzat pe loc, cu numele lui, nu ignorat în tăcere.
 *
 * 2. COMANDA SE SALVEAZĂ ÎNAINTE DE ORICE TRIMITERE. E-mailul poate cădea,
 *    WhatsApp-ul depinde de client. Rândul din `orders` e singura evidență care
 *    nu depinde de nimic din afară — și e cea pe care o citește aplicația de
 *    administrare.
 *
 * 3. TOTUL MERGE PE CHEIA ANONIMĂ. În bază stau honeypot-ul și limita de
 *    3 comenzi pe oră per IP (migrarea 0007), iar cu `service_role` ele sunt
 *    sărite din construcție. Numărul comenzii și articolele trec prin două
 *    funcții `security definer` (migrările 0013 și 0014), nu prin cheia de
 *    service — care oricum nu era în variabilele de mediu de pe Vercel și a
 *    produs, la primul test pe producție, o comandă salvată fără articole și un
 *    mesaj de eroare pentru un client a cărui comandă intrase deja.
 *
 * 4. DUPĂ SALVARE, NIMIC NU MAI POATE STRICA RĂSPUNSUL. Articolele și e-mailul
 *    sunt în `try`: dacă pică, se scriu în jurnal, dar clientul își primește
 *    numărul. O comandă intrată despre care clientul crede că n-a intrat e mai
 *    rea decât una fără e-mail.
 */

const LinieSchema = z.object({
  id: z.number().int().positive(),
  qty: z.number().int().min(1).max(50),
});

const ComandaSchema = z.object({
  customerName: z.string().trim().min(2, "nume").max(80),
  /* Moldova: 0XX XXX XXX sau +373XXXXXXXX, cu sau fără spații. */
  phone: z.string().trim().regex(/^(\+?373|0)\s?\d{2}[\s-]?\d{3}[\s-]?\d{3}$/, "telefon"),
  email: z.union([z.string().trim().email(), z.literal("")]).optional(),
  city: z.string().trim().min(2).max(60),
  address: z.string().trim().max(160).optional(),
  delivery: z.enum(["ridicare_magazin", "curier_ungheni", "curier_moldova"]),
  payment: z.enum(["numerar_livrare", "numerar_magazin", "transfer_bancar"]),
  wantsMounting: z.boolean(),
  note: z.string().trim().max(500).optional(),
  /** Câmpul-capcană. Un om nu-l vede, deci nu-l completează. */
  hp: z.string().max(0).optional().or(z.literal("")),
  locale: z.enum(["ro", "ru"]),
  items: z.array(LinieSchema).min(1).max(20),
});

export type ComandaInput = z.input<typeof ComandaSchema>;

export type RezultatComanda =
  | {
      ok: true;
      orderNumber: string;
      total: number;
      /** Legătura de WhatsApp cu comanda scrisă în ea, către atelier. */
      whatsapp: string;
      /** Adevărat doar dacă e-mailul chiar a plecat. Nu se minte în interfață. */
      emailTrimis: boolean;
    }
  | { ok: false; eroare: string; camp?: string };

export async function plaseazaComanda(input: ComandaInput): Promise<RezultatComanda> {
  const parsed = ComandaSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, eroare: "date_invalide", camp: String(first?.path?.[0] ?? "") };
  }
  const c = parsed.data;
  const locale = c.locale as Locale;
  const ru = locale === "ru";

  /* Botul care a completat capcana primește un răspuns care arată a succes, dar
     nu scrie nimic. Un mesaj de eroare i-ar spune exact ce să evite data viitoare. */
  if (c.hp) {
    return { ok: true, orderNumber: "AU-0000-00000", total: 0, whatsapp: "#", emailTrimis: false };
  }

  /* ------------------------------------------------- prețurile, din bază */
  const ids = [...new Set(c.items.map((i) => i.id))];
  const { data: produse, error: eProduse } = await db
    .from("products")
    .select("id, slug_ro, slug_ru, title_ro, title_ru, price_mdl, stock_status, is_active")
    .in("id", ids);

  if (eProduse) return { ok: false, eroare: "baza_indisponibila" };

  const linii: OrderLine[] = [];
  const itemeDb: { product_id: number; title_snapshot: string; slug_snapshot: string; price_snapshot: number; qty: number }[] = [];

  for (const linie of c.items) {
    const p = produse?.find((x) => x.id === linie.id);
    if (!p || !p.is_active || p.price_mdl == null || p.stock_status === "out_of_stock") {
      const nume = p ? ((ru ? p.title_ru : p.title_ro) ?? p.title_ro) : `#${linie.id}`;
      return { ok: false, eroare: "produs_indisponibil", camp: nume };
    }
    const title = ((ru ? p.title_ru : p.title_ro) ?? p.title_ro) as string;
    const slug = ((ru ? p.slug_ru : p.slug_ro) ?? p.slug_ro) as string;
    const price = Number(p.price_mdl);
    linii.push({ title, slug, price, qty: linie.qty });
    itemeDb.push({ product_id: p.id, title_snapshot: title, slug_snapshot: slug, price_snapshot: price, qty: linie.qty });
  }

  const subtotal = linii.reduce((s, l) => s + l.price * l.qty, 0);
  const deliveryCost = COST_LIVRARE[c.delivery];
  const total = subtotal + deliveryCost;

  /* ------------------------------------------------------ numărul comenzii */
  const { data: numar, error: eNumar } = await dbWrite.rpc("next_order_number");
  if (eNumar || !numar) {
    console.error("[comandă] next_order_number:", eNumar);
    return { ok: false, eroare: "baza_indisponibila" };
  }
  const orderNumber = String(numar);

  /* ------------------------------------------------------------- salvarea */
  const { error: eOrder } = await dbWrite.from("orders").insert({
    order_number: orderNumber,
    customer_name: c.customerName,
    phone: c.phone,
    email: c.email || null,
    city: c.city,
    address: c.address || null,
    delivery: c.delivery,
    payment: c.payment,
    wants_mounting: c.wantsMounting,
    note: c.note || null,
    subtotal_mdl: subtotal,
    delivery_mdl: deliveryCost,
    total_mdl: total,
  });

  if (eOrder) {
    /* Garda din bază respinge honeypot-ul și depășirea limitei cu acelaşi cod. */
    const limita = /prea multe cereri/i.test(eOrder.message);
    console.error("[comandă] insert:", eOrder.message);
    return { ok: false, eroare: limita ? "prea_multe" : "salvare_esuata" };
  }

  /* ---------------------------------------------------------- articolele */
  try {
    const { error: eItems } = await dbWrite.rpc("add_order_items", {
      p_order_number: orderNumber,
      p_items: itemeDb,
    });
    if (eItems) console.error("[comandă] add_order_items:", eItems.message, orderNumber);
  } catch (e) {
    console.error("[comandă] add_order_items a aruncat:", e, orderNumber);
  }

  /* ------------------------------------------------------------ anunțurile */
  const date: OrderData = {
    orderNumber,
    customerName: c.customerName,
    phone: c.phone,
    email: c.email || null,
    city: c.city,
    address: c.address || null,
    delivery: c.delivery,
    payment: c.payment,
    wantsMounting: c.wantsMounting,
    note: c.note || null,
    items: linii,
    subtotal,
    deliveryCost,
    total,
    locale,
  };

  let emailTrimis = false;
  try {
    const settings = await getSettings();
    emailTrimis = (await trimiteEmailComanda(date, settings.email)).trimis;
  } catch (e) {
    console.error("[comandă] e-mailul n-a putut fi trimis:", e, orderNumber);
  }

  return {
    ok: true,
    orderNumber,
    total,
    whatsapp: whatsappLink(comandaText(date, SITE_URL)),
    emailTrimis,
  };
}
