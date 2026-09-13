import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/format";
import { AGENTI_LA_CERERE, CRAWLERE_DE_ANTRENAMENT, CRAWLERE_SEO } from "@/lib/crawlers";

/**
 * Oriunde în afară de domeniul real, indexarea e închisă complet.
 *
 * Motivul: e aceeași marfă, aceleași texte și aceleași prețuri ca pe
 * anvelope-ungheni.md. Lăsată la vedere, o a doua copie pune Google să aleagă
 * singur care versiune e „originalul" — și poate alege copia.
 *
 * REGULA ERA SCRISĂ PE GAZDA GREȘITĂ. Verifica dacă adresa se termină în
 * `vercel.app`, fiindcă atunci singurul loc unde putea sta o copie era un
 * preview Vercel. La mutarea pe server propriu, copia de probă a ajuns pe
 * `…sslip.io` — care nu se termină în `vercel.app`, deci trecea drept
 * producție și `robots.txt` se deschidea larg. Cele 18.441 de fișe de produs
 * ar fi fost oferite spre indexare de două ori, de pe două adrese.
 *
 * Întrebarea e pusă acum invers, și e cea corectă: nu „e asta o copie
 * cunoscută?", ci „e asta chiar adresa de producție?". Orice altceva —
 * `vercel.app`, `sslip.io`, un IP gol, un domeniu de test de mâine — se închide
 * din construcție, fără o listă care trebuie ținută la zi.
 */
const GAZDA_PRODUCTIE = "anvelope-ungheni.md";
const PREVIEW = (() => {
  const gazda = new URL(SITE_URL).hostname.toLowerCase();
  return gazda !== GAZDA_PRODUCTIE && gazda !== `www.${GAZDA_PRODUCTIE}`;
})();

export default function robots(): MetadataRoute.Robots {
  if (PREVIEW) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  // Rutele tranzacționale și cele interne n-au ce căuta în index.
  const disallow = ["/admin", "/api/", "/cos", "/checkout", "/comanda/", "/design-system",
    "/ru/korzina", "/ru/oformlenie-zakaza", "/favorite", "/comparare", "/ru/izbrannoe", "/ru/sravnenie",
    /*
     * SORTAREA, PAGINAREA ȘI „ARATĂ ȘI INDISPONIBILELE" SE ÎNCHID LA CRAWLARE.
     *
     * `isIndexable` le dădea deja `noindex` — dar `noindex` se află abia DUPĂ ce
     * pagina a fost randată, iar randarea e exact ce costă. Fiecare combinație
     * de filtre se înmulțea cu trei sortări, cu numărul de pagini și cu două
     * variante de disponibilitate; spațiul rezultat e practic infinit, și era
     * deschis tuturor.
     *
     * Ce a ieșit din asta, măsurat în logurile Supabase pe 7 septembrie 2026:
     * ~125.000 de interogări pe oră, nouă ore la rând, adică ~20.000 de randări
     * pe oră cerute de roboți. Aia a golit bugetul de Fast Origin Transfer de la
     * Vercel și a pus originea Supabase pe 521/522.
     *
     * Nu se pierde nimic din index: astea erau `noindex` oricum, iar produsele
     * intră în sitemap pe cont propriu, nu prin paginarea catalogului.
     */
    "/catalog-anvelope/*sortare_",
    "/catalog-anvelope/*pagina_",
    "/catalog-anvelope/*indisponibile",
    "/ru/katalog-shin/*sortare_",
    "/ru/katalog-shin/*pagina_",
    "/ru/katalog-shin/*indisponibile",
  ];

  /*
   * ROBOȚII CARE COPIAZĂ CATALOGUL ÎNTREG SE ÎNCHID. CEI CARE ADUC OMUL, NU.
   *
   * Regula de dinainte îi invita pe toți pe nume, ca să poată un asistent
   * întrebat „unde cumpăr anvelope în Moldova" să ne citeze cu preț și stoc.
   * Intenția rămâne — se schimbă doar cine plătește pentru ea.
   *
   * Catalogul are ~37.000 de adrese. O parcurgere completă costă ~37.000 de
   * randări, fiecare o scriere ISR din bugetul lunar de 200.000. Nouă roboți
   * care parcurg tot înseamnă nouă parcurgeri: 333.000. Contul ajunsese la
   * 325.000, iar Vercel oprește servirea, nu trimite factură.
   *
   * Deci: agenții care cer O pagină fiindcă tocmai a întrebat un om rămân
   * (`AGENTI_LA_CERERE`) — ei aduc clientul și costă cât un vizitator. Pleacă
   * cei care copiază tot pentru antrenament și roboții de SEO, care parcurg tot
   * și nu aduc pe nimeni. Vezi `src/lib/crawlers.ts` pentru cifrele măsurate.
   *
   * Googlebot, Bingbot, YandexBot și Applebot nu sunt atinși: `User-agent: *`
   * de mai jos îi lasă să intre exact ca înainte.
   */
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      ...AGENTI_LA_CERERE.map((userAgent) => ({ userAgent, allow: "/", disallow })),
      ...CRAWLERE_DE_ANTRENAMENT.map((userAgent) => ({ userAgent, disallow: "/" })),
      ...CRAWLERE_SEO.map((userAgent) => ({ userAgent, disallow: "/" })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
