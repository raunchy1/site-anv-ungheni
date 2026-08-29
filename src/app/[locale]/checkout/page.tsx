import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { TreadRule } from "@/components/icons";
import { CheckoutForm } from "@/components/cart/CheckoutForm";
import { getSettings } from "@/lib/db/queries";
import type { Locale } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const settings = await getSettings();

  return (
    <div className="shell py-[var(--sp-6)]">
      <Breadcrumb
        items={[
          { label: t("nav.home"), href: locale === "ru" ? "/ru" : "/" },
          { label: t("cart.title"), href: locale === "ru" ? "/ru/korzina" : "/cos" },
          { label: t("checkout.title") },
        ]}
      />
      <h1 className="optical-left mt-[var(--sp-4)] text-700 font-semibold tracking-[var(--tr-title)] text-[var(--ink-strong)]">
        {t("checkout.title")}
      </h1>
      <TreadRule variant="mark" width={128} className="mt-[var(--sp-3)] text-[var(--accent)]" />
      <CheckoutForm
        locale={locale as Locale}
        phone={settings.phone_display}
        phoneE164={settings.phone_e164}
        oras={settings.city}
      />
    </div>
  );
}
