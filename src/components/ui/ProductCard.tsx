import { cn } from "@/lib/cn";
import { Card } from "./Card";
import { ProductImage } from "./ProductImage";
import { Price, PriceOnRequest } from "./PriceOnRequest";
import { StockIndicator } from "./StockIndicator";
import { SeasonBadge, SpecBadges } from "./Badge";
import { BrandLogo } from "./BrandLogo";
import { AddToCartCard } from "@/components/cart/AddToCartCard";
import type { Product } from "@/lib/sample-products";
import type { Locale } from "@/lib/i18n";
import { formatSize, formatIndex, normalizeSpeedIndex } from "@/lib/format";

/**
 * Cardul de produs, ordinea deliberata: marca (eticheta) -> model (titlu) ->
 * dimensiune + indici (mono) -> pret -> stoc.
 *
 * Marca sta imediat sub fotografie, ca logo: e primul lucru pe care il cauta
 * soferul cand compara zece carduri deodata. Cat timp o marca n-are logo
 * incarcat, `BrandLogo` cade pe numele in versale la 11px — aceeasi banda
 * verticala, deci grila nu se misca intre marcile cu si fara logo.
 *
 * Randul cu dimensiunea e in mono si pe fundal coborat: e singura informatie
 * pe care soferul o compara intre carduri, deci trebuie sa cada exact in
 * aceeasi pozitie verticala in toata grila. De aceea titlul e limitat la
 * doua randuri fixe, nu la „cat iese”.
 */
export function ProductCard({
  product,
  locale,
  className,
  priority = false,
}: {
  product: Product;
  locale: Locale;
  className?: string;
  priority?: boolean;
}) {
  const title = locale === "ru" ? product.titleRu : product.title;
  const size = formatSize(product);
  const idx = formatIndex(product.loadIndex, normalizeSpeedIndex(product.speedIndex));
  const href = locale === "ru" ? `/ru/${product.slugRu}` : `/${product.slug}`;
  const unavailable = product.stock === "out_of_stock" || product.price === null;

  return (
    <Card
      interactive
      tone="flat"
      className={cn("group relative flex h-full flex-col p-[var(--sp-3)]", className)}
    >
      <ProductImage
        src={product.image}
        alt={title}
        locale={locale}
        priority={priority}
        className={cn(unavailable && "opacity-70")}
      />

      <div className="card-body">
        <BrandLogo name={product.brand} src={product.brandLogo} onDark={product.brandLogoOnDark} ratio={product.brandLogoRatio} />

        <h3 className="card-name">
          <a
            href={href}
            className="card-title-link"
          >
            {/* Zona de atingere acopera tot cardul, nu doar textul. */}
            <span className="absolute inset-0" aria-hidden="true" />
            {title}
          </a>
        </h3>

        {size ? (
          <p className="card-size">
            <span className="num card-size-main">{size}</span>
            {idx ? <span className="num card-size-index">{idx}</span> : null}
          </p>
        ) : null}

        {product.season || product.isXl || product.isRunflat || product.isCommercial ? (
          <div className="card-marks">
            <SeasonBadge season={product.season} locale={locale} />
            <SpecBadges product={product} />
          </div>
        ) : null}

        <div className="card-foot">
          {unavailable || product.price === null ? (
            <PriceOnRequest locale={locale} size="sm" withPhone={false} />
          ) : (
            <Price value={product.price} locale={locale} size="sm" />
          )}
          <StockIndicator
            status={product.stock}
            locale={locale}
            className="mt-[var(--sp-2)]"
          />

          {/* Doar unde chiar se poate cumpăra: fără preț sau fără `id` din bază,
              butonul ar promite ceva ce nu poate duce la capăt. */}
          {!unavailable && product.price !== null && product.id ? (
            <AddToCartCard
              item={{
                id: product.id,
                slug: locale === "ru" ? product.slugRu : product.slug,
                title,
                price: product.price,
                image: product.image,
                size,
                brand: product.brand,
              }}
            />
          ) : null}
        </div>
      </div>
    </Card>
  );
}
