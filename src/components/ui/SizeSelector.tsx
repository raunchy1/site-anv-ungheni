"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { Button } from "./Button";
import { IconArrowRight, IconClose, IconSummer, IconWinter, IconAllSeason } from "@/components/icons";
import { aspectsFor, countFor, diametersFor, widths } from "@/lib/size-tree";
import { formatCount } from "@/lib/format";
import type { Season, SizeFacets } from "@/lib/types";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

/**
 * ECRANUL CARE CONTEAZA CEL MAI MULT.
 *
 * Soferul stie „205/55 R16” si vrea un pret in trei atingeri. Tot ce urmeaza
 * serveste asta:
 *
 * - AFISAJUL. Sus, in mono, la 33px: `205/55 R16`, cu pozitiile necompletate
 *   ca liniute. Se completeaza sub deget, in timp real. Asta transforma trei
 *   liste de butoane intr-un instrument cu citire — diferenta dintre un
 *   aparat de masura si un formular.
 * - CIFRELE SUNT REALE. Contorul de sub fiecare optiune vine din
 *   `data/raw/products.ndjson`, nu din aproximari. `205 / 55 / R16` = 263 de
 *   anvelope, 135 disponibile. Daca o combinatie n-are stoc, se vede INAINTE
 *   de a fi aleasa, nu dupa.
 * - RESTRANGEREA E DEPENDENTA. Inaltimile sunt cele care exista pe latimea
 *   aleasa. Nu exista optiune care duce la zero rezultate.
 * - ORDINEA E FIXA si e ordinea de pe flancul anvelopei: latime, inaltime,
 *   diametru. Nu se poate incepe cu diametrul, pentru ca nici anvelopa nu se
 *   citeste asa.
 *
 * PASII 4 SI 5 — sezonul si marca — sunt OPTIONALI si vin dupa dimensiune,
 * pentru ca numai atunci contoarele lor pot fi adevarate: „MICHELIN (7)”
 * inseamna sapte anvelope Michelin pe 205/55 R16, nu sapte in tot catalogul.
 * Optiunile lor se cer de la `/api/facets` dupa ce diametrul e ales. Butonul
 * final nu asteapta pasii 4 si 5: trei atingeri raman suficiente.
 *
 * Rosu: exact doua aparitii — linia pasului activ si butonul final. Nimic altundeva.
 */

type Step = { key: "width" | "aspect" | "diameter"; label: string; value: string | null };

const SEASON_ICON = { vara: IconSummer, iarna: IconWinter, all_season: IconAllSeason } as const;

