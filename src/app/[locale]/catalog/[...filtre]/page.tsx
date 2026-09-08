import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CatalogView } from "@/components/catalog/CatalogView";
import {
  parseFilterSegments, canonicalSegments, activeFilterCount,
  buildFilterSegments, isCanonicalPath, type ParsedFilters,
} from "@/lib/catalog-filters";
import { sizeExists, sizeTree } from "@/lib/size-tree";
import { getBrands } from "@/lib/db/queries";
import { descriereCatalogSeo, titluCatalogSeo } from "@/lib/seo/catalog-meta";
import type { Locale } from "@/lib/types";

/**
 * O zi, nu 15 minute. Fiecare regenerare ISR trimite pagina randată de la
 * funcție spre CDN, iar o pagină de catalog are ~830 KB. La 900 de secunde,
 * cele 380 de rute de filtru puteau produce zeci de GB pe zi de Fast Origin
 * Transfer — exact ce a blocat contul pe 8 septembrie 2026.
 *
 * Prospețimea nu se pierde: prețurile și stocurile vin dintr-un singur import
 * zilnic, iar cronul golește eticheta `catalog` la finalul rulării, deci
 * catalogul se împrospătează imediat DUPĂ sync, nu întrebând din 15 în 15
 * minute dacă s-a schimbat ceva.
 */
export const revalidate = 86400;
export const dynamicParams = true;

/**
 * Cele 190 de rute de filtru indexate de ani de zile pe site-ul vechi se
 * pre-generează la build, în ambele limbi. Segmentele sunt identice în RO și RU;
 * doar prefixul categoriei diferă.
 */
export async function generateStaticParams() {
  const segments: string[][] = [
    ...Object.keys(sizeTree).map((w) => [`latime_${w}`]),
    ...[...new Set(Object.values(sizeTree).flatMap(([, , asp]) => Object.keys(asp)))].map((a) => [`inaltime_${a}`]),
    ...[...new Set(Object.values(sizeTree).flatMap(([, , asp]) =>
      Object.values(asp).flatMap(([, , dia]) => Object.keys(dia))))].map((d) => [`diametru_${d.toLowerCase()}`]),
    ["sezon_vara"], ["sezon_iarna"], ["sezon_all-season"], ["nalichie"],
  ];
  return segments.flatMap((filtre) => [{ locale: "ro", filtre }, { locale: "ru", filtre }]);
}

/**
 * Strategia de indexare (ARCHITECTURE.md §5): se indexează dimensiunea completă,
 * sezonul, marca și combinațiile lor. Orice altceva primește `noindex, follow`,
 * ca să nu ținem în index sute de mii de combinații fără trafic.
 */
function isIndexable(f: ReturnType<typeof parseFilterSegments>): boolean {
  if (f.unknown.length) return false;
  /* Sortarea, paginile 2+ și „arată și indisponibilele" sunt aceeași marfă în
     altă ordine sau în altă felie. Se pot deschide și partaja, dar nu intră în
     index — altfel o singură selecție ar produce zeci de rute duplicate. */
  if (f.sort || (f.page && f.page > 1) || f.includeUnavailable) return false;
  const fullSize = Boolean(f.width && f.aspect && f.diameter);
  const partial = [f.width, f.aspect, f.diameter].filter(Boolean).length;
  if (partial > 0 && !fullSize && partial > 1) return false;
  return activeFilterCount(f) <= 3;
}

/**
 * O ADRESA DE CATALOG E O ADRESA, NU ORICE SIR DE SEGMENTE.
 *
 * Pana acum, ruta accepta absolut orice: `/catalog-anvelope/blabla` raspundea
 * 200 cu tot catalogul, `/catalog-anvelope/latime_9999` raspundea 200 cu zero
 * rezultate, iar `pagina_9999` raspundea 200 cu o lista goala. Fiecare era o
 * pagina reala — patru interogari in Supabase si o intrare noua in cache-ul ISR
 * — si erau infinit de multe. Pe 8 septembrie 2026 asta a insemnat ~7.300 de
 * adrese distincte la fiecare jumatate de ora si un milion de interogari pe zi,
 * pana cand baza a inceput sa raspunda 522 si catalogul s-a golit pe site.
 *
 * De aici incolo: segment nerecunoscut sau dimensiune inexistenta -> 404, o
 * pagina ieftina si finita. Marca se verifica in bază, fiindca lista de marci
 * nu e in cod.
 */
async function ensureRealRoute(f: ParsedFilters): Promise<void> {
  if (f.unknown.length) notFound();
  if (!sizeExists(f.width, f.aspect, f.diameter)) notFound();
  if (f.brand) {
    const brands = await getBrands();
    if (!brands.some((b) => b.slug_ro === f.brand || b.slug_ru === f.brand)) notFound();
  }
}

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string; filtre: string[] }> }): Promise<Metadata> {
  const { locale, filtre } = await params;
  const t = await getTranslations({ locale, namespace: "catalog" });
  const f = parseFilterSegments(filtre);
  /* Canonicul arată spre selecția fără sortare și fără pagină. */
  const canonical = canonicalSegments(f);
  const roPath = canonical.length ? `/catalog-anvelope/${canonical.join("/")}` : "/catalog-anvelope";
  const ruPath = canonical.length ? `/ru/katalog-shin/${canonical.join("/")}` : "/ru/katalog-shin";

  /* Numele mărcii, nu slug-ul: „Michelin", nu „michelin". Titlul e citit de om. */
  const numeMarca = f.brand
    ? (await getBrands()).find((b) => b.slug_ro === f.brand || b.slug_ru === f.brand)?.name
    : undefined;

  const title = titluCatalogSeo(f, numeMarca, locale as Locale, t("title"));

  return {
    title,
    /* Fără asta, toate rutele de filtru moștenesc descrierea paginii principale
       — adică toate arată identic în rezultate. */
    description: descriereCatalogSeo(f, numeMarca, locale as Locale),
    robots: isIndexable(f) ? undefined : { index: false, follow: true },
    alternates: {
      canonical: locale === "ru" ? ruPath : roPath,
      languages: { ro: roPath, ru: ruPath, "x-default": roPath },
    },
    openGraph: {
      title,
      description: descriereCatalogSeo(f, numeMarca, locale as Locale),
      url: locale === "ru" ? ruPath : roPath,
      type: "website",
    },
  };
}

export default async function FilteredCatalogPage({
  params,
}: {
  params: Promise<{ locale: string; filtre: string[] }>;
}) {
  const { locale, filtre } = await params;
  setRequestLocale(locale);

  const filters = parseFilterSegments(filtre);
  await ensureRealRoute(filters);

  /* Aceeasi selectie, o singura adresa: ordinea segmentelor e fixa, `pagina_1`
     nu se scrie, `sezon_all_season` se scrie `sezon_all-season`. Restul se muta
     acolo cu 308, ca sa nu existe doua pagini cu aceeasi marfa. */
  if (!isCanonicalPath(filtre, filters)) {
    const segments = buildFilterSegments(filters);
    const root = locale === "ru" ? "/ru/katalog-shin" : "/catalog-anvelope";
    permanentRedirect(segments.length ? `${root}/${segments.join("/")}` : root);
  }

  return <CatalogView locale={locale as Locale} filters={filters} />;
}
