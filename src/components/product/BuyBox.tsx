"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { IconCart, IconPhone } from "@/components/icons";
import { WhatsAppButton } from "./WhatsAppButton";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Locale } from "@/lib/types";

const QUANTITIES = [1, 2, 4] as const;

/**
 * Nimeni nu cumpără o singură anvelopă. Prețul bucății rămâne primar — e ce
 * compară clientul în Google — dar setul apare imediat dedesubt, ca să nu facă
 * înmulțirea în cap și să plece. Cantitatea are butoane 1 · 2 · 4, cu 4
 * preselectat, nu un câmp numeric.
 */
export function BuyBox({
  locale, price, title, code, url, phone, phoneHref,
}: {
  locale: Locale;
  price: number;
  title: string;
  code: number;
  url: string;
  phone: string;
  phoneHref: string;
}) {
  const t = useTranslations();
  const [qty, setQty] = useState<number>(4);
  void locale;

  return (
    <div className="flex flex-col gap-[var(--sp-5)]">
      <div className="flex flex-wrap items-baseline gap-x-[var(--sp-6)] gap-y-[var(--sp-1)]">
        <p className="flex items-baseline gap-[var(--sp-2)]">
          <span className="num optical-left text-700 font-semibold tracking-[var(--tr-title)] text-[var(--ink-strong)] sm:text-800">
            {formatPrice(price)}
          </span>
          <span className="text-200 font-medium uppercase tracking-[var(--tr-label)] text-[var(--ink-muted)]">MDL</span>
          <span className="text-200 text-[var(--ink-muted)]">{t("product.each")}</span>
        </p>
        <p className="flex items-baseline gap-[var(--sp-2)]">
          <span className="num text-500 font-medium text-[var(--ink)]">{formatPrice(price * 4)}</span>
          <span className="text-100 font-medium uppercase tracking-[var(--tr-label)] text-[var(--ink-muted)]">MDL</span>
          <span className="text-200 text-[var(--ink-muted)]">{t("product.setOfFour")}</span>
        </p>
      </div>

      <div>
        <p className="label mb-[var(--sp-2)]">{t("product.quantity")}</p>
        <div className="flex items-center gap-[var(--sp-4)]">
          <div className="inline-flex rounded-[var(--radius-sm)] border border-[var(--line)] p-[3px]" role="group" aria-label={t("product.quantity")}>
            {QUANTITIES.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQty(q)}
                aria-pressed={qty === q}
                className={cn(
                  "num min-h-10 min-w-11 rounded-[calc(var(--radius-sm)-3px)] px-[var(--sp-3)] text-300 font-medium",
                  "transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)]",
                  qty === q ? "bg-[var(--ink-strong)] text-[var(--surface)]" : "text-[var(--ink-muted)] hover:text-[var(--ink-strong)]",
                )}
              >
                {q}
              </button>
            ))}
          </div>
          <p className="num text-400 font-medium text-[var(--ink-strong)]" aria-live="polite">
            {formatPrice(price * qty)} <span className="text-100 uppercase tracking-[var(--tr-label)] text-[var(--ink-muted)]">MDL</span>
          </p>
        </div>
      </div>

      {/* Trei acțiuni pe un rând: CTA-ul pe toată lățimea ducea roșul la 5,9%
          din suprafață pe mobil, peste pragul de 5%. */}
      <div className="flex flex-wrap gap-[var(--sp-2)]">
        <Button variant="primary" size="lg" iconStart={<IconCart size={17} />} className="grow sm:grow-0">
          {t("product.addToCart")}
        </Button>
        <WhatsAppButton message={t("wa.product", { title, code, qty, url })} label="WhatsApp" />
        {/* Sub 640px numărul e ascuns și rămâne doar iconița: fără `aria-label`,
            legătura n-ar avea nume accesibil (WCAG 2.4.4). */}
        <a href={phoneHref} aria-label={phone} className="inline-flex min-h-11 items-center gap-[var(--sp-2)] rounded-[var(--radius-sm)] border border-[var(--line-strong)] px-[var(--sp-4)] text-300 text-[var(--ink-strong)] transition-colors duration-[var(--dur-1)] hover:border-[var(--ink-strong)]">
          <IconPhone size={16} />
          <span className="num hidden sm:inline">{phone}</span>
        </a>
      </div>
    </div>
  );
}
