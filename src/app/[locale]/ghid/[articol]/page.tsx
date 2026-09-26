import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { TreadRule, IconArrowRight } from "@/components/icons";
import { JsonLd } from "@/components/seo/JsonLd";
import { articolSchema, breadcrumbSchema, faqSchema } from "@/lib/seo/schema";
import { DATA_GHIDURI, GHIDURI, ghid, type Bloc } from "@/content/ghiduri";
import type { Locale } from "@/lib/types";

/** Text fix, scris o dată: se pre-generează tot și nu se mai atinge. */
export const dynamicParams = false;

export function generateStaticParams() {
  return ["ro", "ru"].flatMap((locale) => GHIDURI.map((g) => ({ locale, articol: g.slug })));
}

const cale = (slug: string, locale: Locale) =>
  (locale === "ru" ? `/ru/gid-po-shinam/${slug}` : `/ghid-anvelope/${slug}`);

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string; articol: string }> }): Promise<Metadata> {
  const { locale, articol } = await params;
  const g = ghid(articol);
  if (!g) return {};
  const l = locale as Locale;
  return {
    title: g.titlu[l],
    description: g.descriere[l],
    alternates: {
      canonical: cale(g.slug, l),
      languages: { ro: cale(g.slug, "ro"), ru: cale(g.slug, "ru"), "x-default": cale(g.slug, "ro") },
    },
    openGraph: { type: "article", title: g.titlu[l], description: g.descriere[l], url: cale(g.slug, l) },
  };
}

function Blocuri({ blocuri, l }: { blocuri: Bloc[]; l: Locale }) {
  return blocuri.map((b, i) => {
    if (b.tip === "p") return <p key={i} className="measure text-300 text-[var(--ink)]">{b[l]}</p>;
    if (b.tip === "lista") {
      return (
        <ul key={i} className="measure list-disc space-y-[var(--sp-2)] pl-[var(--sp-5)] text-300 text-[var(--ink)]">
          {b[l].map((x) => <li key={x}>{x}</li>)}
        </ul>
      );
    }
    const cap = l === "ru" ? b.capRu : b.cap;
    const randuri = l === "ru" ? (b.randuriRu ?? b.randuri) : b.randuri;
    return (
      <div key={i} className="max-w-[640px] overflow-x-auto rounded-[var(--radius-md)] border border-[var(--line)]">
        <table className="w-full border-collapse text-300">
          <thead>
            <tr className="bg-[var(--surface-2)] text-left">
              {cap.map((c) => <th key={c} scope="col" className="px-[var(--sp-4)] py-[var(--sp-2)] label">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {randuri.map(([a, v]) => (
              <tr key={a} className="border-t border-[var(--line)]">
                <th scope="row" className="num px-[var(--sp-4)] py-[var(--sp-2)] text-left font-semibold text-[var(--ink-strong)]">{a}</th>
                <td className="num px-[var(--sp-4)] py-[var(--sp-2)] text-[var(--ink)]">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  });
}

export default async function GhidPage({ params }: { params: Promise<{ locale: string; articol: string }> }) {
  const { locale, articol } = await params;
  setRequestLocale(locale);
  const l = locale as Locale;
  const ru = l === "ru";
  const g = ghid(articol);
  if (!g) notFound();
  const t = await getTranslations();
  const titluHub = ru ? "Гид по шинам" : "Ghid anvelope";
  const hub = ru ? "/ru/gid-po-shinam" : "/ghid-anvelope";
  const qa = g.intrebari.map((x) => ({ q: x[l][0], a: x[l][1] }));

  return (
    <article className="shell py-[var(--sp-6)]">
      <Breadcrumb items={[
        { label: t("nav.home"), href: ru ? "/ru" : "/" },
        { label: titluHub, href: hub },
        { label: g.titlu[l] },
      ]} />
      <JsonLd data={breadcrumbSchema([
        { name: t("nav.home"), url: ru ? "/ru" : "/" },
        { name: titluHub, url: hub },
        { name: g.titlu[l], url: cale(g.slug, l) },
      ])} />
      <JsonLd data={articolSchema({ titlu: g.titlu[l], descriere: g.descriere[l], url: cale(g.slug, l), data: DATA_GHIDURI }, l)} />

      <header className="mt-[var(--sp-4)]">
        <h1 className="optical-left max-w-[28ch] text-700 font-semibold tracking-[var(--tr-title)] text-[var(--ink-strong)] sm:text-800">
          {g.titlu[l]}
        </h1>
        <TreadRule variant="mark" width={128} className="mt-[var(--sp-3)] text-[var(--accent)]" />
        <p className="measure mt-[var(--sp-4)] text-400 text-[var(--ink)]">{g.descriere[l]}</p>
      </header>

      <div className="mt-[var(--sp-10)] space-y-[var(--sp-10)]">
        {g.sectiuni.map((s) => (
          <section key={s.h.ro} className="space-y-[var(--sp-4)]">
            <h2 className="text-500 font-semibold text-[var(--ink-strong)]">{s.h[l]}</h2>
            <Blocuri blocuri={s.blocuri} l={l} />
          </section>
        ))}

        <section aria-labelledby="faq-ghid">
          <h2 id="faq-ghid" className="text-500 font-semibold text-[var(--ink-strong)]">
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
          <h2 className="text-500 font-semibold text-[var(--ink-strong)]">{ru ? "В каталоге" : "În catalog"}</h2>
          <TreadRule variant="full" className="mt-[var(--sp-3)] text-[var(--line)]" />
          <ul className="mt-[var(--sp-5)] flex flex-wrap gap-[var(--sp-2)]">
            {g.catalog.map((c) => (
              <li key={c.segmente.join("/")}>
                <Link
                  href={{ pathname: "/catalog/[...filtre]", params: { filtre: c.segmente } }}
                  className="inline-flex items-center gap-[var(--sp-2)] rounded-[var(--radius-sm)] border border-[var(--line)] px-[var(--sp-3)] py-[var(--sp-2)] text-200 text-[var(--ink-strong)] transition-colors duration-[var(--dur-1)] hover:border-[var(--line-strong)]"
                >
                  {c[l]}
                  <IconArrowRight size={14} />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <nav aria-label={titluHub}>
          <h2 className="text-500 font-semibold text-[var(--ink-strong)]">{ru ? "Другие статьи" : "Alte ghiduri"}</h2>
          <TreadRule variant="full" className="mt-[var(--sp-3)] text-[var(--line)]" />
          <ul className="mt-[var(--sp-4)] space-y-[var(--sp-2)]">
            {GHIDURI.filter((x) => x.slug !== g.slug).map((x) => (
              <li key={x.slug}>
                <Link href={{ pathname: "/ghid/[articol]", params: { articol: x.slug } }} className="nav-link text-300">
                  {x.titlu[l]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </article>
  );
}
