import { cn } from "@/lib/cn";
import { Card } from "./Card";
import { ProductImage } from "./ProductImage";
import { Price, PriceOnRequest } from "./PriceOnRequest";
import { StockIndicator } from "./StockIndicator";
import { SeasonBadge } from "./Badge";
import type { Product } from "@/lib/sample-products";
import type { Locale } from "@/lib/i18n";
import { formatSize, formatIndex, normalizeSpeedIndex } from "@/lib/format";

/**
 * Cardul de produs, ordinea deliberata: marca (eticheta) -> model (titlu) ->
 * dimensiune + indici (mono) -> pret -> stoc.
 *
 * Marca e sus si mica, nu jos si mare: brandurile n-au logo, deci singura lor
 * identitate e tipografica, iar un cuvant in versale la 11px cu tracking
 * larg citeste ca un cap de fisa, nu ca o eticheta de pret.
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

      <div className="mt-[var(--sp-4)] flex flex-1 flex-col">
        <p className="label optical-left">{product.brand}</p>

        <h3 className="mt-[var(--sp-1)] text-300 font-medium leading-snug text-[var(--ink-strong)]">
          <a
            href={href}
            className="line-clamp-2 min-h-[2.44em] decoration-[var(--line-strong)] decoration-1 underline-offset-[4px] group-hover:underline"
          >
            {/* Zona de atingere acopera tot cardul, nu doar textul. */}
            <span className="absolute inset-0" aria-hidden="true" />
            {title}
          </a>
        </h3>

        {size ? (
          <p className="mt-[var(--sp-3)] flex flex-wrap items-baseline gap-x-[var(--sp-2)] gap-y-[var(--sp-1)]">
            <span className="num font-mono text-300 font-semibold text-[var(--ink-strong)]">
              {size}
            </span>
            {idx ? (
              <span className="num font-mono text-200 text-[var(--ink-muted)]">
                {idx}
              </span>
            ) : null}
          </p>
        ) : null}

        {product.season ? (
          <div className="mt-[var(--sp-3)]">
            <SeasonBadge season={product.season} locale={locale} />
          </div>
        ) : null}

        <div className="mt-auto pt-[var(--sp-4)]">
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
        </div>
      </div>
    </Card>
  );
}
