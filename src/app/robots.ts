import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/format";
import { AGENTI_LA_CERERE, CRAWLERE_DE_ANTRENAMENT, CRAWLERE_SEO } from "@/lib/crawlers";

/**
 * Cât timp site-ul nou stă pe un URL `*.vercel.app`, indexarea e închisă
 * complet.
 *
 * Motivul: e aceeași marfă, aceleași texte și aceleași prețuri ca pe
 * anvelope-ungheni.md. Lăsat la vedere, Google alege singur care versiune e
 * „originalul" — și poate alege preview-ul. Se deschide automat când
 * NEXT_PUBLIC_SITE_URL arată spre domeniul real.
 */
const PREVIEW = /vercel\.app$/.test(new URL(SITE_URL).hostname);

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
