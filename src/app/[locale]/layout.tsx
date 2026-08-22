import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { fontVars } from "../fonts";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MobileBar } from "@/components/layout/MobileBar";
import { getSettings } from "@/lib/db/queries";
import { SITE_URL } from "@/lib/format";
import type { Locale } from "@/lib/types";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t("title"), template: "%s · anvelope-ungheni.md" },
    description: t("metaDescription"),
    alternates: { canonical: locale === "ru" ? "/ru" : "/", languages: { ro: "/", ru: "/ru", "x-default": "/" } },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const settings = await getSettings();

  // v1 e doar light. Tokenii dark rămân scriși în tokens.css, dar nu se activează:
  // jumătate din suprafața de QA pentru un beneficiu pe care un magazin de
  // anvelope nu-l cere. Se pornește schimbând `data-theme`.
  return (
    <html lang={locale} data-theme="light" className={`${fontVars} h-full`} suppressHydrationWarning>
      <body className="min-h-full bg-[var(--surface)] text-[var(--ink)] antialiased">
        <NextIntlClientProvider>
          <a href="#continut" className="skip-link">
            {locale === "ru" ? "К содержимому" : "Sari la conținut"}
          </a>
          <SiteHeader settings={settings} locale={locale as Locale} />
          <main id="continut" className="pb-[calc(var(--sp-16)+56px)] sm:pb-[var(--sp-16)]">
            {children}
          </main>
          <SiteFooter settings={settings} locale={locale as Locale} />
          <MobileBar settings={settings} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
