import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { SpriteIcon, type SpriteId } from "@/components/icons";
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
  neutral: "",
  quiet: "badge-quiet",
  summer: "badge-summer",
  winter: "badge-winter",
  allSeason: "badge-all-season",
  accent: "badge-accent",
};

export function Badge({ tone = "neutral", icon, className, children }: BadgeProps) {
  return (
    <span
      className={cn("badge", tones[tone], className)}
    >
      {icon}
      {children}
    </span>
  );
}

/* Desenele vin din sprite, nu inline: insigna asta apare pe fiecare card din
   grila. Vezi nota din `components/icons`. */
const seasonMap = {
  vara: { tone: "summer", icon: "summer", key: "summer" },
  iarna: { tone: "winter", icon: "winter", key: "winter" },
  all_season: { tone: "allSeason", icon: "all-season", key: "allSeason" },
} as const satisfies Record<string, { tone: BadgeTone; icon: SpriteId; key: string }>;

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
    <Badge tone={cfg.tone} icon={<SpriteIcon id={cfg.icon} size={13} />} className={className}>
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
  type Mark = { key: string; icon: SpriteId };
  const marks = ([
    product.isXl ? { key: "XL", icon: "xl" } : null,
    product.isRunflat ? { key: "Run Flat", icon: "runflat" } : null,
    product.isCommercial ? { key: "C", icon: "commercial" } : null,
  ] as (Mark | null)[]).filter((m): m is Mark => m !== null);

  if (!marks.length) return null;
  return (
    <div className={cn("flex flex-wrap gap-[var(--sp-1)]", className)}>
      {marks.map(({ key, icon }) => (
        <Badge key={key} tone="quiet" icon={<SpriteIcon id={icon} size={13} />}>{key}</Badge>
      ))}
    </div>
  );
}
