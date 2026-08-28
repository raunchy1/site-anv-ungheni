import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ProductImage } from "@/components/ui/ProductImage";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { SeasonBadge, SpecBadges } from "@/components/ui/Badge";
import { SpecTable, buildSpecRows } from "@/components/ui/SpecTable";
import { StockIndicator } from "@/components/ui/StockIndicator";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ProductCard } from "@/components/ui/ProductCard";
import { Badge } from "@/components/ui/Badge";
import { TreadRule, IconPin, IconPhone } from "@/components/icons";
import { getAlternatives, getNearAlternatives, getRelated, getSettings } from "@/lib/db/queries";
import { toUiProduct } from "@/lib/adapt";
import { absoluteUrl, telLink } from "@/lib/format";
import { t as dict } from "@/lib/i18n";
import { MapEmbed } from "@/components/layout/MapEmbed";
import type { Locale, Product } from "@/lib/types";
import { BuyBox } from "./BuyBox";
import { WhatsAppButton } from "./WhatsAppButton";

export function productMetadata(p: Product | null, locale: Locale): Metadata {
  if (!p) return {};
  const title = (locale === "ru" ? p.meta_title_ru : p.meta_title_ro) ?? (locale === "ru" ? p.title_ru : p.title_ro) ?? p.title_ro;
  const description = (locale === "ru" ? p.meta_desc_ru : p.meta_desc_ro) ?? undefined;
  const roPath = `/${p.slug_ro}`;
  const ruPath = `/${p.slug_ru ?? p.slug_ro}`;
  const unavailable = p.stock_status === "out_of_stock" || p.price_mdl == null;

  return {
    title,
    description,
    // Produsele indisponibile rămân 200 și rămân indexabile ca URL, dar nu în index:
    // 46% din catalog n-are preț, iar Google n-are ce indexa acolo.
    robots: unavailable ? { index: false, follow: true } : undefined,
    alternates: {
      canonical: locale === "ru" ? `/ru${ruPath}` : roPath,
      languages: { ro: roPath, ru: `/ru${ruPath}` },
    },
    openGraph: { title, description, url: absoluteUrl(locale === "ru" ? ruPath : roPath, locale), images: p.image_url ? [p.image_url] : undefined },
  };
}

