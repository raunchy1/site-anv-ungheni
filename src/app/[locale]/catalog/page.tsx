import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CatalogView } from "@/components/catalog/CatalogView";
import { parseFilterSegments } from "@/lib/catalog-filters";
import type { Locale } from "@/lib/types";

export const revalidate = 900;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "catalog" });
  return {
    title: t("title"),
    alternates: { canonical: locale === "ru" ? "/ru/katalog-shin" : "/catalog-anvelope",
      languages: { ro: "/catalog-anvelope", ru: "/ru/katalog-shin" } },
  };
}

/**
 * Catalogul fără filtre. Nu citește nimic din query — sortarea și pagina stau
 * în cale — deci pagina e pre-generată la build și servită din CDN.
 */
export default async function CatalogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CatalogView locale={locale as Locale} filters={parseFilterSegments([])} />;
}
