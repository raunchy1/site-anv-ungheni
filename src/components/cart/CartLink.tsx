"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { IconCart } from "@/components/icons";
import { useCart } from "@/lib/cart/store";
import { cn } from "@/lib/cn";

/**
 * Legătura spre coș, cu numărul de bucăți.
 *
 * Contorul e singurul loc din antet unde apare roșul, și apare doar când există
 * marfă în coș — adică exact atunci când e o acțiune de dus la capăt. Restul
 * timpului antetul rămâne alb-negru, cum a fost proiectat.
 *
 * Numărul e citit din `localStorage` după montare, deci prima randare nu-l are.
 * Pastila nu apare deloc până atunci: o pastilă cu „0" care sare la „4" e mai
 * rea decât una care apare o dată.
 */
export function CartLink({ variant = "header" }: { variant?: "header" | "mobile" }) {
  const t = useTranslations("nav");
  const { count, gata } = useCart();
  const arata = gata && count > 0;

  if (variant === "mobile") {
    return (
      <Link
        href="/cos"
        className="relative flex flex-1 flex-col items-center gap-[2px] py-[var(--sp-2)] text-[var(--fs-100)] text-[var(--ink-muted)]"
      >
        <span className="relative">
          <IconCart size={20} />
          {arata ? <Pastila n={count} /> : null}
        </span>
        <span>{t("cart")}</span>
      </Link>
    );
  }

  return (
    <Link href="/cos" className="icon-button relative" aria-label={`${t("cart")}${arata ? `: ${count}` : ""}`}>
      <IconCart size={18} />
      {arata ? <Pastila n={count} /> : null}
    </Link>
  );
}

function Pastila({ n }: { n: number }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "num absolute -right-[6px] -top-[6px] inline-flex min-w-[17px] items-center justify-center",
        "rounded-full bg-[var(--accent)] px-[var(--sp-1)] py-[1px]",
        "text-[10px] font-semibold leading-[1.3] text-[var(--on-accent)]",
      )}
    >
      {n > 99 ? "99+" : n}
    </span>
  );
}
