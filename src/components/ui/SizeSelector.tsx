"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";
import { IconArrowRight, IconClose } from "@/components/icons";
import { aspectsFor, countFor, diametersFor, widths } from "@/lib/size-tree";
import { formatCount } from "@/lib/format";
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
 * Rosu: exact doua aparitii — linia pasului activ si butonul final. Nimic altundeva.
 */

type Step = { key: "width" | "aspect" | "diameter"; label: string; value: string | null };

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
  const [width, setWidth] = useState<string | null>(null);
  const [aspect, setAspect] = useState<string | null>(null);
  const [diameter, setDiameter] = useState<string | null>(null);

  const aspects = useMemo(() => aspectsFor(width), [width]);
  const diameters = useMemo(() => diametersFor(width, aspect), [width, aspect]);
  const [total, avail] = countFor(width, aspect, diameter);

  const steps: Step[] = [
    { key: "width", label: d.width, value: width },
    { key: "aspect", label: d.aspect, value: aspect },
    { key: "diameter", label: d.diameter, value: diameter },
  ];
  const activeIndex = !width ? 0 : !aspect ? 1 : 2;

  const reset = () => {
    setWidth(null);
    setAspect(null);
    setDiameter(null);
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
          disabled={!width || !aspect || !diameter || avail === 0}
          iconEnd={<IconArrowRight size={17} />}
          className="max-sm:w-full"
        >
          {d.showResults}
        </Button>
      </div>
    </section>
  );
}

function Slot({ value, placeholder }: { value: string | null; placeholder: string }) {
  return (
    <span className={value ? "text-[var(--ink-strong)]" : "text-[var(--ink-faint)]"}>
      {value ?? placeholder.replace(/0/g, "–").replace(/R/, "R")}
    </span>
  );
}
