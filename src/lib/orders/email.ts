import { Resend } from "resend";
import { comandaHtml, comandaText, type OrderData } from "./mesaj";
import { SITE_URL } from "@/lib/format";

/**
 * E-mailul către atelier, prin Resend.
 *
 * De ce Resend și nu SMTP-ul căsuței: pe o funcție serverless o conexiune SMTP
 * cere 3-5 secunde și pică des din rețelele de cloud, iar parola căsuței ar sta
 * în variabile de mediu. Resend e un POST cu o cheie revocabilă. Pachetul era
 * deja în `package.json` — decizia fusese luată, doar că nu ajunsese cod.
 *
 * TRIMITEREA NU POATE RUPE COMANDA. Comanda e deja în bază când ajungem aici;
 * dacă e-mailul cade, clientul tot primește numărul lui, iar comanda tot există.
 * De aceea funcția nu aruncă niciodată — întoarce ce s-a întâmplat, iar cine o
 * apelează decide dacă e cazul să atragă atenția.
 */

export type RezultatEmail =
  | { trimis: true; id: string }
  | { trimis: false; motiv: "neconfigurat" | "eroare"; detaliu?: string };

/**
 * Cui îi ajunge comanda. `ORDER_NOTIFY_EMAIL` bate ce scrie în `settings`,
 * pentru că adresa din `settings` e cea publică, afișată pe site la contact —
 * cine citește comenzile nu e neapărat aceeași persoană. Acceptă mai multe
 * adrese separate prin virgulă. Fără variabilă, rămâne comportamentul vechi.
 */
export function destinatariComenzi(emailDinSettings: string): string[] {
  const brut = process.env.ORDER_NOTIFY_EMAIL ?? emailDinSettings;
  const lista = brut
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
  return lista.length > 0 ? lista : [emailDinSettings];
}

export async function trimiteEmailComanda(o: OrderData, catre: string | string[]): Promise<RezultatEmail> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { trimis: false, motiv: "neconfigurat" };

  /* Expeditorul trebuie să fie pe un domeniu verificat în Resend. Până când
     anvelope-ungheni.md e verificat, `onboarding@resend.dev` livrează doar către
     adresa contului — de aceea e configurabil, nu scris în cod. */
  const from = process.env.RESEND_FROM ?? "Anvelope Ungheni <comenzi@anvelope-ungheni.md>";

  try {
    const { data, error } = await new Resend(key).emails.send({
      from,
      to: Array.isArray(catre) ? catre : [catre],
      /* Răspunsul pleacă direct la client, dacă și-a lăsat adresa. */
      ...(o.email ? { replyTo: o.email } : {}),
      subject: `${o.orderNumber} · ${o.customerName} · ${Math.round(o.total)} MDL`,
      html: comandaHtml(o, SITE_URL),
      text: comandaText(o, SITE_URL),
    });

    if (error) {
      console.error("[comandă] Resend a refuzat:", error);
      return { trimis: false, motiv: "eroare", detaliu: `${error.name}: ${error.message}`.slice(0, 300) };
    }
    return { trimis: true, id: data?.id ?? "—" };
  } catch (e) {
    console.error("[comandă] Resend inaccesibil:", e);
    return { trimis: false, motiv: "eroare", detaliu: String(e).slice(0, 300) };
  }
}
