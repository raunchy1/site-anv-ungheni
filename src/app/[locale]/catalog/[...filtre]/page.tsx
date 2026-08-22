import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CatalogView } from "@/components/catalog/CatalogView";
import { parseFilterSegments, buildFilterSegments, activeFilterCount } from "@/lib/catalog-filters";
import type { Locale } from "@/lib/types";

export const revalidate = 900;

/**
 * Strategia de indexare (ARCHITECTURE.md §5): se indexează dimensiunea completă,
 * sezonul, marca și combinațiile lor. Orice altceva primește `noindex, follow`,
 * ca să nu ținem în index sute de mii de combinații fără trafic.
 */
function isIndexable(f: ReturnType<typeof parseFilterSegments>): boolean {
  if (f.unknown.length) return false;
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
  const canonicalSegments = buildFilterSegments(f);
  const roPath = `/catalog-anvelope/${canonicalSegments.join("/")}`;
  const ruPath = `/ru/katalog-shin/${canonicalSegments.join("/")}`;

  const bits = [
    f.width && f.aspect && f.diameter ? `${f.width}/${f.aspect} ${f.diameter}` : null,
    f.season ? t(`../season.${f.season}` as never) : null,
  ].filter(Boolean);

  return {
    title: bits.length ? `${t("title")} ${bits.join(" ")}` : t("title"),
    robots: isIndexable(f) ? undefined : { index: false, follow: true },
    alternates: {
      canonical: locale === "ru" ? ruPath : roPath,
      languages: { ro: roPath, ru: ruPath },
    },
  };
}

export default async function FilteredCatalogPage({
  params, searchParams,
}: {
  params: Promise<{ locale: string; filtre: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, filtre } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  return (
    <CatalogView
      locale={locale as Locale}
      filters={parseFilterSegments(filtre)}
      search={{ pagina: one(sp.pagina), sortare: one(sp.sortare), indisponibile: one(sp.indisponibile) }}
    />
  );
}
