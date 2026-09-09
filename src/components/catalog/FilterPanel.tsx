import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { activeFilterCount, type ParsedFilters } from "@/lib/catalog-filters";
import type { CatalogHref } from "./hrefs";
import { sizeTree } from "@/lib/size-tree";
import type { Brand, Locale, Season } from "@/lib/types";
import { UnavailableToggle } from "./UnavailableToggle";
import { FiltersShell } from "./FiltersShell";

const SEASONS: Season[] = ["vara", "iarna", "all_season"];

/**
 * Filtrele sunt linkuri, nu formular: fiecare combinație e o rută reală,
 * partajabilă și indexabilă. Contoarele vin din arborele de dimensiuni,
 * generat din bază la build — nu dintr-un COUNT(*) pe 15.010 rânduri.
 */
export async function FilterPanel({
  locale, filters, brands, activeCount, availableTotal, unavailableTotal, includeUnavailable,
  hrefClear, hrefUnavailable, hrefFor,
}: {
  locale: Locale;
  filters: ParsedFilters;
  brands: Brand[];
  activeCount: number;
  availableTotal: number;
  unavailableTotal: number;
  includeUnavailable: boolean;
  hrefClear: CatalogHref;
  hrefUnavailable: { on: CatalogHref; off: CatalogHref };
  hrefFor: (patch: Partial<Omit<ParsedFilters, "unknown">>) => CatalogHref;
}) {
  const t = await getTranslations();

  /* Orice schimbare de filtru readuce lista la prima pagină: pagina 7 a unei
     alte selecții e, aproape mereu, o pagină care nu există. */
  const linkTo = (patch: Partial<Omit<ParsedFilters, "unknown">>) => hrefFor({ ...patch, page: 1 });

  /*
   * LINKURILE CARE DUC ÎN AFARA INDEXULUI SE ÎNCHID ȘI LA URMĂRIRE.
   *
   * `isIndexable` oprea indexarea peste trei filtre, dar nu și crawlarea: de pe
   * orice pagină, panoul ăsta oferă 20 de lățimi × 3 sezoane × ~100 de mărci,
   * iar un robot le urmărește în adâncime. Spațiul reachable era de ordinul
   * sutelor de mii de pagini — și fiecare, până acum, o randare cu interogări în
   * bază. `nofollow` îl închide exact acolo unde se închidea și indexul.
   *
   * Nu se pierde nimic: paginile astea erau `noindex` oricum.
   */
  const relFor = (patch: Partial<Omit<ParsedFilters, "unknown">>) =>
    activeFilterCount({ ...filters, ...patch, page: 1, unknown: [] }) > 3 ? "nofollow" : undefined;

  const widths = Object.keys(sizeTree);
  const aspects = filters.width ? Object.keys(sizeTree[String(filters.width)]?.[2] ?? {}) : [];
  const diameters = filters.width && filters.aspect
    ? Object.keys(sizeTree[String(filters.width)]?.[2]?.[String(filters.aspect)]?.[2] ?? {})
    : [];

  const body = (
    <div className="flex flex-col gap-[var(--sp-6)]">
      <Suspense fallback={<div className="h-6" aria-hidden />}>
        <UnavailableToggle
          checked={includeUnavailable}
          label={t("catalog.showUnavailable")}
          count={unavailableTotal}
          hrefOn={hrefUnavailable.on}
          hrefOff={hrefUnavailable.off}
        />
      </Suspense>


      {activeCount > 0 && (
        <Link href={hrefClear} className="nav-link text-200 underline">
          {t("catalog.clear")}
        </Link>
      )}

      <FilterGroup title={t("size.width")}>
        {widths.map((w) => (
          <FilterChip key={w} href={linkTo({ width: filters.width === Number(w) ? undefined : Number(w), aspect: undefined, diameter: undefined })} rel={relFor({ width: Number(w), aspect: undefined, diameter: undefined })} active={filters.width === Number(w)} label={w} count={sizeTree[w][1]} />
        ))}
      </FilterGroup>

      {filters.width && (
        <FilterGroup title={t("size.aspect")}>
          {aspects.map((a) => (
            <FilterChip key={a} href={linkTo({ aspect: filters.aspect === Number(a) ? undefined : Number(a), diameter: undefined })} rel={relFor({ aspect: Number(a), diameter: undefined })} active={filters.aspect === Number(a)} label={a} count={sizeTree[String(filters.width)][2][a][1]} />
          ))}
        </FilterGroup>
      )}

      {filters.width && filters.aspect && (
        <FilterGroup title={t("size.diameter")}>
          {diameters.map((d) => (
            <FilterChip key={d} href={linkTo({ diameter: filters.diameter === d ? undefined : d })} rel={relFor({ diameter: d })} active={filters.diameter === d} label={d} count={sizeTree[String(filters.width)][2][String(filters.aspect)][2][d][1]} />
          ))}
        </FilterGroup>
      )}

      <FilterGroup title={t("catalog.season")}>
        {SEASONS.map((s) => (
          <FilterChip key={s} href={linkTo({ season: filters.season === s ? undefined : s })} rel={relFor({ season: s })} active={filters.season === s} label={t(`season.${s}`)} />
        ))}
      </FilterGroup>

      <FilterGroup title={t("catalog.brand")}>
        <div className="scroll-x max-h-[280px] w-full overflow-y-auto pr-[var(--sp-2)]">
          <ul className="flex flex-col gap-[var(--sp-1)]">
            {brands.filter((b) => b.product_count > 0).map((b) => {
              const slug = (locale === "ru" ? b.slug_ru : b.slug_ro) ?? b.slug_ro;
              const active = filters.brand === b.slug_ro || filters.brand === b.slug_ru;
              return (
                <li key={b.id}>
                  <Link
                    href={linkTo({ brand: active ? undefined : slug })}
                    rel={relFor({ brand: slug })}
                    prefetch={false}
                    className={active ? "brand-filter is-active" : "brand-filter"}
                  >
                    <span className="brand-filter-name">{b.name}</span>
                    {/* Regula de contrast a contorului stă acum lângă clasă, în globals.css. */}
                    <span className="num brand-filter-count">{b.product_count}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </FilterGroup>
    </div>
  );

  /* Un singur exemplar al filtrelor, pentru ambele forme. Vezi FiltersShell. */
  return (
    <FiltersShell
      label={activeCount ? t("catalog.filtersApplied", { count: activeCount }) : t("catalog.filters")}
      resultsLabel={t("catalog.results", { count: includeUnavailable ? availableTotal + unavailableTotal : availableTotal })}
      closeLabel={t("catalog.apply")}
    >
      {body}
    </FiltersShell>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="label">{title}</h2>
      <div className="mt-[var(--sp-3)] flex flex-wrap gap-[var(--sp-2)]">{children}</div>
    </section>
  );
}

/*
 * `prefetch={false}`: un catalog are ~130 de chipsuri, iar preîncărcarea le cere
 * pe toate cele vizibile de la server, ca randări întregi. Nimeni nu apasă 130
 * de filtre; costul îl plăteau baza și bugetul de transfer, la fiecare vizită.
 */
function FilterChip({ href, active, label, count, rel }: { href: React.ComponentProps<typeof Link>["href"]; active: boolean; label: string; count?: number; rel?: string }) {
  return (
    <Link
      href={href}
      rel={rel}
      prefetch={false}
      aria-current={active ? "true" : undefined}
      className={active ? "num filter-chip is-active" : "num filter-chip"}
    >
      {label}
      {count != null && <span className="filter-chip-count">{count}</span>}
    </Link>
  );
}
