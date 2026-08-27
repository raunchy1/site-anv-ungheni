import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SizeSelector } from "@/components/ui/SizeSelector";
import { ProductCard } from "@/components/ui/ProductCard";
import { TreadRule, TyreSeasonMark, IconArrowRight, IconPin, IconClock, IconPhone } from "@/components/icons";
import { getSeasonCounts, getServices, getSettings, getShowcase } from "@/lib/db/queries";
import { toUiProduct } from "@/lib/adapt";
import { formatCount, telLink } from "@/lib/format";
import { sizeTree } from "@/lib/size-tree";
import { MapEmbed } from "@/components/layout/MapEmbed";
import type { Locale } from "@/lib/types";

export const revalidate = 3600;

/** Cele mai bine acoperite dimensiuni din catalog — calculate, nu alese pe gust. */
function topSizes(limit = 8) {
  const out: { width: string; aspect: string; diameter: string; available: number }[] = [];
  for (const [width, [, , aspects]] of Object.entries(sizeTree)) {
    for (const [aspect, [, , diameters]] of Object.entries(aspects)) {
      for (const [diameter, [, available]] of Object.entries(diameters)) {
        out.push({ width, aspect, diameter, available });
      }
    }
  }
  return out.sort((a, b) => b.available - a.available).slice(0, limit);
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const l = locale as Locale;
  const t = await getTranslations();
  const [settings, services, showcase, seasonCounts] = await Promise.all([
    getSettings(), getServices(), getShowcase(8), getSeasonCounts(),
  ]);

  return (
    <div className="shell flex flex-col gap-[var(--sp-16)] py-[var(--sp-8)]">
      {/* Piesa centrală, deasupra pliului, fără concurență vizuală.
          Fără hero, fără slogan, fără carousel: homepage-ul e un instrument de
          căutare cu context, nu o broșură. */}
      <section>
        <h1 className="sr-only">{t("home.title")}</h1>
        <SizeSelector locale={l} />
      </section>

      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="text-500 font-semibold text-[var(--ink-strong)]">{t("home.seasonsTitle")}</h2>
        </div>
        <TreadRule variant="full" className="mt-[var(--sp-3)] text-[var(--line)]" />
        {/* Trei plăci, nu trei rânduri de listă: sezonul e prima întrebare pe
            care și-o pune un șofer care nu știe încă ce dimensiune are, deci
            merită suprafață de atins, nu o linie de meniu. Contorul de sub
            etichetă e numărul real de anvelope disponibile pe sezon. */}
        <ul className="mt-[var(--sp-5)] grid gap-[var(--sp-3)] sm:grid-cols-3">
          {(["iarna", "all_season", "vara"] as const).map((s) => (
            <li key={s}>
              <Link
                href={{ pathname: "/catalog/[...filtre]", params: { filtre: [`sezon_${s === "all_season" ? "all-season" : s}`] } }}
                className="flex h-full flex-col items-center gap-[var(--sp-3)] rounded-[var(--radius-md)] border border-[var(--line)] px-[var(--sp-5)] py-[var(--sp-6)] text-center transition-colors duration-[var(--dur-1)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-2)]"
              >
                <TyreSeasonMark season={s} size={44} className="text-[var(--ink-strong)]" />
                <span className="font-medium text-[var(--ink-strong)]">{t(`season.${s}`)}</span>
                <span className="num text-200 text-[var(--ink-muted)]">
                  {formatCount(seasonCounts[s])} {t("size.available")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-500 font-semibold text-[var(--ink-strong)]">{t("home.popularSizes")}</h2>
        <TreadRule variant="full" className="mt-[var(--sp-3)] text-[var(--line)]" />
        <ul className="mt-[var(--sp-5)] flex flex-wrap gap-[var(--sp-2)]">
          {topSizes().map((s) => (
            <li key={`${s.width}-${s.aspect}-${s.diameter}`}>
              <Link
                href={{ pathname: "/catalog/[...filtre]", params: { filtre: [`latime_${s.width}`, `inaltime_${s.aspect}`, `diametru_${s.diameter.toLowerCase()}`] } }}
                className="num inline-flex items-baseline gap-[var(--sp-2)] rounded-[var(--radius-sm)] border border-[var(--line)] px-[var(--sp-3)] py-[var(--sp-2)] text-300 transition-colors duration-[var(--dur-1)] hover:border-[var(--line-strong)]"
              >
                <span className="text-[var(--ink-strong)]">{s.width}/{s.aspect} {s.diameter}</span>
                <span className="text-100 text-[var(--ink-muted)]">{s.available}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="flex items-baseline justify-between gap-[var(--sp-4)]">
          <h2 className="text-500 font-semibold text-[var(--ink-strong)]">{t("home.inStockNow")}</h2>
          <Link href="/catalog" className="nav-link text-200">{t("catalog.title")} →</Link>
        </div>
        <TreadRule variant="full" className="mt-[var(--sp-3)] text-[var(--line)]" />
        <ul className="mt-[var(--sp-5)] grid grid-cols-2 gap-[var(--sp-4)] md:grid-cols-4">
          {showcase.map((p, i) => (
            <li key={p.id}><ProductCard product={toUiProduct(p)} locale={l} priority={i < 4} /></li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-500 font-semibold text-[var(--ink-strong)]">{t("home.servicesTitle")}</h2>
        <TreadRule variant="full" className="mt-[var(--sp-3)] text-[var(--line)]" />
        <ul className="mt-[var(--sp-5)] grid gap-[var(--sp-3)] sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <li key={s.id}>
              <Link
                href={{ pathname: "/[slug]", params: { slug: (l === "ru" ? s.slug_ru : s.slug_ro) ?? s.slug_ro } }}
                className="flex h-full items-center gap-[var(--sp-3)] rounded-[var(--radius-md)] border border-[var(--line)] px-[var(--sp-4)] py-[var(--sp-4)] transition-colors duration-[var(--dur-1)] hover:border-[var(--line-strong)]"
              >
                <span className="text-300 text-[var(--ink-strong)]">{(l === "ru" ? s.title_ru : s.title_ro) ?? s.title_ro}</span>
                <IconArrowRight size={16} className="ml-auto shrink-0 text-[var(--ink-muted)]" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-500 font-semibold text-[var(--ink-strong)]">{t("home.whereTitle")}</h2>
        <TreadRule variant="full" className="mt-[var(--sp-3)] text-[var(--line)]" />
        <div className="mt-[var(--sp-5)] grid gap-[var(--sp-6)] lg:grid-cols-[minmax(0,320px)_1fr]">
          <ul className="space-y-[var(--sp-4)] text-300">
            <li className="flex gap-[var(--sp-3)]">
              <IconPin size={18} className="mt-[2px] shrink-0 text-[var(--ink-muted)]" />
              <span className="text-[var(--ink-strong)]">{settings.address}</span>
            </li>
            <li className="flex gap-[var(--sp-3)]">
              <IconPhone size={18} className="mt-[2px] shrink-0 text-[var(--ink-muted)]" />
              <a href={telLink(settings.phone_e164)} className="num text-[var(--ink-strong)]">{settings.phone_display}</a>
            </li>
            <li className="flex gap-[var(--sp-3)]">
              <IconClock size={18} className="mt-[2px] shrink-0 text-[var(--ink-muted)]" />
              <span className="text-[var(--ink-strong)]">{t("contact.hoursValue")}</span>
            </li>
          </ul>
          <MapEmbed
            lat={Number(settings.lat)}
            lng={Number(settings.lng)}
            locale={l}
            title={t("contact.map")}
            address={settings.address}
            height={320}
            className="overflow-hidden rounded-[var(--radius-sm)] border border-[var(--line)]"
          />
        </div>
      </section>
    </div>
  );
}
