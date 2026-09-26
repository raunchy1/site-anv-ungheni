import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { TreadRule, IconArrowRight } from "@/components/icons";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, itemListSchema } from "@/lib/seo/schema";
import { GHIDURI } from "@/content/ghiduri";
import type { Locale } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const ru = locale === "ru";
  return {
    title: ru ? "Гид по шинам: размеры, индексы, сезонность" : "Ghid anvelope: dimensiuni, indici, sezoane",
    description: ru
      ? "Как читать размер шины, таблицы индексов нагрузки и скорости, как узнать возраст шины по DOT и когда менять летние шины на зимние."
      : "Cum citești dimensiunea anvelopei, tabelele indicilor de sarcină și viteză, cum afli vârsta anvelopei din codul DOT și când schimbi anvelopele de vară cu cele de iarnă.",
    alternates: {
      canonical: ru ? "/ru/gid-po-shinam" : "/ghid-anvelope",
      languages: { ro: "/ghid-anvelope", ru: "/ru/gid-po-shinam", "x-default": "/ghid-anvelope" },
    },
  };
}

export default async function GhiduriPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const l = locale as Locale;
  const ru = l === "ru";
  const t = await getTranslations();
  const titlu = ru ? "Гид по шинам" : "Ghid anvelope";
  const cale = ru ? "/ru/gid-po-shinam" : "/ghid-anvelope";

  return (
    <div className="shell py-[var(--sp-6)]">
      <Breadcrumb items={[{ label: t("nav.home"), href: ru ? "/ru" : "/" }, { label: titlu }]} />
      <JsonLd data={breadcrumbSchema([{ name: t("nav.home"), url: ru ? "/ru" : "/" }, { name: titlu, url: cale }])} />
      <JsonLd data={itemListSchema(GHIDURI.map((g) => `${cale}/${g.slug}`), titlu)} />

      <header className="mt-[var(--sp-4)]">
        <h1 className="optical-left text-700 font-semibold tracking-[var(--tr-title)] text-[var(--ink-strong)] sm:text-800">{titlu}</h1>
        <TreadRule variant="mark" width={128} className="mt-[var(--sp-3)] text-[var(--accent)]" />
        <p className="measure mt-[var(--sp-4)] text-400 text-[var(--ink)]">
          {ru
            ? "Коротко и с цифрами: что написано на боковине шины и как выбрать подходящую."
            : "Pe scurt și cu cifre: ce scrie pe flancul anvelopei și cum o alegi pe cea potrivită."}
        </p>
      </header>

      <ul className="mt-[var(--sp-8)] grid gap-[var(--sp-4)] md:grid-cols-2">
        {GHIDURI.map((g) => (
          <li key={g.slug}>
            <Link
              href={{ pathname: "/ghid/[articol]", params: { articol: g.slug } }}
              className="flex h-full flex-col gap-[var(--sp-2)] rounded-[var(--radius-md)] border border-[var(--line)] p-[var(--sp-5)] transition-colors duration-[var(--dur-1)] hover:border-[var(--line-strong)]"
            >
              <span className="text-400 font-semibold text-[var(--ink-strong)]">{g.titlu[l]}</span>
              <span className="text-200 text-[var(--ink-muted)]">{g.descriere[l]}</span>
              <span className="mt-auto inline-flex items-center gap-[var(--sp-2)] pt-[var(--sp-2)] text-200 text-[var(--ink-strong)]">
                {ru ? "Читать" : "Citește"} <IconArrowRight size={14} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
