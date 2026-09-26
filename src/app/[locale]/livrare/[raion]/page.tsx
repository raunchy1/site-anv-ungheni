import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ProductCard } from "@/components/ui/ProductCard";
import { TreadRule, IconArrowRight, IconPhone } from "@/components/icons";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, faqSchema, livrareSchema } from "@/lib/seo/schema";
import { getSettings, getShowcase } from "@/lib/db/queries";
import { toUiProduct } from "@/lib/adapt";
import { telLink } from "@/lib/format";
import { topSizes } from "@/lib/dimensiuni-populare";
import { COST_LIVRARE } from "@/lib/orders/livrare";
import { LOCALITATI, distantaKm, localitate, vecini, type Localitate } from "@/content/localitati";
import type { Locale, Settings } from "@/lib/types";

/**
 * PAGINA UNUI RAION: „anvelope Cahul", „шины Бельцы".
 *
 * Tot ce scrie aici e ce se întâmplă cu o comandă trimisă dintr-o adresă din
 * raionul respectiv — costul din `COST_LIVRARE`, termenul și plata din coș.
 * Ce diferă de la un raion la altul e real: numele, orașele, distanța față de
 * atelier, raioanele vecine. Restul paginii e marfă și dimensiuni, adică exact
 * ce caută cine a tastat „anvelope" lângă numele orașului lui.
 */

export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  return ["ro", "ru"].flatMap((locale) => LOCALITATI.map((l) => ({ locale, raion: l.slug })));
}

const cale = (slug: string, locale: Locale) =>
  (locale === "ru" ? `/ru/shiny-moldova/${slug}` : `/anvelope-moldova/${slug}`);

/** Ungheni e singurul raion cu curier gratuit și ridicare din magazin. */
const eAcasa = (l: Localitate) => l.slug === "ungheni";

