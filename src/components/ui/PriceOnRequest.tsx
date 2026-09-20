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
 * Fara „0 MDL”, fara semn de exclamare, si mai ales fara pret barat INVENTAT.
 * `oldValue` se afiseaza doar cand exista un pret vechi real, mai mare decat
 * cel curent — adica atunci cand cineva chiar a lasat pretul in jos. Un pret
 * taiat scos din burta e minciuna, si o recunoaste oricine a cumparat vreodata
 * ceva online.
 */

export function Price({
  value,
  oldValue = null,
  locale,
  size = "md",
  className,
}: {
  value: number;
  /** Pretul dinainte de reducere. Ignorat daca nu e mai mare decat `value`. */
  oldValue?: number | null;
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
  const redus = oldValue != null && oldValue > value;
  return (
    <div className={cn("flex flex-col gap-[var(--sp-1)]", className)}>
      <p className="flex items-baseline gap-[var(--sp-2)]">
        <span className={cn("num optical-left price-amount", scale)}>{formatPrice(value)}</span>
        <span className="price-currency">MDL</span>
        <span className="sr-only-abs">{d.perTyre}</span>
      </p>
      {redus ? (
        <p className="flex items-baseline gap-[var(--sp-2)] text-200">
          <s className="num text-[var(--ink-muted)]">{formatPrice(oldValue)} MDL</s>
          <span className="font-medium text-[var(--accent)]">
            {d.youSave} {formatPrice(oldValue - value)} MDL
          </span>
        </p>
      ) : null}
    </div>
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
