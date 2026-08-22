import { cn } from "@/lib/cn";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Button } from "@/components/ui/Button";
import { Price, PriceOnRequest } from "@/components/ui/PriceOnRequest";
import { ProductCard } from "@/components/ui/ProductCard";
import { ProductImage } from "@/components/ui/ProductImage";
import { SpecTable, buildSpecRows } from "@/components/ui/SpecTable";
import { StockIndicator } from "@/components/ui/StockIndicator";
import { Badge } from "@/components/ui/Badge";
import { IconCart, IconCompare, IconFavorite, TreadRule } from "@/components/icons";
import type { Product } from "@/lib/sample-products";
import { products } from "@/lib/sample-products";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { formatIndex, formatSize, normalizeSpeedIndex } from "@/lib/format";

/**
 * Pagina de produs, cu date reale, nemodificate.
 *
 * Ierarhia e construita din scara, greutate si spatiu. Culoarea intra ultima
 * si o singura data: butonul „Adaugă în coș”. Titlul nu e rosu, pretul nu e
 * rosu, badge-ul de sezon nu e rosu, conturul cardului nu e rosu.
 *
 * Elementul-semnatura (profilul benzii de rulare) apare exact o data pe acest
 * ecran: sub titlu. A doua aparitie permisa e separatorul de dinaintea
 * alternativelor — pe mobil, unde cele doua nu se vad simultan.
 */
