import { cn } from "@/lib/cn";
import { IconPhone } from "@/components/icons";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";

/**
 * Pretul, in cele doua stari in care poate exista. 6.944 de produse, 46% din
 * catalog, ajung in `PriceOnRequest`. De aceea nu e o „stare de eroare”
 * inghesuita: are aceeasi greutate tipografica si acelasi loc in grila ca pretul.
 *
 * Fara „0 MDL”, fara pret barat inventat, fara semn de exclamare.
 */

export function Price({
  value,
  locale,
  size = "md",
  className,
}: {
  value: number;
  locale: Locale;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const d = t(locale);
  const scale = {
    sm: "text-500",
    md: "text-700",
    lg: "text-900",
  }[size];
  return (
    <p className={cn("flex items-baseline gap-[var(--sp-2)]", className)}>
      <span
        className={cn(
          "num optical-left font-semibold tracking-[var(--tr-title)] text-[var(--ink-strong)]",
          scale,
        )}
      >
        {formatPrice(value)}
      </span>
      <span className="text-200 font-medium uppercase tracking-[var(--tr-label)] text-[var(--ink-muted)]">
        MDL
      </span>
      <span className="sr-only-abs">{d.perTyre}</span>
    </p>
  );
}

export function PriceOnRequest({
  locale,
  size = "md",
  className,
  withPhone = true,
}: {
  locale: Locale;
  size?: "sm" | "md" | "lg";
  className?: string;
  withPhone?: boolean;
}) {
  const d = t(locale);
  const scale = {
    sm: "text-400",
    md: "text-500",
    lg: "text-600",
  }[size];
  return (
    <div className={cn("flex flex-col gap-[var(--sp-2)]", className)}>
      <p
        className={cn(
          "font-medium tracking-[var(--tr-title)] text-[var(--ink-muted)]",
          scale,
        )}
      >
        {d.priceOnRequest}
      </p>
      {withPhone ? (
        <a
          href={`tel:+373${d.callToOrder.replace(/\D/g, "").replace(/^0/, "")}`}
          className={cn(
            "num inline-flex h-11 items-center gap-[var(--sp-2)] self-start",
            "rounded-[var(--radius-xs)] border border-[var(--line-strong)] bg-[var(--surface)]",
            "px-[var(--sp-4)] text-400 font-semibold text-[var(--ink-strong)]",
            "transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)]",
            "hover:border-[var(--ink-muted)] hover:bg-[var(--surface-2)]",
          )}
        >
          <IconPhone size={17} />
          {d.callToOrder}
        </a>
      ) : null}
    </div>
  );
}
