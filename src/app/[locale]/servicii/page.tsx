import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { TreadRule, IconArrowRight } from "@/components/icons";
import { getServices } from "@/lib/db/queries";
import type { Locale } from "@/lib/types";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "services" });
  return {
    title: t("title"),
    alternates: { canonical: locale === "ru" ? "/ru/uslugi" : "/servicii", languages: { ro: "/servicii", ru: "/ru/uslugi" } },
  };
}

export default async function ServicesIndex({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const l = locale as Locale;
  const t = await getTranslations();
  const services = await getServices();

  return (
    <div className="shell py-[var(--sp-6)]">
      <Breadcrumb items={[{ label: t("nav.home"), href: l === "ru" ? "/ru" : "/" }, { label: t("services.title") }]} />
      <h1 className="optical-left mt-[var(--sp-4)] text-700 font-semibold tracking-[var(--tr-title)] text-[var(--ink-strong)] sm:text-800">
        {t("services.title")}
      </h1>
      <TreadRule variant="mark" width={128} className="mt-[var(--sp-3)] text-[var(--accent)]" />

      <ul className="mt-[var(--sp-8)] grid gap-[var(--sp-5)] sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => {
          const title = (l === "ru" ? s.title_ru : s.title_ro) ?? s.title_ro;
          const img = s.image_url ? `https://anvelope-ungheni.md${s.image_url}` : null;
          return (
            <li key={s.id}>
              <Link
                href={{ pathname: "/[slug]", params: { slug: (l === "ru" ? s.slug_ru : s.slug_ro) ?? s.slug_ro } }}
                className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-sm)] border border-[var(--line)] transition-colors duration-[var(--dur-1)] hover:border-[var(--line-strong)]"
              >
                <div className="relative aspect-[4/3] bg-[var(--plate)]">
                  {img && <Image src={img} alt="" fill sizes="(min-width: 1024px) 360px, 92vw" className="object-cover" />}
                </div>
                <div className="flex flex-1 items-center gap-[var(--sp-3)] px-[var(--sp-4)] py-[var(--sp-4)]">
                  <span className="text-300 font-medium text-[var(--ink-strong)]">{title}</span>
                  <IconArrowRight size={16} className="ml-auto shrink-0 text-[var(--ink-muted)]" />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
