import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { TreadRule } from "@/components/icons";
import { SectiuneServiciu } from "@/components/servicii/SectiuneServiciu";
import { SERVICII, text } from "@/content/servicii";
import { getSettings } from "@/lib/db/queries";
import type { Locale } from "@/lib/types";

export const revalidate = 3600;

/**
 * CATALOGUL DE SERVICII, într-o singură pagină.
 *
 * De ce o pagină și nu zece: serviciile se citesc împreună. Cine intră vrea să
 * știe ce facem cu roata lui și, în aceeași vizită, dacă merită și azotul —
 * două pagini separate ar însemna două căutări. Cele nouă fișe de serviciu
 * vechi rămân indexate și primesc trafic din Google; de aici se leagă spre ele,
 * nu invers.
 *
 * Navigarea rezolvă lungimea: un index numerotat sus, lipicios pe desktop, cu
 * ancore către fiecare capitol.
 */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "services" });
  return {
    title: t("title"),
    description:
      locale === "ru"
        ? "Все услуги мастерской: шиномонтаж и балансировка, азот, ремонт шин, датчики давления, правка и покраска дисков, автокондиционер, тормоза, хранение шин."
        : "Toate serviciile atelierului: vulcanizare și echilibrare, azot, reparații anvelope, senzori TPMS, îndreptare și vopsire jante, aer condiționat, frâne, hotel anvelope.",
    alternates: {
      canonical: locale === "ru" ? "/ru/uslugi" : "/servicii",
      languages: { ro: "/servicii", ru: "/ru/uslugi" },
    },
  };
}

export default async function ServiciiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const l = locale as Locale;
  const t = await getTranslations();
  const settings = await getSettings();

  return (
    <div className="shell py-[var(--sp-6)]">
      <Breadcrumb items={[{ label: t("nav.home"), href: l === "ru" ? "/ru" : "/" }, { label: t("services.title") }]} />

      <header className="mt-[var(--sp-4)]">
        <h1 className="optical-left text-700 font-semibold tracking-[var(--tr-title)] text-[var(--ink-strong)] sm:text-800">
          {t("services.title")}
        </h1>
        <TreadRule variant="mark" width={128} className="mt-[var(--sp-3)] text-[var(--accent)]" />
        <p className="measure mt-[var(--sp-4)] text-400 text-[var(--ink)]">
          {l === "ru"
            ? "Всё, что делаем в мастерской. Приходите без записи или звоните заранее — назовём стоимость по вашему размеру."
            : "Tot ce facem în atelier. Vino fără programare sau sună înainte — îți spunem cât costă pe dimensiunea ta."}
        </p>
      </header>

      {/* ------------------------------------------------------------- index --
          Zece rânduri, numerotate. E singurul loc din pagină unde toate
          serviciile se văd deodată; de aceea nu are fotografii — ar transforma o
          listă de citit în zece imagini de parcurs. */}
      <nav
        aria-label={l === "ru" ? "Услуги" : "Serviciile"}
        className="mt-[var(--sp-8)] rounded-[var(--radius-md)] border border-[var(--line)]"
      >
        <ul className="grid grid-cols-1 divide-y divide-[var(--line)] sm:grid-cols-2 sm:divide-x lg:grid-cols-2">
          {SERVICII.map((s, i) => (
            <li key={s.id} className={i % 2 === 1 ? "sm:border-l-0" : ""}>
              <a
                href={`#${s.id}`}
                className="flex min-h-[52px] items-baseline gap-[var(--sp-3)] px-[var(--sp-4)] py-[var(--sp-3)] transition-colors duration-[var(--dur-1)] hover:bg-[var(--surface-2)]"
              >
                <span className="num font-mono text-[var(--fs-100)] text-[var(--ink-faint)]">{s.numar}</span>
                <span className="min-w-0 flex-1 text-300 font-medium text-[var(--ink-strong)]">
                  {text(s.titlu, l)}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-[var(--sp-10)] space-y-[var(--sp-12)]">
        {SERVICII.map((s, i) => (
          <SectiuneServiciu
            key={s.id}
            serviciu={s}
            locale={l}
            index={i}
            telefon={settings.phone_e164}
            telefonAfisat={settings.phone_display}
          />
        ))}
      </div>

      {/* Nota de subsol: răspunsul la întrebarea „bine, și cât costă?". Se dă
          la telefon, pentru că depinde de diametru și de starea piesei. */}
      <p className="measure mt-[var(--sp-10)] border-t border-[var(--line)] pt-[var(--sp-5)] text-[var(--fs-200)] text-[var(--ink-muted)]">
        {l === "ru"
          ? "Стоимость зависит от диаметра колеса и состояния детали — назовём её по телефону или после осмотра, он бесплатный."
          : "Cât costă depinde de diametrul roții și de starea piesei — îți spunem la telefon sau după ce vedem lucrarea, iar verificarea e gratuită."}
      </p>
    </div>
  );
}
