import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconAllSeason, IconCommercial, IconExtraLoad, IconRunFlat, IconSummer, IconWinter } from "@/components/icons";
import type { Product, Season } from "@/lib/sample-products";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export type BadgeTone = "neutral" | "quiet" | "summer" | "winter" | "allSeason" | "accent";

export type BadgeProps = {
  tone?: BadgeTone;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
};

/**
 * Badge-ul poarta contur si text colorat, niciodata fundal plin colorat.
 * Motivul e aritmetic: intr-o grila de 24 de carduri, 24 de dreptunghiuri
 * pline ar fi mai multa culoare decat butonul de comanda. Conturul pastreaza
 * suprafata coloratului sub 1%.
 */
const tones: Record<BadgeTone, string> = {
  neutral: "border-[var(--line-strong)] text-[var(--ink)]",
  quiet: "border-[var(--line)] text-[var(--ink-muted)]",
  summer: "border-[var(--season-summer)]/45 text-[var(--season-summer)]",
  winter: "border-[var(--season-winter)]/45 text-[var(--season-winter)]",
  allSeason: "border-[var(--season-all)]/45 text-[var(--season-all)]",
  accent: "border-[var(--accent)]/50 text-[var(--accent-ink)]",
};

export function Badge({ tone = "neutral", icon, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[var(--sp-1)] rounded-[var(--radius-xs)] border",
        "px-[var(--sp-2)] py-[2px] text-100 font-semibold",
        "uppercase tracking-[var(--tr-label)] leading-none",
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

const seasonMap = {
  vara: { tone: "summer", Icon: IconSummer, key: "summer" },
  iarna: { tone: "winter", Icon: IconWinter, key: "winter" },
  all_season: { tone: "allSeason", Icon: IconAllSeason, key: "allSeason" },
} as const;

export function SeasonBadge({
  season,
  locale,
  className,
}: {
  /** 7 produse din 15.010 n-au sezon in sursa. Fara insigna, nu cu una goala. */
  season: Season | null;
  locale: Locale;
  className?: string;
}) {
  const cfg = season ? seasonMap[season] : undefined;
  if (!cfg) return null;
  const d = t(locale);
  const label =
    cfg.key === "summer" ? d.summer : cfg.key === "winter" ? d.winter : d.allSeason;
  return (
    <Badge tone={cfg.tone} icon={<cfg.Icon size={13} />} className={className}>
      {label}
    </Badge>
  );
}

/**
 * Marcajele de pe flanc, in ordinea in care se citesc pe anvelopa: XL,
 * Run Flat, C. Nu se traduc — sunt notatii tehnice identice in RO si RU, la
 * fel ca `205/55 R16`. Produsele fara niciunul nu lasa rand gol.
 */
export function SpecBadges({ product, className }: { product: Product; className?: string }) {
  const marks = [
    product.isXl ? { key: "XL", Icon: IconExtraLoad } : null,
    product.isRunflat ? { key: "Run Flat", Icon: IconRunFlat } : null,
    product.isCommercial ? { key: "C", Icon: IconCommercial } : null,
  ].filter((m): m is { key: string; Icon: typeof IconExtraLoad } => m !== null);

  if (!marks.length) return null;
  return (
    <div className={cn("flex flex-wrap gap-[var(--sp-1)]", className)}>
      {marks.map(({ key, Icon }) => (
        <Badge key={key} tone="quiet" icon={<Icon size={13} />}>{key}</Badge>
      ))}
    </div>
  );
}
