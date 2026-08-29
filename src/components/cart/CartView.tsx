"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { IconMinus, IconPlus, IconClose, IconArrowRight } from "@/components/icons";
import { useCart } from "@/lib/cart/store";
import { formatPrice } from "@/lib/format";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * COȘUL.
 *
 * Un tabel, nu carduri: patru anvelope identice sunt un rând cu cifra 4, iar
 * ochiul trebuie să poată coborî pe coloana de sume până la total. Cardurile ar
 * împrăștia aceleași cifre pe patru colțuri.
 *
 * Totalul stă lipit jos pe telefon și în coloana din dreapta pe desktop — în
 * ambele cazuri vizibil fără derulare, pentru că e singura cifră pentru care s-a
 * deschis pagina.
 *
 * Livrarea NU se estimează aici. Depinde de localitate, iar o cifră care se
 * schimbă la pasul următor e mai rea decât una care apare o singură dată.
 */
export function CartView() {
  const t = useTranslations();
  const { items, count, subtotal, gata, seteazaCantitatea, scoate } = useCart();

  if (!gata) {
    return (
      <div className="mt-[var(--sp-6)] flex flex-col gap-[var(--sp-3)]" aria-busy="true">
        {[0, 1].map((i) => <Skeleton key={i} className="h-[104px] w-full" />)}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mt-[var(--sp-6)] rounded-[var(--radius-md)] border border-dashed border-[var(--line-strong)] px-[var(--sp-6)] py-[var(--sp-10)]">
        <p className="text-500 font-semibold text-[var(--ink-strong)]">{t("cart.empty")}</p>
        <p className="measure mt-[var(--sp-3)] text-300 text-[var(--ink-muted)]">{t("cart.emptyHint")}</p>
        <Link
          href="/catalog"
          className="nav-link mt-[var(--sp-5)] inline-flex items-center gap-[var(--sp-2)] text-300"
        >
          {t("nav.catalog")}
          <IconArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-[var(--sp-6)] grid gap-[var(--sp-8)] lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
        {items.map((it) => (
          <li key={it.id} className="flex gap-[var(--sp-4)] py-[var(--sp-4)]">
            <Link
              href={{ pathname: "/[slug]", params: { slug: it.slug } }}
              className="relative aspect-square w-[88px] shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--img-plate)]"
              tabIndex={-1}
              aria-hidden="true"
            >
              {it.image ? (
                <Image src={it.image} alt="" fill sizes="88px" className="object-contain mix-blend-multiply" />
              ) : null}
            </Link>

            <div className="flex min-w-0 flex-1 flex-col gap-[var(--sp-2)]">
              <div className="flex items-start justify-between gap-[var(--sp-3)]">
                <div className="min-w-0">
                  <Link
                    href={{ pathname: "/[slug]", params: { slug: it.slug } }}
                    className="text-300 font-medium text-[var(--ink-strong)] hover:underline"
                  >
                    {it.title}
                  </Link>
                  <p className="num mt-[var(--sp-1)] text-200 text-[var(--ink-muted)]">
                    {formatPrice(it.price)} {t("cart.perPiece")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => scoate(it.id)}
                  aria-label={`${t("cart.remove")} ${it.title}`}
                  className="icon-button shrink-0"
                >
                  <IconClose size={16} />
                </button>
              </div>

              <div className="mt-auto flex flex-wrap items-center justify-between gap-[var(--sp-3)]">
                <div
                  className="inline-flex items-center rounded-[var(--radius-sm)] border border-[var(--line)]"
                  role="group"
                  aria-label={t("cart.qty")}
                >
                  <button
                    type="button"
                    onClick={() => seteazaCantitatea(it.id, it.qty - 1)}
                    aria-label="−"
                    className="flex h-10 w-10 items-center justify-center text-[var(--ink-muted)] transition-colors duration-[var(--dur-1)] hover:text-[var(--ink-strong)]"
                  >
                    <IconMinus size={15} />
                  </button>
                  <span className="num w-9 text-center text-300 font-medium text-[var(--ink-strong)]" aria-live="polite">
                    {it.qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => seteazaCantitatea(it.id, it.qty + 1)}
                    aria-label="+"
                    className="flex h-10 w-10 items-center justify-center text-[var(--ink-muted)] transition-colors duration-[var(--dur-1)] hover:text-[var(--ink-strong)]"
                  >
                    <IconPlus size={15} />
                  </button>
                </div>

                <p className="num text-400 font-semibold text-[var(--ink-strong)]">
                  {formatPrice(it.price * it.qty)}{" "}
                  <span className="text-100 font-medium uppercase tracking-[var(--tr-label)] text-[var(--ink-muted)]">MDL</span>
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Rezumatul: lipit jos pe desktop, sub listă pe telefon. */}
      <aside className="lg:sticky lg:top-[76px] rounded-[var(--radius-md)] border border-[var(--line)] p-[var(--sp-5)]">
        <div className="flex items-baseline justify-between gap-[var(--sp-4)]">
          <span className="text-300 text-[var(--ink-muted)]">
            {t("cart.subtotal")}{" "}
            <span className="num">({count} {count === 1 ? t("cart.item") : t("cart.items")})</span>
          </span>
          <span className="num text-600 font-semibold text-[var(--ink-strong)]">{formatPrice(subtotal)}</span>
        </div>
        <p className="num mt-[var(--sp-1)] text-right text-100 uppercase tracking-[var(--tr-label)] text-[var(--ink-muted)]">MDL</p>

        <Link href="/checkout" className="mt-[var(--sp-5)] block">
          <Button variant="primary" size="lg" className="w-full">{t("cart.checkout")}</Button>
        </Link>

        <Link href="/catalog" className="nav-link mt-[var(--sp-4)] inline-flex items-center gap-[var(--sp-2)] text-200">
          {t("cart.continue")}
        </Link>
      </aside>
    </div>
  );
}