function intrebari(loc: Localitate, s: Settings, locale: Locale) {
  const ru = locale === "ru";
  const orase = loc.orase.map(([r, u]) => (ru ? u : r)).join(", ");
  const cost = COST_LIVRARE.curier_moldova;

  const livrare = eAcasa(loc)
    ? ru
      ? `Да. По городу Унгены курьер бесплатный и доставляет в тот же день; шины можно и забрать из магазина по адресу ${s.address}. В сёла района (${orase}) доставляем курьером за 1–3 дня, стоимость доставки — ${cost} лей.`
      : `Da. În orașul Ungheni curierul e gratuit și livrează în aceeași zi; anvelopele se pot ridica și din magazin, de pe ${s.address}. În restul raionului (${orase}) livrăm prin curier în 1–3 zile, cu ${cost} lei livrarea.`
    : ru
      ? `Да. Доставляем курьером ${loc.inRu} и по населённым пунктам района — ${orase} — за 1–3 дня. Доставка стоит ${cost} лей.`
      : `Da. Livrăm prin curier ${loc.inRo} și în localitățile din ${loc.unitateRo} — ${orase} — în 1–3 zile. Livrarea costă ${cost} lei.`;

  return ru
    ? [
        { q: `Доставляете ли вы шины ${loc.inRu}?`, a: livrare },
        {
          q: `Как оплатить шины с доставкой ${loc.inRu}?`,
          a: "Наличными курьеру при получении или банковским переводом. Цены в каталоге указаны в леях (MDL).",
        },
        {
          q: `Где установить шины ${loc.inRu}?`,
          a: eAcasa(loc)
            ? `В нашей мастерской по адресу ${s.address}: шиномонтаж, балансировка, ремонт, азот и датчики давления. Цену называем по телефону ${s.phone_display}.`
            : `Шины доставляются без монтажа — их можно установить в любом шиномонтаже ${loc.inRu} или в нашей мастерской в Унгенах (${s.address}).`,
        },
        {
          q: "Какая гарантия на шины?",
          a: `${s.warranty_years} года гарантии на все новые шины. Мы продаём только новые шины.`,
        },
      ]
    : [
        { q: `Livrați anvelope ${loc.inRo}?`, a: livrare },
        {
          q: `Cum plătesc anvelopele livrate ${loc.inRo}?`,
          a: "Numerar, curierului, la livrare, sau prin transfer bancar. Prețurile din catalog sunt în lei (MDL).",
        },
        {
          q: `Unde montez anvelopele ${loc.inRo}?`,
          a: eAcasa(loc)
            ? `În atelierul nostru de pe ${s.address}: montaj, echilibrare, reparații, azot și senzori de presiune. Prețul îl spunem la telefon, la ${s.phone_display}.`
            : `Anvelopele se livrează nemontate — le poți monta la orice vulcanizare ${loc.inRo} sau la atelierul nostru din Ungheni (${s.address}).`,
        },
        {
          q: "Ce garanție au anvelopele?",
          a: `${s.warranty_years} ani garanție la toate anvelopele noi. Vindem doar anvelope noi.`,
        },
      ];
}

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string; raion: string }> }): Promise<Metadata> {
  const { locale, raion } = await params;
  const loc = localitate(raion);
  if (!loc) return {};
  const ru = locale === "ru";
  const orase = loc.orase.slice(0, 3).map(([r, u]) => (ru ? u : r)).join(", ");
  const cost = COST_LIVRARE.curier_moldova;
  const ani = (await getSettings()).warranty_years;

  return {
    title: ru
      ? `Шины ${loc.ru} — доставка за 1–3 дня, цены в MDL`
      : `Anvelope ${loc.ro} — livrare în 1–3 zile, prețuri în MDL`,
    description: ru
      ? `Новые летние, зимние и всесезонные шины с доставкой ${loc.inRu}: ${orase}. Курьер за 1–3 дня${eAcasa(loc) ? ", по Унгенам бесплатно" : `, ${cost} лей`}, оплата при получении, гарантия ${ani} года.`
      : `Anvelope noi de vară, iarnă și all season cu livrare ${loc.inRo}: ${orase}. Curier în 1–3 zile${eAcasa(loc) ? ", gratuit în orașul Ungheni" : `, ${cost} lei`}, plata la livrare, garanție ${ani} ani.`,
    alternates: {
      canonical: cale(loc.slug, locale as Locale),
      languages: { ro: cale(loc.slug, "ro"), ru: cale(loc.slug, "ru"), "x-default": cale(loc.slug, "ro") },
    },
  };
}

