import type { NextConfig } from "next";
import path from "node:path";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  /**
   * Imagine de container in loc de functii Vercel. `standalone` scrie in
   * `.next/standalone` un server cu doar pachetele pe care le atinge codul —
   * ~200 MB in loc de 1,2 GB, si nimic de instalat la pornire.
   */
  output: "standalone",
  /**
   * Cache-ul ISR care nu mai poate umple discul cu combinatii de filtre din
   * catalog — de ce, in `cache-handler.cjs`. LRU-ul din memorie creste de la
   * 50 MB (implicit) la 256 MB, fiindca acolo stau acum paginile de catalog
   * adanci (~0,8 MB fiecare).
   */
  cacheHandler: path.resolve("./cache-handler.cjs"),
  cacheMaxMemorySize: 256 * 1024 * 1024,
  /**
   * Cronul isi importa pipeline-ul din `tools/sync/pandashop/` prin `import()`
   * cu cale relativa, calculata la executie. Urmaritorul de fisiere al lui Next
   * vede importuri statice, nu si calea asta — fara linia de mai jos, modulele
   * nu ajung in imagine si sincronizarea cade cu „Cannot find module" abia la
   * prima rulare de la 03:00, cand nu se uita nimeni.
   */
  outputFileTracingIncludes: {
    "/api/cron/sync": ["./tools/sync/pandashop/**/*", "./tools/scraper/**/*"],
  },
  /** Indicatorul de dev acopera coltul din stanga-jos in capturile de ecran. */
  devIndicators: false,
  /** Nu generam AGENTS.md / CLAUDE.md in radacina: instructiunile proiectului
      sunt in ARCHITECTURE.md si DECISIONS.md, si nu vrem doua surse. */
  agentRules: false,
  images: {
    /**
     * Imaginile NU mai trec prin `/_next/image`. Redimensionarea o face
     * Supabase, prin `render/image`, si tot el le serveste de pe CDN-ul lui.
     * Motivul complet e in `src/lib/image-loader.ts`; pe scurt, cele 23.099 de
     * fotografii de catalog nu incap in cele 5.000 de transformari pe luna pe
     * care le da planul Hobby.
     *
     * Odata cu loader-ul propriu devin inerte optiunile care configurau
     * optimizatorul Vercel — `remotePatterns`, `formats`, `dangerouslyAllowSVG`,
     * `contentDispositionType`, `contentSecurityPolicy` — si au fost scoase ca
     * sa nu para ca mai apara ceva. Formatul se negociaza acum din `Accept`,
     * deci WebP-ul ramane; iar SVG-urile le lasa loader-ul neatinse.
     */
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    /**
     * Cardurile au maximum 280px pe desktop si ~45vw pe mobil.
     * Lista implicita a Next genereaza 8 variante pe care nu le cere nimeni.
     */
    imageSizes: [96, 128, 192, 256, 350],
    /**
     * 1440 a fost scos. Nimic pe site nu se afiseaza mai lat de 760 px CSS
     * (lightbox-ul fisei de produs); 1080 acopera si asta la 2x. Cat timp a
     * stat in lista, `sizes="(min-width: 1024px) 280px, 45vw"` de pe cardul de
     * catalog il tinea si ca `src` de rezerva — adica o fotografie randata la
     * 1440 px pentru o caseta de 280. Cinci variante in srcset inseamna ~1,3 KB
     * de URL-uri per imagine, ori 52 de imagini pe pagina de catalog, in HTML
     * si inca o data in payload-ul RSC.
     */
    deviceSizes: [640, 828, 1080],
  },
};

export default withNextIntl(nextConfig);
