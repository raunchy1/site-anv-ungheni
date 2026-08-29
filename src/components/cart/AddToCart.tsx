"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { IconCart, IconCheck, IconArrowRight } from "@/components/icons";
import { useCart, type CartItem } from "@/lib/cart/store";
import { cn } from "@/lib/cn";

/**
 * Butonul care adaugă în coș.
 *
 * După apăsare NU se deschide coșul și nu apare o fereastră. Cine cumpără patru
 * anvelope caută adesea și un al doilea set pentru iarnă; a-l scoate din pagină
 * la fiecare adăugare înseamnă a-l trimite înapoi prin filtre.
 *
 * În loc de asta, butonul confirmă pe el însuși — bifă și „Adăugat în coș"
 * pentru trei secunde — și lasă alături o legătură discretă spre coș. Confirmarea
 * ocupă exact aceeași lățime ca textul inițial, ca rândul de acțiuni să nu sară.
 */
export function AddToCart({
  item,
  qty,
  className,
}: {
  item: Omit<CartItem, "qty">;
  qty: number;
  className?: string;
}) {
  const t = useTranslations();
  const { adauga } = useCart();
  const [adaugat, setAdaugat] = useState(false);

  return (
    <div className={cn("flex flex-wrap items-center gap-[var(--sp-3)]", className)}>
      <Button
        variant="primary"
        size="lg"
        iconStart={adaugat ? <IconCheck size={17} /> : <IconCart size={17} />}
        className="grow sm:grow-0"
        onClick={() => {
          adauga(item, qty);
          setAdaugat(true);
          window.setTimeout(() => setAdaugat(false), 3000);
        }}
      >
        {adaugat ? t("cart.added") : t("product.addToCart")}
      </Button>

      {/* Apare doar după prima adăugare: până atunci n-are ce arăta. */}
      {adaugat ? (
        <Link href="/cos" className="nav-link inline-flex items-center gap-[var(--sp-2)] text-200">
          {t("cart.goToCart")}
          <IconArrowRight size={15} />
        </Link>
      ) : null}
    </div>
  );
}