export default async function RaionPage({ params }: { params: Promise<{ locale: string; raion: string }> }) {
  const { locale, raion } = await params;
  setRequestLocale(locale);
  const l = locale as Locale;
  const ru = l === "ru";
  const loc = localitate(raion);
  if (!loc) notFound();

  const t = await getTranslations();
  const [settings, showcase] = await Promise.all([getSettings(), getShowcase(6)]);
  const qa = intrebari(loc, settings, l);
  const km = distantaKm({ lat: Number(settings.lat), lng: Number(settings.lng) }, loc);
  const hub = ru ? "/ru/shiny-moldova" : "/anvelope-moldova";
  const titluHub = ru ? "Доставка по Молдове" : "Livrare în Moldova";
  const nume = ru ? loc.ru : loc.ro;
  const cost = COST_LIVRARE.curier_moldova;

  const fapte: Array<[string, string]> = ru
    ? [
        ["Доставка", eAcasa(loc) ? "по Унгенам — в тот же день; по району — 1–3 дня" : "курьером, 1–3 дня"],
        ["Стоимость доставки", eAcasa(loc) ? `по Унгенам бесплатно; по району ${cost} лей` : `${cost} лей`],
        ["Оплата", "наличными при получении или банковским переводом"],
        ["Гарантия", `${settings.warranty_years} года на все шины`],
        ...(eAcasa(loc) ? [] : [["От мастерской", `≈ ${km} км по прямой`] as [string, string]]),
      ]
    : [
        ["Livrare", eAcasa(loc) ? "în orașul Ungheni — în aceeași zi; în raion — 1–3 zile" : "prin curier, 1–3 zile"],
        ["Costul livrării", eAcasa(loc) ? `gratuit în orașul Ungheni; ${cost} lei în raion` : `${cost} lei`],
        ["Plata", "numerar la livrare sau transfer bancar"],
        ["Garanție", `${settings.warranty_years} ani la toate anvelopele`],
        ...(eAcasa(loc) ? [] : [["Distanța de la atelier", `≈ ${km} km în linie dreaptă`] as [string, string]]),
      ];

  return (
    <div className="shell flex flex-col gap-[var(--sp-12)] py-[var(--sp-6)]">
      <div>
        <Breadcrumb items={[
          { label: t("nav.home"), href: ru ? "/ru" : "/" },
          { label: titluHub, href: hub },
          { label: nume },
        ]} />
        <JsonLd data={breadcrumbSchema([
          { name: t("nav.home"), url: ru ? "/ru" : "/" },
          { name: titluHub, url: hub },
          { name: nume, url: cale(loc.slug, l) },
        ])} />
        <JsonLd data={livrareSchema(loc, l, cale(loc.slug, l), eAcasa(loc) ? 0 : cost)} />

        <header className="mt-[var(--sp-4)]">
          <h1 className="optical-left text-700 font-semibold tracking-[var(--tr-title)] text-[var(--ink-strong)] sm:text-800">
            {ru ? `Шины ${loc.inRu} с доставкой` : `Anvelope ${loc.inRo}, cu livrare`}
          </h1>
          <TreadRule variant="mark" width={128} className="mt-[var(--sp-3)] text-[var(--accent)]" />
          <p className="measure mt-[var(--sp-4)] text-400 text-[var(--ink)]">
            {eAcasa(loc)
              ? ru
                ? "Магазин и шиномонтаж — здесь, в Унгенах. Шины из каталога можно забрать сразу или получить курьером; установим их в нашей мастерской."
                : "Magazinul și atelierul sunt aici, în Ungheni. Anvelopele din catalog le ridici din magazin sau vin cu curierul, iar montajul îl facem în atelierul nostru."
              : ru
                ? `Новые шины из каталога доставляем ${loc.inRu} и по всему району курьером за 1–3 дня. Заказ — на сайте или по телефону; оплата при получении.`
                : `Anvelopele noi din catalog le livrăm ${loc.inRo} și în tot raionul, prin curier, în 1–3 zile. Comanda se face pe site sau la telefon, iar plata — la livrare.`}
          </p>
        </header>

        <div className="mt-[var(--sp-8)] grid gap-[var(--sp-8)] lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
          <dl className="grid gap-x-[var(--sp-6)] gap-y-[var(--sp-4)] sm:grid-cols-2">
            {fapte.map(([k, v]) => (
              <div key={k}>
                <dt className="label">{k}</dt>
                <dd className="mt-[var(--sp-1)] text-300 text-[var(--ink-strong)]">{v}</dd>
              </div>
            ))}
            <div className="sm:col-span-2">
              <dt className="label">{ru ? "Населённые пункты" : "Localități"}</dt>
              <dd className="mt-[var(--sp-1)] text-300 text-[var(--ink-strong)]">
                {loc.orase.map(([r, u]) => (ru ? u : r)).join(" · ")}
                {ru ? " и все сёла района" : " și toate satele din raion"}
              </dd>
            </div>
          </dl>
          <div className="flex flex-col gap-[var(--sp-3)] rounded-[var(--radius-md)] border border-[var(--line)] p-[var(--sp-5)]">
            <p className="text-300 text-[var(--ink)]">
              {ru ? "Подберём шины по размеру и назовём срок доставки:" : "Îți găsim anvelopele pe dimensiune și îți spunem când ajung:"}
            </p>
            <a href={telLink(settings.phone_e164)} className="num inline-flex items-center gap-[var(--sp-2)] text-500 font-semibold text-[var(--ink-strong)]">
              <IconPhone size={20} />
              {settings.phone_display}
            </a>
            <Link href="/catalog" className="nav-link inline-flex items-center gap-[var(--sp-2)] text-200">
              {t("catalog.title")}
              <IconArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>

      <section>
        <div className="flex items-baseline justify-between gap-[var(--sp-4)]">
          <h2 className="text-500 font-semibold text-[var(--ink-strong)]">{t("home.inStockNow")}</h2>
          <Link href="/catalog" className="nav-link text-200">{t("catalog.title")} →</Link>
        </div>
        <TreadRule variant="full" className="mt-[var(--sp-3)] text-[var(--line)]" />
        <ul className="mt-[var(--sp-5)] grid grid-cols-2 gap-[var(--sp-4)] md:grid-cols-3 xl:grid-cols-6">
          {showcase.map((p) => (
            <li key={p.id}><ProductCard product={toUiProduct(p)} locale={l} /></li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-500 font-semibold text-[var(--ink-strong)]">{t("home.popularSizes")}</h2>
        <TreadRule variant="full" className="mt-[var(--sp-3)] text-[var(--line)]" />
        <ul className="mt-[var(--sp-5)] flex flex-wrap gap-[var(--sp-2)]">
          {topSizes(12).map((s) => (
            <li key={`${s.width}-${s.aspect}-${s.diameter}`}>
              <Link
                href={{ pathname: "/catalog/[...filtre]", params: { filtre: [`latime_${s.width}`, `inaltime_${s.aspect}`, `diametru_${s.diameter.toLowerCase()}`] } }}
                className="num inline-flex rounded-[var(--radius-sm)] border border-[var(--line)] px-[var(--sp-3)] py-[var(--sp-2)] text-300 text-[var(--ink-strong)] transition-colors duration-[var(--dur-1)] hover:border-[var(--line-strong)]"
              >
                {s.width}/{s.aspect} {s.diameter}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="faq-raion">
        <h2 id="faq-raion" className="text-500 font-semibold text-[var(--ink-strong)]">
          {ru ? "Частые вопросы" : "Întrebări frecvente"}
        </h2>
        <TreadRule variant="full" className="mt-[var(--sp-3)] text-[var(--line)]" />
        <dl className="mt-[var(--sp-5)] grid gap-[var(--sp-5)] md:grid-cols-2">
          {qa.map(({ q, a }) => (
            <div key={q} className="max-w-[60ch]">
              <dt className="text-300 font-semibold text-[var(--ink-strong)]">{q}</dt>
              <dd className="mt-[var(--sp-2)] text-300 text-[var(--ink-muted)]">{a}</dd>
            </div>
          ))}
        </dl>
        <JsonLd data={faqSchema(qa)} />
      </section>

      <section>
        <h2 className="text-500 font-semibold text-[var(--ink-strong)]">
          {ru ? "Доставляем и рядом" : "Livrăm și în apropiere"}
        </h2>
        <TreadRule variant="full" className="mt-[var(--sp-3)] text-[var(--line)]" />
        <ul className="mt-[var(--sp-5)] flex flex-wrap gap-[var(--sp-2)]">
          {vecini(loc).map((v) => (
            <li key={v.slug}>
              <Link
                href={{ pathname: "/livrare/[raion]", params: { raion: v.slug } }}
                className="inline-flex rounded-[var(--radius-sm)] border border-[var(--line)] px-[var(--sp-3)] py-[var(--sp-2)] text-200 text-[var(--ink-strong)] transition-colors duration-[var(--dur-1)] hover:border-[var(--line-strong)]"
              >
                {ru ? `Шины ${v.ru}` : `Anvelope ${v.ro}`}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/livrare" className="nav-link inline-flex items-center gap-[var(--sp-2)] px-[var(--sp-3)] py-[var(--sp-2)] text-200">
              {ru ? "Все районы" : "Toate raioanele"}
              <IconArrowRight size={15} />
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
