"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { IconCart, IconCheck } from "@/components/icons";
import { useCart, type CartItem } from "@/lib/cart/store";
import { cn } from "@/lib/cn";

/**
 * Adăugarea în coș direct din catalog.
 *
 * DOUĂ DECIZII care par mărunte și nu sunt:
 *
 * 1. NU E ROȘU. Pe pagina de produs, „Adaugă în coș" e acțiunea principală și
 *    poartă accentul. Într-o grilă de 30 de carduri, 30 de butoane roșii ar
 *    duce roșul la un sfert din ecran — peste pragul de 5% pe care e construit
 *    tot site-ul — și, mai rău, n-ar mai însemna nimic. Aici e un buton cu
 *    contur, care se întărește la trecerea peste card.
 *
 * 2. STĂ DEASUPRA LINKULUI CARDULUI. Cardul întreg e o legătură (o suprafață
 *    absolută peste tot). Fără `relative z-10` și fără oprirea propagării,
 *    apăsarea butonului ar deschide fișa produsului în loc să adauge în coș.
 *
 * Cantitatea implicită e 4: nimeni nu montează o singură anvelopă. Cine vrea
 * altceva deschide fișa, unde alege 1, 2 sau 4.
 */
export function AddToCartCard({ item }: { item: Omit<CartItem, "qty"> }) {
  const t = useTranslations();
  const { adauga } = useCart();
  const [adaugat, setAdaugat] = useState(false);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        adauga(item, 4);
        setAdaugat(true);
        window.setTimeout(() => setAdaugat(false), 2500);
      }}
      className={cn(
        "relative z-10 mt-[var(--sp-3)] flex min-h-10 w-full items-center justify-center gap-[var(--sp-2)]",
        "rounded-[var(--radius-sm)] border text-200 font-medium",
        "transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)]",
        adaugat
          ? "border-[var(--ink-strong)] bg-[var(--ink-strong)] text-[var(--ink-invert)]"
          : "border-[var(--line)] text-[var(--ink-strong)] hover:border-[var(--ink-strong)] hover:bg-[var(--surface-2)] group-hover:border-[var(--line-contrast)]",
      )}
    >
      {adaugat ? <IconCheck size={15} /> : <IconCart size={15} />}
      <span className="num">{adaugat ? t("cart.added") : `${t("product.addToCart")} · 4`}</span>
    </button>
  );
}
