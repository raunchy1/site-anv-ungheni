import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { TreadRule } from "@/components/icons";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, itemListSchema } from "@/lib/seo/schema";
import { getSettings } from "@/lib/db/queries";
import { COST_LIVRARE } from "@/lib/orders/livrare";
import { LOCALITATI, ZONE } from "@/content/localitati";
import type { Locale } from "@/lib/types";

/**
 * LIVRAREA ÎN TOATĂ MOLDOVA, PE O PAGINĂ.
 *
 * Cele trei moduri de livrare din coș, cu prețul lor, și lista tuturor
 * raioanelor, fiecare cu pagina lui. E pagina spre care duc „livrăm în toată
 * Moldova" din subsol și de pe prima pagină.
 */

export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const ru = locale === "ru";
  return {
    title: ru ? "Доставка шин по всей Молдове — все районы" : "Livrare anvelope în toată Moldova — toate raioanele",
    description: ru
      ? `Доставляем шины курьером в Кишинёв, Бельцы, Кагул, Гагаузию и во все районы Молдовы за 1–3 дня, ${COST_LIVRARE.curier_moldova} лей. По Унгенам — бесплатно, в тот же день.`
      : `Livrăm anvelope prin curier în Chișinău, Bălți, Cahul, Găgăuzia și în toate raioanele Moldovei, în 1–3 zile, cu ${COST_LIVRARE.curier_moldova} lei. În Ungheni — gratuit, în aceeași zi.`,
    alternates: {
      canonical: ru ? "/ru/shiny-moldova" : "/anvelope-moldova",
      languages: { ro: "/anvelope-moldova", ru: "/ru/shiny-moldova", "x-default": "/anvelope-moldova" },
    },
  };
}

export default async function LivrarePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const l = locale as Locale;
  const ru = l === "ru";
  const t = await getTranslations();
  const s = await getSettings();
  const titlu = ru ? "Доставка шин по всей Молдове" : "Livrare anvelope în toată Moldova";
  const cale = ru ? "/ru/shiny-moldova" : "/anvelope-moldova";

  const moduri: Array<[string, string, string]> = [
    [t("checkout.deliveryPickup"), ru ? "бесплатно" : "gratuit", s.address],
    [t("checkout.deliveryUngheni"), ru ? "бесплатно" : "gratuit", ru ? "в тот же день" : "în aceeași zi"],
    [t("checkout.deliveryMoldova"), `${COST_LIVRARE.curier_moldova} ${ru ? "лей" : "lei"}`, ru ? "1–3 дня, во все районы" : "1–3 zile, în toate raioanele"],
  ];

  return (
    <div className="shell py-[var(--sp-6)]">
      <Breadcrumb items={[{ label: t("nav.home"), href: ru ? "/ru" : "/" }, { label: titlu }]} />
      <JsonLd data={breadcrumbSchema([
        { name: t("nav.home"), url: ru ? "/ru" : "/" },
        { name: titlu, url: cale },
      ])} />
      <JsonLd data={itemListSchema(
        LOCALITATI.map((x) => `${cale}/${x.slug}`),
        titlu,
      )} />

      <header className="mt-[var(--sp-4)]">
        <h1 className="optical-left text-700 font-semibold tracking-[var(--tr-title)] text-[var(--ink-strong)] sm:text-800">
          {titlu}
        </h1>
        <TreadRule variant="mark" width={128} className="mt-[var(--sp-3)] text-[var(--accent)]" />
        <p className="measure mt-[var(--sp-4)] text-400 text-[var(--ink)]">
          {ru
            ? `Магазин и мастерская — в Унгенах. Шины из каталога доставляем курьером в любой район Республики Молдова; оплата наличными при получении или банковским переводом. Заказ — на сайте или по телефону ${s.phone_display}.`
            : `Magazinul și atelierul sunt în Ungheni. Anvelopele din catalog le livrăm prin curier în orice raion al Republicii Moldova; plata se face numerar, la livrare, sau prin transfer bancar. Comanda — pe site sau la telefon, la ${s.phone_display}.`}
        </p>
      </header>

      <section className="mt-[var(--sp-10)]">
        <h2 className="text-500 font-semibold text-[var(--ink-strong)]">{ru ? "Способы доставки" : "Moduri de livrare"}</h2>
        <TreadRule variant="full" className="mt-[var(--sp-3)] text-[var(--line)]" />
        <dl className="mt-[var(--sp-5)] grid gap-[var(--sp-4)] sm:grid-cols-3">
          {moduri.map(([nume, pret, detaliu]) => (
            <div key={nume} className="rounded-[var(--radius-md)] border border-[var(--line)] p-[var(--sp-4)]">
              <dt className="text-300 font-semibold text-[var(--ink-strong)]">{nume}</dt>
              <dd className="num mt-[var(--sp-2)] text-400 text-[var(--ink-strong)]">{pret}</dd>
              <dd className="mt-[var(--sp-1)] text-200 text-[var(--ink-muted)]">{detaliu}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-[var(--sp-12)] grid gap-[var(--sp-10)] md:grid-cols-2">
        {ZONE.map((z) => {
          const din = LOCALITATI.filter((x) => x.zona === z.id);
          return (
            <section key={z.id}>
              <h2 className="text-500 font-semibold text-[var(--ink-strong)]">{ru ? z.ru : z.ro}</h2>
              <TreadRule variant="full" className="mt-[var(--sp-3)] text-[var(--line)]" />
              <ul className="mt-[var(--sp-4)] grid grid-cols-1 gap-[var(--sp-1)] sm:grid-cols-2">
                {din.map((x) => (
                  <li key={x.slug}>
                    <Link
                      href={{ pathname: "/livrare/[raion]", params: { raion: x.slug } }}
                      className="nav-link flex min-h-[44px] flex-col justify-center text-300"
                    >
                      <span className="text-[var(--ink-strong)]">{ru ? `Шины ${x.ru}` : `Anvelope ${x.ro}`}</span>
                      <span className="text-100 text-[var(--ink-muted)]">
                        {x.orase.slice(0, 3).map(([r, u]) => (ru ? u : r)).join(", ")}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
