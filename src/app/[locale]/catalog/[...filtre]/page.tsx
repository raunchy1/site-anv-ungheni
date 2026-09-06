import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CatalogView } from "@/components/catalog/CatalogView";
import { parseFilterSegments, canonicalSegments, activeFilterCount } from "@/lib/catalog-filters";
import { sizeTree } from "@/lib/size-tree";
import { getBrands } from "@/lib/db/queries";
import { descriereCatalogSeo, titluCatalogSeo } from "@/lib/seo/catalog-meta";
import type { Locale } from "@/lib/types";

export const revalidate = 900;
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

  return (
    <CatalogView
      locale={locale as Locale}
      filters={parseFilterSegments(filtre)}
    />
  );
}
