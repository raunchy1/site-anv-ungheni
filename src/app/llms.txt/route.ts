import { db } from "@/lib/supabase/server";
import { getSettings } from "@/lib/db/queries";
import { SITE_URL, formatCount } from "@/lib/format";

/**
 * /llms.txt — fișa magazinului, scrisă pentru un asistent, nu pentru un om.
 *
 * DE CE EXISTĂ. Când cineva întreabă un asistent „unde cumpăr anvelope 205/55
 * R16 în Moldova", modelul are, în cel mai bun caz, HTML-ul paginii: navigație,
 * bară de filtre, treizeci de carduri, subsol. Din el trebuie să deducă ce
 * vindem, unde suntem și cum se caută o dimensiune. Fișierul ăsta îi dă toate
 * trei în text simplu, într-o pagină, cu adresele exacte pe care le poate cita.
 *
 * Convenția `llms.txt` (llmstxt.org) e tânără și n-o respectă toți; costul e o
 * rută de câteva sute de octeți, iar câștigul e că răspunsul despre noi vine din
 * ce am scris noi, nu din ce a ghicit modelul dintr-un card de produs.
 *
 * CIFRELE SE CITESC DIN BAZĂ, nu se scriu de mână: un fișier care spune „18.000
 * de anvelope" la un an după ce catalogul a ajuns la 9.000 e mai rău decât unul
 * care nu spune nimic.
 */
export const revalidate = 86400;

export async function GET() {
  const settings = await getSettings();

  const [disponibile, marci] = await Promise.all([
    db.from("products").select("id", { count: "exact" }).limit(1)
      .eq("is_active", true).eq("category", "anvelope")
      .in("stock_status", ["in_stock", "supplier"]).not("price_mdl", "is", null),
    db.from("brands").select("name").gt("product_count", 0).order("product_count", { ascending: false }).limit(40),
  ]);

  const numeMarci = ((marci.data ?? []) as { name: string }[]).map((b) => b.name);
  const duminica = settings.opening_hours.sun ?? null;

  const text = `# Anvelope Ungheni (anvelope-ungheni.md)

> Magazin de anvelope și atelier de vulcanizare în Ungheni, Republica Moldova.
> Vinde anvelope noi pentru autoturisme, SUV, microbuze, camioane și tehnică
> agricolă, cu livrare în toată Moldova, și le montează la fața locului.

## Date de contact și program

- Adresă: ${settings.address}
- Telefon: ${settings.phone_display} (${settings.phone_e164})
- E-mail: ${settings.email}
- Program: luni–sâmbătă ${settings.opening_hours.mon_sat}${duminica ? `, duminică ${duminica}` : ""}
- Coordonate: ${settings.lat}, ${settings.lng}
- Limbi: română, rusă
- Monedă: MDL (lei moldovenești)

## Ce oferim

- ${formatCount(disponibile.count ?? 0)} de anvelope disponibile în catalog, cu preț afișat
- ${numeMarci.length >= 40 ? "peste 40" : String(numeMarci.length)} de mărci${numeMarci.length ? `, printre care: ${numeMarci.slice(0, 20).join(", ")}` : ""}
- Anvelope de vară, de iarnă și all season, inclusiv variante XL, RunFlat și cu crampoane
- Livrare în toată Republica Moldova în 1–3 zile
- Garanție ${settings.warranty_years} ani
- Servicii în atelier: montaj, echilibrare, reparații, umflare cu azot, senzori TPMS

## Cum se caută o dimensiune

Adresele de catalog sunt stabile și compuse din segmente. Pentru o anvelopă
205/55 R16:

- ${SITE_URL}/catalog-anvelope/latime_205/inaltime_55/diametru_r16
- rusă: ${SITE_URL}/ru/katalog-shin/latime_205/inaltime_55/diametru_r16

Se pot adăuga sezonul (\`sezon_vara\`, \`sezon_iarna\`, \`sezon_all-season\`) și
marca (\`marca_michelin\`). Fiecare pagină de produs are date structurate
schema.org de tip Product, cu preț, disponibilitate și dimensiune.

## Pagini principale

- ${SITE_URL}/ — pagina principală
- ${SITE_URL}/catalog-anvelope — catalogul complet
- ${SITE_URL}/servicii — serviciile atelierului (tarifele se dau la telefon, nu sunt publicate)
- ${SITE_URL}/senzori-presiune-anvelope — senzori de presiune TPMS
- ${SITE_URL}/contact — adresă, hartă, program
- ${SITE_URL}/sitemap.xml — harta completă a site-ului
- ${SITE_URL}/ru — versiunea rusă

## Ce NU suntem

Nu vindem anvelope rulate, nu vindem online în afara Republicii Moldova și nu
suntem un serviciu de comparare a prețurilor: prețurile de pe site sunt ale
magazinului, actualizate zilnic din stocul furnizorilor.
`;

  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