export function SizeSelector({
  locale,
  className,
  compact = false,
}: {
  locale: Locale;
  className?: string;
  /** `compact` = varianta din bara de filtre a catalogului. */
  compact?: boolean;
}) {
  const d = t(locale);
  const router = useRouter();
  const [width, setWidth] = useState<string | null>(null);
  const [aspect, setAspect] = useState<string | null>(null);
  const [diameter, setDiameter] = useState<string | null>(null);
  const [season, setSeason] = useState<Season | null>(null);
  const [brand, setBrand] = useState<string | null>(null);
  /** Faticele poartă dimensiunea pentru care au fost cerute: un răspuns întârziat
      pe 205/55 R16 nu are voie să populeze pașii 4-5 ai altei dimensiuni. */
  const [facets, setFacets] = useState<(SizeFacets & { key: string }) | null>(null);

  /**
   * La a doua vizita selectorul e precompletat: soferul are aceeasi masina.
   * Resetarea e vizibila, nu ascunsa — vezi butonul de sus.
   */
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("au:size") ?? "null");
      if (saved?.width) { setWidth(saved.width); setAspect(saved.aspect ?? null); setDiameter(saved.diameter ?? null); }
    } catch { /* localStorage indisponibil sau continut invalid */ }
  }, []);

  useEffect(() => {
    try {
      if (width) localStorage.setItem("au:size", JSON.stringify({ width, aspect, diameter }));
      else localStorage.removeItem("au:size");
    } catch { /* modul privat */ }
  }, [width, aspect, diameter]);

  const sizeKey = width && aspect && diameter ? `${width}/${aspect}/${diameter}` : null;

  /**
   * Sezonul si marca se numara pe dimensiunea aleasa. Cererea pleaca abia dupa
   * al treilea pas si se anuleaza daca soferul schimba dimensiunea intre timp.
   */
  useEffect(() => {
    if (!sizeKey) return;
    const [w, a, dia] = sizeKey.split("/");
    const ctrl = new AbortController();
    const qs = new URLSearchParams({ latime: w, inaltime: a, diametru: dia });
    fetch(`/api/facets?${qs}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((f: SizeFacets | null) => { if (f) setFacets({ ...f, key: sizeKey }); })
      .catch(() => { /* cerere anulata sau retea cazuta: pasii 4-5 raman goi */ });
    return () => ctrl.abort();
  }, [sizeKey]);

  const current = facets?.key === sizeKey ? facets : null;
  const seasonOptions = current?.seasons ?? [];
  const brandOptions = current?.brands ?? [];
  const loadingFacets = Boolean(sizeKey) && !current;

  /**
   * Alegerile de la pasii 4 si 5 nu se sterg cu `setState` la schimbarea
   * dimensiunii — se ignora pur si simplu cat timp nu exista printre optiunile
   * dimensiunii curente. Acelasi rezultat vizual, fara o a doua randare.
   */
  const pickedSeason = seasonOptions.find((s) => s.value === season);
  const pickedBrand = brandOptions.find((b) => b.slug === brand);
  const activeSeason = pickedSeason ? season : null;
  const activeBrand = pickedBrand ? brand : null;

  /**
   * Filtrele merg in cale, nu in query: sunt rute indexate de ani de zile.
   * Calea se compune din `locale`, nu din contextul de rutare, ca sa functioneze
   * si in `/design-system`, care sta in afara segmentului de limba.
   */
  const catalogRoot = locale === "ru" ? "/ru/katalog-shin" : "/catalog-anvelope";
  const resultsHref =
    width && aspect && diameter
      ? catalogRoot +
        `/latime_${width}/inaltime_${aspect}/diametru_${diameter.toLowerCase()}` +
        (activeSeason ? `/sezon_${activeSeason === "all_season" ? "all-season" : activeSeason}` : "") +
        (activeBrand ? `/marca_${activeBrand}` : "")
      : null;

  function showResults() {
    if (resultsHref) router.push(resultsHref);
  }

  const aspects = useMemo(() => aspectsFor(width), [width]);
  const diameters = useMemo(() => diametersFor(width, aspect), [width, aspect]);

  /**
   * Contorul final. Cat timp pasii 4 si 5 sunt neatinsi, numarul vine din
   * arborele local (instant, fara retea). De indata ce sezonul sau marca sunt
   * alese, vine din incrucisarea faticelor — altfel butonul ar promite 263 de
   * anvelope si pagina ar arata 7.
   */
  const [treeTotal, treeAvail] = countFor(width, aspect, diameter);
  const [total, avail] = ((): [number, number] => {
    if (activeSeason && pickedBrand) {
      const [a, tot] = pickedBrand.bySeason[activeSeason] ?? [0, 0];
      return [tot, a];
    }
    if (pickedBrand) return [pickedBrand.total, pickedBrand.available];
    if (pickedSeason) return [pickedSeason.total, pickedSeason.available];
    return [treeTotal, treeAvail];
  })();

  const steps: Step[] = [
    { key: "width", label: d.width, value: width },
    { key: "aspect", label: d.aspect, value: aspect },
    { key: "diameter", label: d.diameter, value: diameter },
  ];
  const activeIndex = !width ? 0 : !aspect ? 1 : 2;
  const sizeComplete = Boolean(width && aspect && diameter);

  const reset = () => {
    setWidth(null);
    setAspect(null);
    setDiameter(null);
    setSeason(null);
    setBrand(null);
  };

  return (
    <section
      className={cn(
        "rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--surface)]",
        className,
      )}
      aria-label={d.sizeSelectorTitle}
    >
      {/* ---------------------------------------------------------- afisaj -- */}
      <div className="flex flex-wrap items-end justify-between gap-[var(--sp-4)] border-b border-[var(--line-strong)] px-[var(--sp-4)] py-[var(--sp-4)] sm:px-[var(--sp-6)]">
        <div className="min-w-0">
          <p className="label">{d.sizeSelectorTitle}</p>
          <p
            className={cn(
              "num optical-left mt-[var(--sp-2)] font-mono font-semibold",
              "tracking-[var(--tr-title)] text-[var(--ink-strong)]",
              compact ? "text-600" : "text-700 sm:text-800",
            )}
          >
            <Slot value={width} placeholder="000" />
            <span className="text-[var(--ink-faint)]">/</span>
            <Slot value={aspect} placeholder="00" />
            <span className="text-[var(--ink-faint)]">&nbsp;</span>
            <Slot value={diameter} placeholder="R00" />
          </p>
          {/* Sezonul si marca nu incap in afisajul mono fara sa-l rupa optic;
              stau sub el, in text, ca o linie de context. */}
          {activeSeason || activeBrand ? (
            <p className="mt-[var(--sp-2)] text-200 text-[var(--ink-muted)]">
              {[pickedSeason ? d[activeSeason === "vara" ? "summer" : activeSeason === "iarna" ? "winter" : "allSeason"] : null, pickedBrand?.value]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : null}
        </div>

        {width || aspect || diameter ? (
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center gap-[var(--sp-2)] text-200 text-[var(--ink-muted)] transition-colors duration-[var(--dur-1)] hover:text-[var(--ink-strong)]"
          >
            <IconClose size={15} />
            {d.reset}
          </button>
        ) : null}
      </div>

      {/* ---------------------------------------------------------- canale -- */}
      <div className="grid grid-cols-1 divide-y divide-[var(--line)] lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        {steps.map((s, i) => {
          const disabled = i > activeIndex;
          const options =
            s.key === "width" ? widths : s.key === "aspect" ? aspects : diameters;

          return (
            <div key={s.key} className={cn("min-w-0", disabled && "opacity-45")}>
              {/* linia pasului activ — una dintre cele doua aparitii ale rosului */}
              <div
                aria-hidden="true"
                className={cn(
                  "h-[2px] w-full transition-colors duration-[var(--dur-2)] ease-[var(--ease-out)]",
                  i === activeIndex ? "bg-[var(--accent)]" : "bg-transparent",
                )}
              />
              <div className="flex items-baseline justify-between gap-[var(--sp-2)] px-[var(--sp-4)] pb-[var(--sp-2)] pt-[var(--sp-4)] sm:px-[var(--sp-6)]">
                <span className="label">
                  <span className="num mr-[var(--sp-2)] text-[var(--ink-faint)]">
                    {i + 1}
                  </span>
                  {s.label}
                </span>
              </div>

              <div
                className={cn(
                  "scroll-x flex gap-[var(--sp-1)] px-[var(--sp-4)] pb-[var(--sp-4)] sm:px-[var(--sp-6)]",
                  "lg:flex-wrap lg:overflow-visible",
                  compact ? "lg:max-h-none" : "lg:max-h-[15rem] lg:overflow-y-auto",
                )}
                role="group"
                aria-label={s.label}
              >
                {disabled ? (
                  <p className="py-[var(--sp-3)] text-200 text-[var(--ink-muted)]">
                    {i === 1 ? d.pickWidthFirst : d.pickAspectFirst}
                  </p>
                ) : (
                  options.map((opt) => {
                    const [oTotal, oAvail] =
                      s.key === "width"
                        ? countFor(opt, null, null)
                        : s.key === "aspect"
                          ? countFor(width, opt, null)
                          : countFor(width, aspect, opt);
                    const selected = s.value === opt;
                    const empty = oAvail === 0;
                    return (
                      <button
                        key={opt}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          if (s.key === "width") {
                            setWidth(opt === width ? null : opt);
                            setAspect(null);
                            setDiameter(null);
                          } else if (s.key === "aspect") {
                            setAspect(opt === aspect ? null : opt);
                            setDiameter(null);
                          } else {
                            setDiameter(opt === diameter ? null : opt);
                          }
                        }}
                        className={cn(
                          "num flex min-h-11 shrink-0 flex-col items-center justify-center gap-[1px]",
                          "rounded-[var(--radius-xs)] border px-[var(--sp-3)] py-[var(--sp-1)]",
                          "font-mono transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)]",
                          selected
                            ? "border-[var(--ink-strong)] bg-[var(--ink-strong)] text-[var(--ink-invert)]"
                            : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink-strong)] hover:border-[var(--field-line-hover)] hover:bg-[var(--surface-2)]",
                          empty && !selected && "text-[var(--ink-faint)]",
                        )}
                      >
                        <span className="text-300 font-semibold leading-none">
                          {opt}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] leading-none",
                            selected ? "opacity-70" : "text-[var(--ink-muted)]",
                          )}
                        >
                          {formatCount(oAvail)}
                        </span>
                        <span className="sr-only-abs">
                          {oAvail} {d.resultsAvailable} / {oTotal}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* -------------------------------------------------- pasii 4 si 5 --- */}
      <div className="grid grid-cols-1 border-t border-[var(--line)] divide-y divide-[var(--line)] lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:divide-x lg:divide-y-0">
        {/* -------------------------------------------------------- sezon -- */}
        <Channel index={4} label={d.season} optional={d.optional} disabled={!sizeComplete} hint={d.pickDiameterFirst}>
          {loadingFacets ? (
            <p className="py-[var(--sp-3)] text-200 text-[var(--ink-muted)]">{d.loadingOptions}</p>
          ) : (
            seasonOptions.map((o) => {
              const value = o.value as Season;
              const Icon = SEASON_ICON[value];
              const count = pickedBrand ? (pickedBrand.bySeason[value]?.[0] ?? 0) : o.available;
              const selected = activeSeason === value;
              return (
                <Chip
                  key={value}
                  selected={selected}
                  empty={count === 0}
                  count={count}
                  onClick={() => setSeason(selected ? null : value)}
                  label={d[value === "vara" ? "summer" : value === "iarna" ? "winter" : "allSeason"]}
                  icon={<Icon size={16} />}
                />
              );
            })
          )}
        </Channel>

        {/* -------------------------------------------------------- marca -- */}
        <Channel index={5} label={d.brand} optional={d.optional} disabled={!sizeComplete} hint={d.pickDiameterFirst}>
          {loadingFacets ? (
            <p className="py-[var(--sp-3)] text-200 text-[var(--ink-muted)]">{d.loadingOptions}</p>
          ) : (
            /* Marcile fara nicio anvelopa disponibila pe dimensiune nu se
               afiseaza deloc: ar fi 20 de chipsuri moarte care duc la o pagina
               goala. Cele care ajung la 0 DOAR din cauza sezonului raman,
               estompate — acolo cifra spune ceva. */
            brandOptions.filter((o) => o.available > 0).map((o) => {
              const count = activeSeason ? (o.bySeason[activeSeason]?.[0] ?? 0) : o.available;
              const selected = activeBrand === o.slug;
              return (
                <Chip
                  key={o.slug}
                  selected={selected}
                  empty={count === 0}
                  count={count}
                  onClick={() => setBrand(selected ? null : o.slug)}
                  label={o.value}
                />
              );
            })
          )}
        </Channel>
      </div>

      {/* ---------------------------------------------------------- rezultat */}
      <div className="flex flex-wrap items-center justify-between gap-[var(--sp-4)] border-t border-[var(--line-strong)] bg-[var(--bg-sunken)] px-[var(--sp-4)] py-[var(--sp-4)] sm:px-[var(--sp-6)]">
        <p
          className="text-300 text-[var(--ink-muted)]"
          aria-live="polite"
          aria-atomic="true"
        >
          {/* Contorul e in Plex Sans, nu in Mono: in mono, spatiul de grupare
              ocupa o celula intreaga si „7 973” se rupe optic in doua numere.
              Cifrele Sans sunt oricum tabulare, deci alinierea nu se pierde. */}
          <span className="num text-600 font-semibold text-[var(--ink-strong)]">
            {formatCount(avail)}
          </span>{" "}
          {d.resultsAvailable}
          {total > avail ? (
            <span className="text-[var(--ink-faint)]">
              {" "}
              · <span className="num">{formatCount(total - avail)}</span> {d.outOfStock.toLowerCase()}
            </span>
          ) : null}
        </p>

        <Button
          variant="primary"
          size="md"
          onClick={showResults}
          disabled={!sizeComplete || avail === 0}
          iconEnd={<IconArrowRight size={17} />}
          className="max-sm:w-full"
        >
          {d.showResults}
        </Button>
      </div>
    </section>
  );
}

/** Un canal al selectorului: numar, eticheta, si continutul lui derulabil. */
function Channel({
  index,
  label,
  optional,
  disabled,
  hint,
  children,
}: {
  index: number;
  label: string;
  optional: string;
  disabled: boolean;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("min-w-0", disabled && "opacity-45")}>
      <div className="flex items-baseline justify-between gap-[var(--sp-2)] px-[var(--sp-4)] pb-[var(--sp-2)] pt-[var(--sp-4)] sm:px-[var(--sp-6)]">
        <span className="label">
          <span className="num mr-[var(--sp-2)] text-[var(--ink-faint)]">{index}</span>
          {label}
        </span>
        <span className="text-[var(--fs-100)] text-[var(--ink-faint)]">{optional}</span>
      </div>
      <div
        className="scroll-x flex gap-[var(--sp-1)] px-[var(--sp-4)] pb-[var(--sp-4)] sm:px-[var(--sp-6)] lg:max-h-[11rem] lg:flex-wrap lg:overflow-y-auto"
        role="group"
        aria-label={label}
      >
        {disabled ? (
          <p className="py-[var(--sp-3)] text-200 text-[var(--ink-muted)]">{hint}</p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

/**
 * Optiunile pasilor 4 si 5 sunt text, nu cifre: se aseaza pe un rand, cu
 * contorul in paranteza dupa eticheta, ca sa nu forteze o coloana de doua
 * randuri acolo unde numele mărcii e oricum mai lat decat numarul.
 */
function Chip({
  selected,
  empty,
  count,
  label,
  icon,
  onClick,
}: {
  selected: boolean;
  empty: boolean;
  count: number;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={empty && !selected}
      onClick={onClick}
      className={cn(
        "flex min-h-11 shrink-0 items-center gap-[var(--sp-2)] rounded-[var(--radius-xs)] border",
        "px-[var(--sp-3)] py-[var(--sp-1)] text-200 transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)]",
        selected
          ? "border-[var(--ink-strong)] bg-[var(--ink-strong)] text-[var(--ink-invert)]"
          : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink-strong)] hover:border-[var(--field-line-hover)] hover:bg-[var(--surface-2)]",
        empty && !selected && "text-[var(--ink-faint)] opacity-60",
      )}
    >
      {icon}
      <span className="font-medium">{label}</span>
      <span className={cn("num font-mono text-[11px]", selected ? "opacity-70" : "text-[var(--ink-muted)]")}>
        {formatCount(count)}
      </span>
    </button>
  );
}

function Slot({ value, placeholder }: { value: string | null; placeholder: string }) {
  return (
    <span className={value ? "text-[var(--ink-strong)]" : "text-[var(--ink-faint)]"}>
      {value ?? placeholder.replace(/0/g, "–").replace(/R/, "R")}
    </span>
  );
}
