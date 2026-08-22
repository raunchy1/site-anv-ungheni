import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { EmptyState } from "@/components/ui/EmptyState";
import { TreadRule } from "@/components/icons";
import type { LegalPage } from "@/lib/db/queries";
import type { Locale } from "@/lib/types";

export function legalMetadata(p: LegalPage | null, locale: Locale): Metadata {
  if (!p) return {};
  const roPath = `/${p.slug_ro}`;
  const ruPath = `/${p.slug_ru ?? p.slug_ro}`;
  const body = locale === "ru" ? p.body_ru : p.body_ro;
  return {
    title: (locale === "ru" ? p.title_ru : p.title_ro) ?? p.title_ro,
    description: (locale === "ru" ? p.meta_desc_ru : p.meta_desc_ro) ?? undefined,
    // Fără text juridic, pagina n-are ce căuta în index.
    robots: body ? undefined : { index: false, follow: true },
    alternates: { canonical: locale === "ru" ? `/ru${ruPath}` : roPath, languages: { ro: roPath, ru: `/ru${ruPath}` } },
  };
}

/**
 * Scheletele celor patru pagini legale. Textul juridic îl scrie clientul din
 * admin — nu redactăm clauze. Până atunci pagina spune deschis că e în lucru
 * și trimite la telefon, în loc să pretindă un conținut inexistent.
 */
export async function LegalPageView({ page, locale }: { page: LegalPage; locale: Locale }) {
  const t = await getTranslations();
  const title = (locale === "ru" ? page.title_ru : page.title_ro) ?? page.title_ro;
  const body = locale === "ru" ? page.body_ru : page.body_ro;

  return (
    <article className="shell py-[var(--sp-6)]">
      <Breadcrumb items={[{ label: t("nav.home"), href: locale === "ru" ? "/ru" : "/" }, { label: title }]} />
      <h1 className="optical-left mt-[var(--sp-4)] text-700 font-semibold tracking-[var(--tr-title)] text-[var(--ink-strong)]">{title}</h1>
      <TreadRule variant="mark" width={128} className="mt-[var(--sp-3)] text-[var(--accent)]" />

      {body ? (
        <div className="measure mt-[var(--sp-7)] text-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: body }} />
      ) : (
        <EmptyState
          className="mt-[var(--sp-7)]"
          title={locale === "ru" ? "Текст готовится" : "Textul este în pregătire"}
          body={locale === "ru"
            ? "Пока документ не опубликован, позвоните нам — ответим на любой вопрос."
            : "Până la publicarea documentului, sună-ne — răspundem la orice întrebare."}
        />
      )}
    </article>
  );
}
