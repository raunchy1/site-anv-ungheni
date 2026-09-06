import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog/CatalogView";
import { getTranslations } from "next-intl/server";
import type { Brand, Locale } from "@/lib/types";

export function brandMetadata(b: Brand | null, locale: Locale): Metadata {
  if (!b) return {};
  const title = (locale === "ru" ? b.meta_title_ru : b.meta_title_ro) ?? `Anvelope ${b.name}`;
  const roPath = `/${b.slug_ro}`;
  const ruPath = `/${b.slug_ru ?? b.slug_ro}`;
  /* Cele 22 de mărci fără meta-descriere în bază — cele create la importurile din
     septembrie — ar fi moștenit descrierea paginii principale, adică ar fi arătat
     identic în rezultate cu restul site-ului. Rezerva numește marca. */
  const description = (locale === "ru" ? b.meta_desc_ru : b.meta_desc_ro)
    ?? (locale === "ru"
      ? `Шины ${b.name} в наличии: цены в MDL, все размеры, характеристики. Доставка по всей Молдове за 1–3 дня, шиномонтаж в мастерской в Унгенах.`
      : `Anvelope ${b.name} în stoc: prețuri în MDL, toate dimensiunile, specificații complete. Livrare în toată Moldova în 1–3 zile, montaj în atelierul din Ungheni.`);

  return {
    title,
    description,
    alternates: {
      canonical: locale === "ru" ? `/ru${ruPath}` : roPath,
      languages: { ro: roPath, ru: `/ru${ruPath}`, "x-default": roPath },
    },
    openGraph: { title, description, url: locale === "ru" ? `/ru${ruPath}` : roPath, type: "website" },
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
      title={t("brandPage.title", { brand: brand.name })}
      brandLogo={{ name: brand.name, src: brand.logo_url, onDark: brand.logo_on_dark, ratio: brand.logo_ratio }}
    />
  );
}
