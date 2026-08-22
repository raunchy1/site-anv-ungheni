import { cn } from "@/lib/cn";
import { IconChevronLeft, IconChevronRight } from "@/components/icons";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

/**
 * Paginare cu linkuri reale. Paginile 2+ raman crawlabile, cu canonical catre
 * ele insele — altfel Google nu descopera produsele de pe pagina 40.
 * Pagina curenta e singurul element cu accent, si e un `<span>`, nu un link.
 * Elipsa e text, nu buton: nu e o actiune.
 */
function windowed(current: number, total: number): (number | "gap")[] {
  const out: (number | "gap")[] = [];
  const push = (n: number | "gap") => out.push(n);
  const near = (n: number) => Math.abs(n - current) <= 1;
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || near(i)) push(i);
    else if (out[out.length - 1] !== "gap") push("gap");
  }
  return out;
}

export function Pagination({
  current,
  total,
  hrefFor,
  locale,
  className,
}: {
  current: number;
  total: number;
  hrefFor: (page: number) => string;
  locale: Locale;
  className?: string;
}) {
  const d = t(locale);
  const items = windowed(current, total);
  const cell =
    "num inline-flex h-11 min-w-11 items-center justify-center rounded-[var(--radius-xs)] " +
    "px-[var(--sp-2)] text-300 font-medium " +
    "transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)]";

  return (
    <nav aria-label={d.page} className={cn("scroll-x flex items-center gap-[var(--sp-1)]", className)}>
      {current > 1 ? (
        <a
          href={hrefFor(current - 1)}
          rel="prev"
          className={cn(cell, "text-[var(--ink)] hover:bg-[var(--surface-2)]")}
          aria-label={d.previous}
        >
          <IconChevronLeft size={18} />
        </a>
      ) : (
        <span className={cn(cell, "text-[var(--ink-faint)]")} aria-hidden="true">
          <IconChevronLeft size={18} />
        </span>
      )}

      {items.map((it, i) =>
        it === "gap" ? (
          <span
            key={`gap-${i}`}
            className="px-[var(--sp-1)] text-300 text-[var(--ink-faint)]"
          >
            …
          </span>
        ) : it === current ? (
          <span
            key={it}
            aria-current="page"
            className={cn(
              cell,
              "border-b-2 border-[var(--accent)] font-semibold text-[var(--ink-strong)]",
            )}
          >
            {it}
          </span>
        ) : (
          <a
            key={it}
            href={hrefFor(it)}
            className={cn(cell, "text-[var(--ink)] hover:bg-[var(--surface-2)]")}
          >
            {it}
          </a>
        ),
      )}

      {current < total ? (
        <a
          href={hrefFor(current + 1)}
          rel="next"
          className={cn(cell, "text-[var(--ink)] hover:bg-[var(--surface-2)]")}
          aria-label={d.next}
        >
          <IconChevronRight size={18} />
        </a>
      ) : (
        <span className={cn(cell, "text-[var(--ink-faint)]")} aria-hidden="true">
          <IconChevronRight size={18} />
        </span>
      )}
    </nav>
  );
}