export function ProductPageMockup({
  product,
  locale,
  alternatives,
  className,
  compact = false,
}: {
  product: Product;
  locale: Locale;
  alternatives?: readonly Product[];
  className?: string;
  compact?: boolean;
}) {
  const d = t(locale);
  const title = locale === "ru" ? product.titleRu : product.title;
  const size = formatSize(product);
  const idx = formatIndex(product.loadIndex, normalizeSpeedIndex(product.speedIndex));
  const unavailable = product.stock === "out_of_stock" || product.price === null;

  const alts =
    alternatives ??
    products
      .filter(
        (p) =>
          p.slug !== product.slug &&
          p.stock !== "out_of_stock" &&
          p.price !== null &&
          p.sizeRaw === product.sizeRaw,
      )
      .slice(0, 4);

  return (
    <div className={cn("bg-[var(--bg)] text-[var(--ink)]", className)}>
      {/* --------------------------------------------------------- antet -- */}
      <header className="border-b border-[var(--line)]">
        <div className="flex items-center justify-between gap-[var(--sp-4)] px-[var(--sp-4)] py-[var(--sp-3)] sm:px-[var(--sp-6)]">
          <span className="text-300 font-bold uppercase tracking-[var(--tr-label)] text-[var(--ink-strong)]">
            Anvelope Ungheni
          </span>
          <nav className="flex items-center gap-[var(--sp-5)] text-200 text-[var(--ink-muted)] max-sm:hidden">
            <span>{d.catalog}</span>
            <span>{d.services}</span>
            <span>{d.contact}</span>
          </nav>
          <span className="flex items-center gap-[var(--sp-3)] text-[var(--ink-muted)]">
            <IconFavorite size={18} />
            <IconCompare size={18} />
            <IconCart size={18} />
          </span>
        </div>
      </header>

      <div className="px-[var(--sp-4)] py-[var(--sp-5)] sm:px-[var(--sp-6)] sm:py-[var(--sp-8)]">
        <Breadcrumb
          items={[
            { label: d.home, href: "#" },
            { label: d.catalog, href: "#" },
            ...(product.brand ? [{ label: product.brand, href: "#" }] : []),
            { label: title },
          ]}
        />

        {/* -------------------------------------------------------- fisa -- */}
        <div
          className={cn(
            "mt-[var(--sp-5)] grid gap-[var(--sp-6)]",
            compact ? "grid-cols-1" : "lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-[var(--sp-12)]",
          )}
        >
          <ProductImage
            src={product.image}
            alt={title}
            locale={locale}
            priority
            sizes="(min-width: 1024px) 352px, 90vw"
            className="mx-auto max-w-[22rem]"
          />

          <div className="min-w-0">
            <p className="label optical-left">{product.brand}</p>

            <h1 className="optical-left mt-[var(--sp-2)] text-700 font-semibold leading-snug tracking-[var(--tr-title)] text-[var(--ink-strong)] sm:text-800">
              {title}
            </h1>

            {/* elementul-semnatura, aparitia 1 din maximum 2 pe ecran */}
            <TreadRule variant="mark" width={104} className="mt-[var(--sp-3)] text-[var(--accent)]" />

            <p className="num mt-[var(--sp-4)] flex flex-wrap items-baseline gap-x-[var(--sp-4)] font-mono text-500 font-medium text-[var(--ink-strong)]">
              {size}
              {idx ? <span className="text-400 text-[var(--ink-muted)]">{idx}</span> : null}
            </p>

            {/* ---- tabelul E continutul: 8 produse din 15.010 au descriere -- */}
            <h2 className="label mt-[var(--sp-8)]">{d.specifications}</h2>
            <SpecTable
              rows={buildSpecRows(product, locale)}
              caption={`${d.specifications} — ${title}`}
              className="mt-[var(--sp-2)] border-t border-[var(--line)]"
            />

            {/* ------------------------------------------- pret + actiune -- */}
            <div className="mt-[var(--sp-8)] flex flex-col gap-[var(--sp-4)] border-t border-[var(--line-strong)] pt-[var(--sp-5)]">
              <div className="flex flex-wrap items-end justify-between gap-[var(--sp-4)]">
                {unavailable || product.price === null ? (
                  <PriceOnRequest locale={locale} size="lg" />
                ) : (
                  <Price value={product.price} locale={locale} size="md" />
                )}
                <StockIndicator status={product.stock} locale={locale} className="pb-[var(--sp-2)]" />
              </div>

              {/* Butonul lipseste cand produsul e indisponibil. Nu dezactivat —
                  absent. Un buton gri e o promisiune care nu se tine. */}
              {unavailable ? null : (
                /* Masuratoare, nu preferinta: pe 375px un buton primar
                   full-width de 52px inseamna 5,9% din suprafata ecranului si
                   incalca regula celor 5%. In rand cu cele doua actiuni
                   secundare, acelasi buton ocupa 3,9% — si randul e mai bun si
                   ergonomic, pentru ca toate trei cad sub degetul mare. */
                <div className="flex items-center gap-[var(--sp-2)]">
                  <Button
                    variant="primary"
                    size="lg"
                    iconStart={<IconCart size={18} />}
                    className="min-w-0 flex-1 sm:flex-none"
                  >
                    {d.addToCart}
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    aria-label={d.compare}
                    className="!px-[var(--sp-4)]"
                  >
                    <IconCompare size={17} />
                    <span className="sr-only-abs">{d.compare}</span>
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    aria-label={d.favorite}
                    className="!px-[var(--sp-4)]"
                  >
                    <IconFavorite size={17} />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ------------------------------------------------- alternative -- */}
        {alts.length > 0 ? (
          <section className="mt-[var(--sp-12)]">
            <div className="flex flex-wrap items-baseline justify-between gap-[var(--sp-3)] border-t border-[var(--line-strong)] pt-[var(--sp-5)]">
              <h2 className="text-600 font-semibold tracking-[var(--tr-title)] text-[var(--ink-strong)]">
                {d.alternatives}
              </h2>
              <Badge tone="quiet">
                {size} · {d.exactSize}
              </Badge>
            </div>

            <div className="mt-[var(--sp-5)] grid grid-cols-2 gap-[var(--sp-4)] lg:grid-cols-4">
              {alts.map((p) => (
                <ProductCard key={p.slug} product={p} locale={locale} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
