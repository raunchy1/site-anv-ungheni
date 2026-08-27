import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog/CatalogView";
import { getTranslations } from "next-intl/server";
import type { Brand, Locale } from "@/lib/types";

export function brandMetadata(b: Brand | null, locale: Locale): Metadata {
  if (!b) return {};
  const title = (locale === "ru" ? b.meta_title_ru : b.meta_title_ro) ?? `Anvelope ${b.name}`;
  const roPath = `/${b.slug_ro}`;
  const ruPath = `/${b.slug_ru ?? b.slug_ro}`;
  return {
    title,
    description: (locale === "ru" ? b.meta_desc_ru : b.meta_desc_ro) ?? undefined,
    alternates: { canonical: locale === "ru" ? `/ru${ruPath}` : roPath, languages: { ro: roPath, ru: `/ru${ruPath}` } },
  };
}

/**
 * Brandurile n-au logo și n-au descriere în sursă, iar noi nu inventăm nici una,
 * nici alta. Identitatea e tipografică: numele mare, contorul, apoi catalogul
 * filtrat. Pagina trebuie să arate intenționat, nu neterminată.
 */
export async function BrandPage({ brand, locale }: { brand: Brand; locale: Locale }) {
  const t = await getTranslations();
  return (
    <CatalogView
      locale={locale}
      filters={{ brand: locale === "ru" ? (brand.slug_ru ?? brand.slug_ro) : brand.slug_ro, unknown: [] }}
      search={{}}
      title={t("brandPage.title", { brand: brand.name })}
      brandLogo={{ name: brand.name, src: brand.logo_url }}
    />
  );
}
