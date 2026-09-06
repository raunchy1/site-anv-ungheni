import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { TreadRule, IconPin, IconPhone, IconClock } from "@/components/icons";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo/schema";
import { getSettings } from "@/lib/db/queries";
import { telLink } from "@/lib/format";
import { WhatsAppButton } from "@/components/product/WhatsAppButton";
import { MapEmbed } from "@/components/layout/MapEmbed";
import type { Locale } from "@/lib/types";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return {
    title: t("title"),
    alternates: { canonical: locale === "ru" ? "/ru/kontakty" : "/contact", languages: { ro: "/contact", ru: "/ru/kontakty" } },
  };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const l = locale as Locale;
  const t = await getTranslations();
  const s = await getSettings();

  return (
    <div className="shell py-[var(--sp-6)]">
      <Breadcrumb items={[{ label: t("nav.home"), href: l === "ru" ? "/ru" : "/" }, { label: t("contact.title") }]} />
      <h1 className="optical-left mt-[var(--sp-4)] text-700 font-semibold tracking-[var(--tr-title)] text-[var(--ink-strong)] sm:text-800">
        {t("contact.title")}
      </h1>
      <TreadRule variant="mark" width={128} className="mt-[var(--sp-3)] text-[var(--accent)]" />

      <div className="mt-[var(--sp-8)] grid gap-[var(--sp-8)] lg:grid-cols-[minmax(0,340px)_1fr]">
        <div>
          <dl className="space-y-[var(--sp-5)]">
            <div className="flex gap-[var(--sp-3)]">
              <IconPin size={18} className="mt-[3px] shrink-0 text-[var(--ink-muted)]" />
              <div><dt className="label">{t("contact.address")}</dt><dd className="mt-[var(--sp-1)] text-300 text-[var(--ink-strong)]">{s.address}</dd></div>
            </div>
            <div className="flex gap-[var(--sp-3)]">
              <IconPhone size={18} className="mt-[3px] shrink-0 text-[var(--ink-muted)]" />
              <div>
                <dt className="label">{t("contact.phone")}</dt>
                <dd className="mt-[var(--sp-1)]"><a href={telLink(s.phone_e164)} className="num text-400 font-medium text-[var(--ink-strong)]">{s.phone_display}</a></dd>
                <dd className="mt-[var(--sp-1)] text-200 text-[var(--ink-muted)]"><a href={`mailto:${s.email}`}>{s.email}</a></dd>
              </div>
            </div>
            <div className="flex gap-[var(--sp-3)]">
              <IconClock size={18} className="mt-[3px] shrink-0 text-[var(--ink-muted)]" />
              <div>
                <dt className="label">{t("contact.hours")}</dt>
                <dd className="mt-[var(--sp-1)] text-300 text-[var(--ink-strong)]">{t("contact.hoursValue")}</dd>
              </div>
            </div>
          </dl>

          <div className="mt-[var(--sp-8)]">
            <WhatsAppButton
              variant="primary"
              message={l === "ru" ? "Здравствуйте!" : "Bună ziua!"}
              label="WhatsApp"
            />
          </div>
        </div>

        <MapEmbed
            lat={Number(s.lat)}
            lng={Number(s.lng)}
            locale={l}
            title={t("contact.map")}
            address={s.address}
            height={420}
            className="overflow-hidden rounded-[var(--radius-sm)] border border-[var(--line)]"
          />
      </div>

      {/*
        * Blocul `AutoRepair` care stătea aici s-a mutat în layout, cu un `@id`
        * stabil, ca să fie pe fiecare pagină și ca să existe UNA singură. Două
        * fișe de afacere locală, cu nume diferite („anvelope-ungheni.md" aici,
        * „Anvelope Ungheni" în rest) și cu programul scris de mână într-una din
        * ele, înseamnă pentru Google două afaceri, iar pentru panoul local un
        * program care poate fi cel greșit.
        */}
      <JsonLd
        data={breadcrumbSchema([
          { name: locale === "ru" ? "Главная" : "Acasă", url: locale === "ru" ? "/ru" : "/" },
          { name: t("contact.title"), url: locale === "ru" ? "/ru/kontakty" : "/contact" },
        ])}
      />
    </div>
  );
}
