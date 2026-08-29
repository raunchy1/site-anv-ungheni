import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ProductCard } from "@/components/ui/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { TireFinderPanel } from "@/components/ui/TireFinderPanel";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { TreadRule, IconWhatsApp } from "@/components/icons";
import { getCatalog, getBrands } from "@/lib/db/queries";
import { toUiProduct } from "@/lib/adapt";
import { whatsappLink } from "@/lib/format";
import { activeFilterCount, buildFilterSegments, type ParsedFilters } from "@/lib/catalog-filters";
import { FilterPanel } from "./FilterPanel";
import { SortSelect } from "./SortSelect";
import type { Locale, Product } from "@/lib/types";

const PER_PAGE = 30;

export async function CatalogView({
  locale, filters, title, brandLogo,
}: {
  locale: Locale;
  /** Tot ce ține de listă vine din cale: filtre, sortare, pagină. */
  filters: ParsedFilters;
  title?: string;
  /** Pagina de marcă își pune logo-ul deasupra titlului, dacă are unul încărcat. */
  brandLogo?: { name: string; src: string | null; onDark?: boolean; ratio?: number | null };
}) {
  const t = await getTranslations();
  const page = filters.page && filters.page > 1 ? filters.page : 1;
  const includeUnavailable = filters.includeUnavailable === true;
  const sort = filters.sort ?? "default";

  const [result, brands] = await Promise.all([
    getCatalog({
      width: filters.width, aspect: filters.aspect, diameter: filters.diameter,
      season: filters.season, brand: filters.brand ? brandName(await getBrands(), filters.brand) : undefined,
      includeUnavailable, sort, page, perPage: PER_PAGE,
    }),
    getBrands(),
  ]);

  /**
   * Orice legătură din pagină e o rută, nu un query. `hrefFor` primește ce se
   * schimbă față de starea curentă și returnează calea completă; când nu mai
   * rămâne niciun segment, e catalogul gol, `/catalog-anvelope`.
   */
  const hrefFor = (patch: Partial<Omit<ParsedFilters, "unknown">>) => {
    const segs = buildFilterSegments({ ...filters, ...patch });
    return segs.length
      ? ({ pathname: "/catalog/[...filtre]" as const, params: { filtre: segs } })
      : ({ pathname: "/catalog" as const });
  };

  const heading = title ?? headingFor(filters, t);

  return (
    <div className="shell py-[var(--sp-6)]">
      <Breadcrumb
        items={[
          { label: t("nav.home"), href: locale === "ru" ? "/ru" : "/" },
          { label: t("catalog.title"), href: locale === "ru" ? "/ru/katalog-shin" : "/catalog-anvelope" },
          ...(heading !== t("catalog.title") ? [{ label: heading }] : []),
        ]}
      />

      {brandLogo?.src ? (
        <BrandLogo name={brandLogo.name} src={brandLogo.src} onDark={brandLogo.onDark} ratio={brandLogo.ratio} size="lg" className="mt-[var(--sp-4)]" />
      ) : null}

      <div className="mt-[var(--sp-4)] flex flex-wrap items-baseline justify-between gap-[var(--sp-4)]">
        <h1 className="text-700 font-semibold tracking-[var(--tr-title)] text-[var(--ink-strong)]">{heading}</h1>
        <p className="num text-300 text-[var(--ink-muted)]" aria-live="polite">
          {t("catalog.results", { count: result.total })}
        </p>
      </div>
      <TreadRule variant="full" className="mt-[var(--sp-3)] text-[var(--line)]" />

      <div className="mt-[var(--sp-6)] grid gap-[var(--sp-6)] lg:grid-cols-[240px_1fr]">
        <FilterPanel
          locale={locale}
          filters={filters}
          brands={brands}
          activeCount={activeFilterCount(filters)}
          availableTotal={result.availableTotal}
          unavailableTotal={result.unavailableTotal}
          includeUnavailable={includeUnavailable}
          hrefClear={hrefFor({ width: undefined, aspect: undefined, diameter: undefined, season: undefined, brand: undefined, onlyAvailable: undefined, page: 1 })}
          hrefUnavailable={{
            on: hrefFor({ includeUnavailable: true, page: 1 }),
            off: hrefFor({ includeUnavailable: undefined, page: 1 }),
          }}
          hrefFor={hrefFor}
        />

        <div className="min-w-0">
          <div className="mb-[var(--sp-4)] flex items-center justify-end">
            {/* Căile vin gata construite de pe server: controlul nu mai
                citește query-ul, deci nu mai are nevoie nici de `useSearchParams`,
                nici de graniță Suspense. */}
            <SortSelect
              value={sort}
              hrefs={{
                default: hrefFor({ sort: undefined, page: 1 }),
                price_asc: hrefFor({ sort: "price_asc", page: 1 }),
                price_desc: hrefFor({ sort: "price_desc", page: 1 }),
                name: hrefFor({ sort: "name", page: 1 }),
              }}
            />
          </div>

          {result.items.length === 0 ? (
            <EmptyStateWithWhatsApp locale={locale} filters={filters} unavailableTotal={result.unavailableTotal} />
          ) : (
            <>
              <h2 className="sr-only-abs">{t("catalog.results", { count: result.total })}</h2>
              <ul className="grid grid-cols-2 gap-[var(--sp-4)] sm:grid-cols-3 xl:grid-cols-4">
                {result.items.map((p: Product, i: number) => (
                  <li key={p.id}><ProductCard product={toUiProduct(p)} locale={locale} priority={i < 2} /></li>
                ))}
              </ul>

              {result.pages > 1 && (
                <nav className="mt-[var(--sp-8)] flex flex-wrap items-center gap-[var(--sp-2)]" aria-label={t("catalog.page", { n: page })}>
                  {page > 1 && (
                    <Link href={hrefFor({ page: page - 1 })} className="pagination-link">{t("catalog.prev")}</Link>
                  )}
                  {pageWindow(page, result.pages).map((n) => (
                    <Link
                      key={n}
                      href={hrefFor({ page: n })}
                      aria-current={n === page ? "page" : undefined}
                      className={`pagination-link num ${n === page ? "is-current" : ""}`}
                    >
                      {n}
                    </Link>
                  ))}
                  {page < result.pages && (
                    <Link href={hrefFor({ page: page + 1 })} className="pagination-link">{t("catalog.next")}</Link>
                  )}
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Slug de brand -> numele exact stocat pe produse. */
function brandName(brands: { slug_ro: string; slug_ru: string | null; name: string }[], slug: string): string | undefined {
  return brands.find((b) => b.slug_ro === slug || b.slug_ru === slug)?.name;
}

function headingFor(f: ParsedFilters, t: Awaited<ReturnType<typeof getTranslations>>): string {
  const parts: string[] = [];
  if (f.width && f.aspect && f.diameter) parts.push(`${f.width}/${f.aspect} ${f.diameter}`);
  else if (f.width) parts.push(`${f.width}`);
  else if (f.diameter) parts.push(f.diameter);
  if (f.season) parts.push(t(`season.${f.season}`).toLowerCase());
  return parts.length ? `${t("catalog.title")} ${parts.join(" · ")}` : t("catalog.title");
}

function pageWindow(page: number, pages: number): number[] {
  const span = 2;
  const from = Math.max(1, Math.min(page - span, pages - span * 2));
  const to = Math.min(pages, Math.max(page + span, span * 2 + 1));
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

/**
 * Zero rezultate nu e capăt de drum: mereu o cale înainte.
 *
 * Sub explicație stă panoul de căutare, același de peste tot. Filtrele din
 * stânga rafinează o listă care nu mai există; panoul pornește o căutare nouă,
 * cu contoare care spun dinainte unde e marfă. E singurul loc din catalog unde
 * apar amândouă, și e locul unde asta ajută.
 */
async function EmptyStateWithWhatsApp({
  locale, filters, unavailableTotal,
}: { locale: Locale; filters: ParsedFilters; unavailableTotal: number }) {
  const t = await getTranslations();
  const size = [filters.width, filters.aspect].filter(Boolean).join("/") + (filters.diameter ? ` ${filters.diameter}` : "");
  const wa = whatsappLink(t("wa.catalog", { size: size || "—", season: filters.season ? t(`season.${filters.season}`) : "—" }));

  return (
    <div className="flex flex-col gap-[var(--sp-6)]">
    <EmptyState
      title={t("catalog.empty")}
      body={t("catalog.emptyHint")}
      action={
        <div className="flex flex-wrap items-center gap-[var(--sp-3)]">
          {unavailableTotal > 0 && (
            <Link href={{ pathname: "/catalog/[...filtre]", params: { filtre: buildFilterSegments({ ...filters, includeUnavailable: true, page: undefined }) } }} className="nav-link text-200 underline">
              {t("catalog.showUnavailable")} ({unavailableTotal})
            </Link>
          )}
          <a href={wa} target="_blank" rel="noopener" className="inline-flex items-center gap-[var(--sp-2)] text-200 text-[var(--ink-strong)] underline">
            <IconWhatsApp size={16} /> WhatsApp
          </a>
        </div>
      }
    />
      <div className="max-w-[380px]"><TireFinderPanel locale={locale} /></div>
    </div>
  );
}
