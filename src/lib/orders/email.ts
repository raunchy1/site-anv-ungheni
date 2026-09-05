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
  | { trimis: true; id: string; livrate?: string[]; ratate?: string[] }
  | { trimis: false; motiv: "neconfigurat" | "eroare"; detaliu?: string };

/**
 * Cui îi ajunge comanda. `ORDER_NOTIFY_EMAIL` bate ce scrie în `settings`,
 * pentru că adresa din `settings` e cea publică, afișată pe site la contact —
 * cine citește comenzile nu e neapărat aceeași persoană. Acceptă mai multe
 * adrese separate prin virgulă. Fără variabilă, rămâne comportamentul vechi.
 *
 * ORDINEA CONTEAZĂ. Prima adresă din listă e cea care primește comenzile în
 * primul rând — atelierul. Dacă trimiterea în bloc e refuzată, `trimite` reia
 * pe rând, în ordinea asta, ca o adresă stricată de la coadă să nu poată opri
 * comanda de la prima.
 */
export function destinatariComenzi(emailDinSettings: string): string[] {
  const brut = process.env.ORDER_NOTIFY_EMAIL ?? emailDinSettings;
  const lista = [
    ...new Set(
      brut
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
    ),
  ];
  return lista.length > 0 ? lista : [emailDinSettings];
}

/** O singură trimitere. Nu aruncă; spune doar ce s-a întâmplat. */
async function trimite(
  key: string,
  from: string,
  catre: string[],
  o: OrderData,
): Promise<RezultatEmail> {
  try {
    const { data, error } = await new Resend(key).emails.send({
      from,
      to: catre,
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

export async function trimiteEmailComanda(o: OrderData, catre: string | string[]): Promise<RezultatEmail> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { trimis: false, motiv: "neconfigurat" };

  /* Expeditorul trebuie să fie pe un domeniu verificat în Resend.
     anvelope-ungheni.md e verificat (DKIM + SPF pe subdomeniul `send`), deci
     `comenzi@anvelope-ungheni.md` livrează către orice adresă. Rămâne
     configurabil, ca schimbarea căsuței să nu ceară deploy. */
  const from = process.env.RESEND_FROM ?? "Anvelope Ungheni <comenzi@anvelope-ungheni.md>";
  const lista = Array.isArray(catre) ? catre : [catre];

  const rezultat = await trimite(key, from, lista, o);
  if (rezultat.trimis) return { ...rezultat, livrate: lista, ratate: [] };

  /*
   * TRIMITERE PE RÂND, când cea în bloc a fost refuzată.
   *
   * Resend refuză mesajul întreg dacă o singură adresă din `to` e invalidă sau
   * pe lista lui de suprimare. Cu două destinații asta înseamnă că o adresă
   * stricată ar face comanda invizibilă și pentru cealaltă — inclusiv pentru
   * atelier, care e prima din listă și cea care chiar trebuie să o vadă.
   * Se reia în ordinea din `ORDER_NOTIFY_EMAIL`, fiecare separat.
   */
  if (lista.length > 1) {
    const livrate: string[] = [];
    const ratate: string[] = [];
    let primulId: string | null = null;
    for (const adresa of lista) {
      const r = await trimite(key, from, [adresa], o);
      if (r.trimis) {
        livrate.push(adresa);
        primulId ??= r.id;
      } else {
        ratate.push(adresa);
      }
    }
    if (livrate.length > 0) {
      if (ratate.length > 0) {
        console.error("[comandă] adrese care n-au primit comanda:", ratate.join(", "), o.orderNumber);
      }
      return { trimis: true, id: primulId ?? "—", livrate, ratate };
    }
  }

  /* ULTIMA PLASĂ. Domeniul anvelope-ungheni.md e verificat în Resend din
     5 septembrie 2026, deci ramura asta nu mai e calea normală — se ajunge aici
     doar dacă TOATE adresele au picat una câte una, adică e ceva rupt la Resend
     sau în cheie. Atunci mai încercăm perechea care trece oricum: expeditorul de
     test al Resend către adresa contului. Mai bine o comandă citită de la altă
     adresă decât o comandă pe care n-o vede nimeni. */
  const rezervaCatre = process.env.RESEND_FALLBACK_TO;
  const rezervaFrom = process.env.RESEND_FALLBACK_FROM;
  if (!rezervaCatre || !rezervaFrom) return rezultat;

  console.warn("[comandă] trimit pe adresa de rezervă:", o.orderNumber);
  return trimite(key, rezervaFrom, [rezervaCatre], o);
}
