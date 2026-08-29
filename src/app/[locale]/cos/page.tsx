import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { TreadRule } from "@/components/icons";
import { CartView } from "@/components/cart/CartView";

/**
 * Coșul e o pagină statică: tot conținutul lui vine din `localStorage`, deci
 * serverul n-are ce randa în plus. `noindex` pentru că un coș gol în index e
 * zgomot, iar unul plin nici nu poate exista pentru Google.
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cart" });
  return { title: t("title"), robots: { index: false, follow: true } };
}

export default async function CosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div className="shell py-[var(--sp-6)]">
      <Breadcrumb items={[{ label: t("nav.home"), href: locale === "ru" ? "/ru" : "/" }, { label: t("cart.title") }]} />
      <h1 className="optical-left mt-[var(--sp-4)] text-700 font-semibold tracking-[var(--tr-title)] text-[var(--ink-strong)]">
        {t("cart.title")}
      </h1>
      <TreadRule variant="mark" width={128} className="mt-[var(--sp-3)] text-[var(--accent)]" />
      <CartView />
    </div>
  );
}
