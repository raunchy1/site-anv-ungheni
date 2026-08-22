import { defineRouting } from "next-intl/routing";

/**
 * RO la rădăcină, RU sub /ru. `/ru-ru` nu a existat niciodată pe site-ul vechi
 * și nu se generează — vezi ARCHITECTURE.md §3.
 *
 * Slug-urile de categorie diferă între limbi și au fost extrase din sursă,
 * nu inventate: /catalog-anvelope <-> /ru/katalog-shin.
 */
export const routing = defineRouting({
  locales: ["ro", "ru"],
  defaultLocale: "ro",
  localePrefix: "as-needed",
  pathnames: {
    "/": "/",
    "/catalog": { ro: "/catalog-anvelope", ru: "/katalog-shin" },
    "/catalog/[...filtre]": { ro: "/catalog-anvelope/[...filtre]", ru: "/katalog-shin/[...filtre]" },
    "/tpms": { ro: "/senzori-presiune-anvelope", ru: "/datchiki-davleniya-v-shinah" },
    "/servicii": { ro: "/servicii", ru: "/uslugi" },
    "/contact": { ro: "/contact", ru: "/kontakty" },
    "/cos": { ro: "/cos", ru: "/korzina" },
    "/checkout": { ro: "/checkout", ru: "/oformlenie-zakaza" },
    "/favorite": { ro: "/favorite", ru: "/izbrannoe" },
    "/comparare": { ro: "/comparare", ru: "/sravnenie" },
    "/[slug]": "/[slug]",
  },
});

export type Locale = (typeof routing.locales)[number];
export type AppPathname = keyof typeof routing.pathnames;
