import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ProductCard } from "@/components/ui/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { TreadRule, IconWhatsApp } from "@/components/icons";
import { getCatalog, getBrands } from "@/lib/db/queries";
import { toUiProduct } from "@/lib/adapt";
import { whatsappLink } from "@/lib/format";
import { activeFilterCount, buildFilterSegments, type ParsedFilters } from "@/lib/catalog-filters";
import { FilterPanel } from "./FilterPanel";
import { SortSelect } from "./SortSelect";
import type { Locale, Product } from "@/lib/types";

const PER_PAGE = 30;

type Search = { pagina?: string; sortare?: string; indisponibile?: string };

export async function CatalogView({
  locale, filters, search, title,
}: {
  locale: Locale;
  filters: ParsedFilters;
  search: Search;
  title?: string;
}) {
  const t = await getTranslations();
  const page = Math.max(1, Number(search.pagina ?? 1) || 1);
  const includeUnavailable = search.indisponibile === "1";
  const sort = (["price_asc", "price_desc", "name"] as const).find((s) => s === search.sortare) ?? "default";

  const [result, brands] = await Promise.all([
    getCatalog({
      width: filters.width, aspect: filters.aspect, diameter: filters.diameter,
      season: filters.season, brand: filters.brand ? brandName(await getBrands(), filters.brand) : undefined,
      includeUnavailable, sort, page, perPage: PER_PAGE,
    }),
    getBrands(),
  ]);

  const base = buildFilterSegments(filters);
  const hrefFor = (extra: Record<string, string | undefined>) => {
    const qs = new URLSearchParams();
    if (sort !== "default") qs.set("sortare", sort);
    if (includeUnavailable) qs.set("indisponibile", "1");
    for (const [k, v] of Object.entries(extra)) { if (v === undefined) qs.delete(k); else qs.set(k, v); }
    const q = qs.toString();
    return base.length
      ? ({ pathname: "/catalog/[...filtre]" as const, params: { filtre: base }, query: q ? Object.fromEntries(qs) : undefined })
      : ({ pathname: "/catalog" as const, query: q ? Object.fromEntries(qs) : undefined });
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
          sort={sort}
        />

        <div className="min-w-0">
          <div className="mb-[var(--sp-4)] flex items-center justify-end">
            <SortSelect locale={locale} value={sort} />
          </div>

          {result.items.length === 0 ? (
            <EmptyStateWithWhatsApp locale={locale} filters={filters} unavailableTotal={result.unavailableTotal} />
          ) : (
            <>
              <h2 className="sr-only-abs">{t("catalog.results", { count: result.total })}</h2>
              <ul className="grid grid-cols-2 gap-[var(--sp-4)] sm:grid-cols-3 xl:grid-cols-4">
                {result.items.map((p: Product, i: number) => (
                  <li key={p.id}><ProductCard product={toUiProduct(p)} locale={locale} priority={i < 4} /></li>
                ))}
              </ul>

              {result.pages > 1 && (
                <nav className="mt-[var(--sp-8)] flex flex-wrap items-center gap-[var(--sp-2)]" aria-label={t("catalog.page", { n: page })}>
                  {page > 1 && (
                    <Link href={hrefFor({ pagina: String(page - 1) })} className="pagination-link">{t("catalog.prev")}</Link>
                  )}
                  {pageWindow(page, result.pages).map((n) => (
                    <Link
                      key={n}
                      href={hrefFor({ pagina: n === 1 ? undefined : String(n) })}
                      aria-current={n === page ? "page" : undefined}
                      className={`pagination-link num ${n === page ? "is-current" : ""}`}
                    >
                      {n}
                    </Link>
                  ))}
                  {page < result.pages && (
                    <Link href={hrefFor({ pagina: String(page + 1) })} className="pagination-link">{t("catalog.next")}</Link>
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

/** Zero rezultate nu e capăt de drum: mereu o cale înainte. */
async function EmptyStateWithWhatsApp({
  locale, filters, unavailableTotal,
}: { locale: Locale; filters: ParsedFilters; unavailableTotal: number }) {
  const t = await getTranslations();
  const size = [filters.width, filters.aspect].filter(Boolean).join("/") + (filters.diameter ? ` ${filters.diameter}` : "");
  const wa = whatsappLink(t("wa.catalog", { size: size || "—", season: filters.season ? t(`season.${filters.season}`) : "—" }));

  return (
    <EmptyState
      title={t("catalog.empty")}
      body={t("catalog.emptyHint")}
      action={
        <div className="flex flex-wrap items-center gap-[var(--sp-3)]">
          {unavailableTotal > 0 && (
            <Link href={{ pathname: "/catalog/[...filtre]", params: { filtre: buildFilterSegments(filters) }, query: { indisponibile: "1" } }} className="nav-link text-200 underline">
              {t("catalog.showUnavailable")} ({unavailableTotal})
            </Link>
          )}
          <a href={wa} target="_blank" rel="noopener" className="inline-flex items-center gap-[var(--sp-2)] text-200 text-[var(--ink-strong)] underline">
            <IconWhatsApp size={16} /> WhatsApp
          </a>
        </div>
      }
    />
  );
}
