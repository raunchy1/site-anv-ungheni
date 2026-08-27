"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { IconChevronDown, IconSearch, TyreSeasonMark } from "@/components/icons";
import { aspectsFor, countFor, diametersFor, widths } from "@/lib/size-tree";
import { formatCount } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { Season, SizeFacets } from "@/lib/types";

/**
 * PANOUL DE CĂUTARE — forma cerută de client, după `tireo.ro`: cinci liste
 * numerotate, una sub alta, într-un panou închis, plus placa cu cele trei
 * sezoane dedesubt.
 *
 * Diferența față de referință e în cifre, nu în formă: fiecare opțiune poartă
 * numărul REAL de anvelope disponibile, iar listele se restrâng una pe alta —
 * înălțimile sunt cele care există pe lățimea aleasă, mărcile sunt cele care
 * există pe dimensiunea aleasă. Nu există combinație care duce la zero rezultate.
 *
 * Sezonul și marca funcționează și SINGURE, fără dimensiune: cine vrea „toate
 * anvelopele de iarnă Michelin" nu e obligat să treacă prin trei liste. Cât
 * timp dimensiunea e incompletă, contoarele lor vin din totalurile de catalog;
 * de îndată ce e completă, din `/api/facets`, adică de pe dimensiunea aleasă.
 *
 * `<select>` nativ, nu meniu rescris: pe mobil deschide roata sistemului.
 */

export type BrandOption = { slug: string; name: string; count: number };

const SEASONS: Season[] = ["vara", "all_season", "iarna"];

