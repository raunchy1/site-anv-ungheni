import { cn } from "@/lib/cn";
import type { StockStatus } from "@/lib/sample-products";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export type StockIndicatorProps = {
  status: StockStatus;
  locale: Locale;
  /** `full` scrie eticheta. `dot` lasa doar patratul, cu text pentru AT. */
  variant?: "full" | "dot";
  className?: string;
};

/**
 * Patrat, nu cerc: cercurile de stoc sunt limbajul dashboard-urilor SaaS.
 * Un patrat de 8px pe grila de 4 e coerent cu restul sistemului.
 *
 * IMPORTANT: „indisponibil” NU e rosu. Rosul e rezervat actiunii principale;
 * daca 46% din catalog ar fi marcat cu rosu, rosul n-ar mai insemna nimic.
 * Indisponibil = contur gol, gri. Absenta culorii E semnalul.
 */
export function StockIndicator({
  status,
  locale,
  variant = "full",
  className,
}: StockIndicatorProps) {
  const d = t(locale);
  const label =
    status === "in_stock" ? d.inStock : status === "supplier" ? d.supplierStock : d.outOfStock;
  // „Disponibil" fara termen ar fi vag, „In stoc" ar fi neadevarat: marfa e la furnizor.
  const note = status === "supplier" ? d.supplierNote : status === "in_stock" ? d.inStockNote : null;

  return (
    <span
      className={cn("stock", status === "out_of_stock" && "stock-out", className)}
    >
      <span className="stock-mark" aria-hidden="true" />
      {variant === "full" ? (
        <span>
          {label}
          {note ? <span className="text-[var(--ink-muted)]"> · {note}</span> : null}
        </span>
      ) : (
        <span className="sr-only-abs">{label}</span>
      )}
    </span>
  );
}
