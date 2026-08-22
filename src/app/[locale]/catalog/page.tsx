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

export default async function CatalogPage({
  params, searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  return (
    <CatalogView
      locale={locale as Locale}
      filters={parseFilterSegments([])}
      search={{ pagina: one(sp.pagina), sortare: one(sp.sortare), indisponibile: one(sp.indisponibile) }}
    />
  );
}