export function TireFinder({
  locale,
  brands,
  seasonCounts,
  className,
}: {
  locale: Locale;
  /** Mărcile din catalog, cu numărul lor de produse — pentru starea fără dimensiune. */
  brands: readonly BrandOption[];
  seasonCounts: Record<Season, number>;
  className?: string;
}) {
  const d = t(locale);
  const router = useRouter();
  const [width, setWidth] = useState("");
  const [aspect, setAspect] = useState("");
  const [diameter, setDiameter] = useState("");
  const [season, setSeason] = useState("");
  const [brand, setBrand] = useState("");
  const [facets, setFacets] = useState<(SizeFacets & { key: string }) | null>(null);

  /** La a doua vizită, dimensiunea e precompletată: șoferul are aceeași mașină. */
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("au:size") ?? "null");
      // `localStorage` nu exista la randarea pe server, deci citirea DUPA montare
      // e singura varianta care nu produce nepotrivire de hidratare. Costa o
      // randare in plus, o singura data, la vizitele cu dimensiune salvata.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved?.width) { setWidth(saved.width); setAspect(saved.aspect ?? ""); setDiameter(saved.diameter ?? ""); }
    } catch { /* localStorage indisponibil sau conținut invalid */ }
  }, []);

  useEffect(() => {
    try {
      if (width) localStorage.setItem("au:size", JSON.stringify({ width, aspect, diameter }));
      else localStorage.removeItem("au:size");
    } catch { /* mod privat */ }
  }, [width, aspect, diameter]);

  const sizeKey = width && aspect && diameter ? `${width}/${aspect}/${diameter}` : null;

  useEffect(() => {
    if (!sizeKey) return;
    const [w, a, dia] = sizeKey.split("/");
    const ctrl = new AbortController();
    const qs = new URLSearchParams({ latime: w, inaltime: a, diametru: dia });
    fetch(`/api/facets?${qs}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((f: SizeFacets | null) => { if (f) setFacets({ ...f, key: sizeKey }); })
      .catch(() => { /* cerere anulată sau rețea căzută */ });
    return () => ctrl.abort();
  }, [sizeKey]);

  const current = facets?.key === sizeKey ? facets : null;

  /** Marca aleasă rămâne validă doar dacă există pe dimensiunea curentă. */
  const brandList: BrandOption[] = current
    ? current.brands.filter((b) => b.available > 0).map((b) => ({ slug: b.slug, name: b.value, count: b.available }))
    : [...brands];
  const seasonCount = (s: Season) =>
    current ? (current.seasons.find((o) => o.value === s)?.available ?? 0) : seasonCounts[s];

  const activeBrand = brandList.some((b) => b.slug === brand) ? brand : "";
  const activeSeason = !season || seasonCount(season as Season) > 0 ? season : "";

  const [, avail] = countFor(width || null, aspect || null, diameter || null);
  const anything = Boolean(width || activeSeason || activeBrand);

  function search() {
    const segments = [
      width ? `latime_${width}` : null,
      aspect ? `inaltime_${aspect}` : null,
      diameter ? `diametru_${diameter.toLowerCase()}` : null,
      activeSeason ? `sezon_${activeSeason === "all_season" ? "all-season" : activeSeason}` : null,
      activeBrand ? `marca_${activeBrand}` : null,
    ].filter(Boolean);
    const root = locale === "ru" ? "/ru/katalog-shin" : "/catalog-anvelope";
    router.push(segments.length ? `${root}/${segments.join("/")}` : root);
  }

  const catalogHref = locale === "ru" ? "/ru/katalog-shin" : "/catalog-anvelope";

  return (
    <div className={cn("flex flex-col", className)}>
      <section
        className="rounded-t-[var(--radius-md)] bg-[var(--panel)] px-[var(--sp-5)] py-[var(--sp-5)] text-[var(--panel-ink)]"
        aria-label={d.sizeSelectorTitle}
      >
        <h2 className="text-center text-200 font-semibold uppercase tracking-[var(--tr-label)]">
          {d.findBySpecs}
        </h2>

        <div className="mt-[var(--sp-4)] flex flex-col gap-[var(--sp-2)]">
          <PanelSelect
            n={1} label={d.width} value={width}
            onChange={(v) => { setWidth(v); setAspect(""); setDiameter(""); }}
            options={widths.map((w) => ({ value: w, label: w, count: countFor(w, null, null)[1] }))}
          />
          <PanelSelect
            n={2} label={d.aspect} value={aspect} disabled={!width}
            onChange={(v) => { setAspect(v); setDiameter(""); }}
            options={aspectsFor(width || null).map((a) => ({ value: a, label: a, count: countFor(width, a, null)[1] }))}
          />
          <PanelSelect
            n={3} label={d.diameter} value={diameter} disabled={!aspect}
            onChange={setDiameter}
            options={diametersFor(width || null, aspect || null).map((dia) => ({
              value: dia, label: dia, count: countFor(width, aspect, dia)[1],
            }))}
          />
          <PanelSelect
            n={4} label={d.season} value={activeSeason} onChange={setSeason}
            options={SEASONS.map((s) => ({
              value: s,
              label: d[s === "vara" ? "summer" : s === "iarna" ? "winter" : "allSeason"],
              count: seasonCount(s),
            }))}
          />
          <PanelSelect
            n={5} label={d.brand} value={activeBrand} onChange={setBrand}
            options={brandList.map((b) => ({ value: b.slug, label: b.name, count: b.count }))}
          />
        </div>

        <div className="mt-[var(--sp-4)] flex items-center justify-between gap-[var(--sp-3)]">
          {/* „Căutare avansată" duce în catalog, unde stau filtrele care nu încap
              în cinci liste: indice de sarcină, indice de viteză, XL, Run Flat,
              preț. Nu e un al doilea panou, e aceeași pagină cu tot panoul de filtre. */}
          <a
            href={catalogHref}
            className="text-200 text-[var(--panel-muted)] underline-offset-4 transition-colors duration-[var(--dur-1)] hover:text-[var(--panel-ink)] hover:underline"
          >
            {d.advancedSearch} +
          </a>

          <button
            type="button"
            onClick={search}
            disabled={!anything}
            className={cn(
              "inline-flex h-11 min-w-[9rem] items-center justify-center gap-[var(--sp-2)]",
              "rounded-[var(--radius-sm)] bg-[var(--accent)] px-[var(--sp-5)]",
              "text-300 font-semibold text-[var(--on-accent)]",
              "transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)]",
              "hover:bg-[var(--accent-hover)] disabled:opacity-45",
            )}
          >
            <IconSearch size={17} />
            {d.search}
          </button>
        </div>

        {/* Cifra de sub buton e singura promisiune a panoului: câte anvelope
            găsește selecția curentă. Apare doar când dimensiunea e completă. */}
        {sizeKey ? (
          <p className="mt-[var(--sp-3)] text-center text-200 text-[var(--panel-muted)]" aria-live="polite">
            <span className="num font-semibold text-[var(--panel-ink)]">{formatCount(avail)}</span>{" "}
            {d.resultsAvailable}
          </p>
        ) : null}
      </section>

      {/* ------------------------------------------------ placa cu sezoane -- */}
      <div className="grid grid-cols-3 gap-px rounded-b-[var(--radius-md)] border border-t-0 border-[var(--line-strong)] bg-[var(--line)] overflow-hidden">
        {(["iarna", "all_season", "vara"] as const).map((s) => (
          <a
            key={s}
            href={`${catalogHref}/sezon_${s === "all_season" ? "all-season" : s}`}
            className="flex flex-col items-center gap-[var(--sp-2)] bg-[var(--surface)] px-[var(--sp-2)] py-[var(--sp-4)] text-center transition-colors duration-[var(--dur-1)] hover:bg-[var(--surface-2)]"
          >
            <TyreSeasonMark season={s} size={34} className="text-[var(--ink-strong)]" />
            <span className="text-100 font-semibold uppercase tracking-[var(--tr-label)] text-[var(--ink-strong)]">
              {d[s === "vara" ? "summer" : s === "iarna" ? "winter" : "allSeason"]}
            </span>
            <span className="num text-100 text-[var(--ink-muted)]">{formatCount(seasonCounts[s])}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

/**
 * O listă a panoului: numărul, eticheta și valoarea, pe un singur rând —
 * exact forma din referință. Contorul stă în opțiune, nu lângă etichetă:
 * „Michelin (6)" se citește în momentul alegerii, acolo unde ajută.
 */
function PanelSelect({
  n,
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  n: number;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; count: number }[];
  disabled?: boolean;
}) {
  const empty = !options.length;
  return (
    <div className="relative">
      <select
        aria-label={`${n}. ${label}`}
        value={value}
        disabled={disabled || empty}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-11 w-full appearance-none rounded-[var(--radius-sm)] border border-[var(--panel-line)]",
          "bg-[var(--panel-2)] pl-[var(--sp-3)] pr-[var(--sp-10)] text-300 text-[var(--panel-ink)]",
          "transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)]",
          "hover:border-[var(--panel-muted)] disabled:cursor-not-allowed disabled:opacity-45",
        )}
      >
        <option value="">{`${n}. ${label}`}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.count === 0}>
            {`${o.label} (${o.count})`}
          </option>
        ))}
      </select>
      <IconChevronDown
        size={18}
        className="pointer-events-none absolute right-[var(--sp-3)] top-1/2 -translate-y-1/2 text-[var(--panel-muted)]"
      />
    </div>
  );
}