export async function ProductPage({ product, locale }: { product: Product; locale: Locale }) {
  const t = await getTranslations();
  const d = dict(locale);
  const settings = await getSettings();
  const ui = toUiProduct(product);
  const unavailable = product.stock_status === "out_of_stock" || product.price_mdl == null;

  const [alternatives, near, related] = await Promise.all([
    unavailable ? getAlternatives(product, 4) : Promise.resolve([]),
    unavailable ? getNearAlternatives(product, 4) : Promise.resolve([]),
    getRelated(product.id, 4),
  ]);

  const title = (locale === "ru" ? product.title_ru : product.title_ro) ?? product.title_ro;
  const brandSlug = locale === "ru" ? (product.brand_slug_ru ?? product.brand_slug) : product.brand_slug;
  const productUrl = absoluteUrl(locale === "ru" ? `/${product.slug_ru ?? product.slug_ro}` : `/${product.slug_ro}`, locale);
  const showAlternatives = unavailable && (alternatives.length > 0 || near.length > 0);

  return (
    <article className="shell py-[var(--sp-6)]">
      <Breadcrumb
        items={[
          { label: t("nav.home"), href: locale === "ru" ? "/ru" : "/" },
          { label: t("catalog.title"), href: locale === "ru" ? "/ru/katalog-shin" : "/catalog-anvelope" },
          /* Slug-ul mărcii vine din `brands`, nu din primul cuvânt al slug-ului
             de produs: 2.370 de fișe încep cu „anvelope-" sau cu o formă a
             mărcii care nu e slug de rută, iar acelea trimiteau în 404. */
          ...(product.brand_name && brandSlug
            ? [{ label: product.brand_name, href: `${locale === "ru" ? "/ru" : ""}/${brandSlug}` }]
            : product.brand_name
              ? [{ label: product.brand_name }]
              : []),
          { label: title },
        ]}
      />

      <div className="mt-[var(--sp-5)] grid gap-[var(--sp-8)] lg:grid-cols-[minmax(0,380px)_1fr]">
        <div>
          <ProductImage src={ui.image} alt={title} locale={locale} priority sizes="(min-width: 1024px) 380px, 92vw" />
        </div>

        <div className="min-w-0">
          <BrandLogo name={product.brand_name} src={product.brand_logo_url} onDark={product.brand_logo_on_dark} ratio={product.brand_logo_ratio} size="md" />
          <h1 className="optical-left mt-[var(--sp-2)] text-700 font-semibold tracking-[var(--tr-title)] text-[var(--ink-strong)] sm:text-800">
            {title}
          </h1>
          <TreadRule variant="mark" width={128} className="mt-[var(--sp-3)] text-[var(--accent)]" />

          {/* Sezonul si marcajele de flanc, imediat sub titlu: sunt primele
              lucruri pe care le verifica cineva care stie ce cauta. */}
          <div className="mt-[var(--sp-4)] flex flex-wrap items-center gap-[var(--sp-2)]">
            <SeasonBadge season={ui.season} locale={locale} />
            <SpecBadges product={ui} />
          </div>

          <section className="mt-[var(--sp-8)]">
            <h2 className="label">{t("product.specs")}</h2>
            <SpecTable rows={buildSpecRows(ui, locale)} className="mt-[var(--sp-3)]" />
          </section>

          <div className="mt-[var(--sp-8)] border-t border-[var(--line)] pt-[var(--sp-5)]">
            <div className="mb-[var(--sp-4)] flex flex-wrap items-center gap-[var(--sp-3)]">
              <StockIndicator status={product.stock_status} locale={locale} />
              {settings.credit_badge_ro && !unavailable && (
                <Badge tone="neutral">{locale === "ru" ? settings.credit_badge_ru : settings.credit_badge_ro}</Badge>
              )}
            </div>

            {unavailable ? (
              <div className="flex flex-col gap-[var(--sp-4)]">
                <p className="text-600 font-medium text-[var(--ink-muted)]">{d.priceOnRequest}</p>
                <p className="measure text-300 text-[var(--ink-muted)]">{t("product.unavailableNote")}</p>
                <div className="flex flex-wrap gap-[var(--sp-2)]">
                  <WhatsAppButton
                    variant="primary"
                    message={t("wa.unavailable", { title, url: productUrl })}
                    label={t("product.askOnWhatsApp")}
                  />
                  <a href={telLink(settings.phone_e164)} className="inline-flex min-h-11 items-center gap-[var(--sp-2)] rounded-[var(--radius-sm)] border border-[var(--line-strong)] px-[var(--sp-4)] text-300 text-[var(--ink-strong)]">
                    <IconPhone size={16} />
                    <span className="num">{settings.phone_display}</span>
                  </a>
                </div>
              </div>
            ) : (
              <BuyBox
                locale={locale}
                price={Number(product.price_mdl)}
                title={title}
                code={product.legacy_product_id}
                url={productUrl}
                phone={settings.phone_display}
                phoneHref={telLink(settings.phone_e164)}
              />
            )}
          </div>
        </div>
      </div>

      {showAlternatives && (
        <section className="mt-[var(--sp-12)]">
          <h2 className="text-500 font-semibold text-[var(--ink-strong)]">
            {alternatives.length ? t("product.alternatives") : t("product.nearAlternatives")}
          </h2>
          {!alternatives.length && (
            <p className="mt-[var(--sp-1)] text-200 text-[var(--ink-muted)]">{t("catalog.nearSizes")}</p>
          )}
          <TreadRule variant="full" className="mt-[var(--sp-3)] text-[var(--line)]" />
          <ul className="mt-[var(--sp-5)] grid grid-cols-2 gap-[var(--sp-4)] md:grid-cols-4">
            {(alternatives.length ? alternatives : near).map((p) => (
              <li key={p.id}><ProductCard product={toUiProduct(p)} locale={locale} /></li>
            ))}
          </ul>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-[var(--sp-12)]">
          <h2 className="text-500 font-semibold text-[var(--ink-strong)]">{t("product.similar")}</h2>
          <TreadRule variant="full" className="mt-[var(--sp-3)] text-[var(--line)]" />
          <ul className="mt-[var(--sp-5)] grid grid-cols-2 gap-[var(--sp-4)] md:grid-cols-4">
            {related.map((p) => (
              <li key={p.id}><ProductCard product={toUiProduct(p)} locale={locale} /></li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-[var(--sp-12)] border-t border-[var(--line)] pt-[var(--sp-6)]">
        <h2 className="text-500 font-semibold text-[var(--ink-strong)]">{t("product.whereToBuy")}</h2>
        <div className="mt-[var(--sp-4)] grid gap-[var(--sp-5)] lg:grid-cols-[minmax(0,300px)_1fr]">
          <ul className="space-y-[var(--sp-3)] text-300">
            <li className="flex gap-[var(--sp-3)]"><IconPin size={18} className="mt-[2px] shrink-0 text-[var(--ink-muted)]" /><span>{settings.address}</span></li>
            <li className="flex gap-[var(--sp-3)]"><IconPhone size={18} className="mt-[2px] shrink-0 text-[var(--ink-muted)]" /><a href={telLink(settings.phone_e164)} className="num text-[var(--ink-strong)]">{settings.phone_display}</a></li>
          </ul>
          <MapEmbed
            lat={Number(settings.lat)}
            lng={Number(settings.lng)}
            locale={locale}
            title={t("contact.map")}
            address={settings.address}
            height={260}
            className="overflow-hidden rounded-[var(--radius-sm)] border border-[var(--line)]"
          />
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: title,
            sku: String(product.legacy_product_id),
            brand: product.brand_name ? { "@type": "Brand", name: product.brand_name } : undefined,
            image: product.image_url ?? undefined,
            offers: {
              "@type": "Offer",
              url: productUrl,
              priceCurrency: "MDL",
              price: product.price_mdl == null ? undefined : Number(product.price_mdl),
              availability: unavailable ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
              seller: { "@type": "AutoRepair", name: "anvelope-ungheni.md", telephone: settings.phone_e164, address: settings.address },
            },
          }),
        }}
      />
    </article>
  );
}
