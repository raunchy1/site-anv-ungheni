import { Fragment } from "react";
import { cn } from "@/lib/cn";

export type Crumb = { label: string; href?: string };

/**
 * Separatorul e o bara oblica, nu un chevron: pe un rand de text de 13px,
 * chevronul e o iconita in plus, iar bara e un caracter care sta pe linia
 * de baza si nu cere aliniere optica separata.
 * Ultimul element nu e link si poarta `aria-current`.
 */
export function Breadcrumb({
  items,
  className,
  label = "Breadcrumb",
}: {
  items: readonly Crumb[];
  className?: string;
  label?: string;
}) {
  return (
    <nav aria-label={label} className={cn("min-w-0", className)}>
      <ol className="flex min-w-0 flex-wrap items-center gap-x-[var(--sp-2)] gap-y-[var(--sp-1)] text-200">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <Fragment key={`${c.label}-${i}`}>
              <li className="min-w-0">
                {last || !c.href ? (
                  <span
                    aria-current={last ? "page" : undefined}
                    className="block truncate text-[var(--ink-muted)]"
                  >
                    {c.label}
                  </span>
                ) : (
                  <a
                    href={c.href}
                    className="block truncate text-[var(--ink-muted)] underline decoration-[var(--line-strong)] decoration-1 underline-offset-[4px] transition-colors duration-[var(--dur-1)] hover:text-[var(--ink-strong)] hover:decoration-[var(--ink-strong)]"
                  >
                    {c.label}
                  </a>
                )}
              </li>
              {last ? null : (
                <li aria-hidden="true" className="text-[var(--ink-faint)]">
                  /
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
