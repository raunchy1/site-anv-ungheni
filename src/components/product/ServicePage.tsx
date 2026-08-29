import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { TreadRule, IconPin, IconPhone, IconClock } from "@/components/icons";
import { getServices, getSettings } from "@/lib/db/queries";
import { Link } from "@/i18n/navigation";
import { telLink } from "@/lib/format";
import { WhatsAppButton } from "./WhatsAppButton";
import { TabelPreturi } from "@/components/servicii/TabelPreturi";
import { TabelFiltrat } from "@/components/servicii/TabelFiltrat";
import { serviciuPentruSlug, pretDeLa, text as sText } from "@/content/servicii";
import { BookingForm } from "./BookingForm";
import type { Locale, Service } from "@/lib/types";

export function serviceMetadata(s: Service | null, locale: Locale): Metadata {
  if (!s) return {};
  const roPath = `/${s.slug_ro}`;
  const ruPath = `/${s.slug_ru ?? s.slug_ro}`;
  return {
    title: (locale === "ru" ? s.meta_title_ru : s.meta_title_ro) ?? (locale === "ru" ? s.title_ru : s.title_ro) ?? s.title_ro,
    description: (locale === "ru" ? s.meta_desc_ru : s.meta_desc_ro) ?? undefined,
    alternates: { canonical: locale === "ru" ? `/ru${ruPath}` : roPath, languages: { ro: roPath, ru: `/ru${ruPath}` } },
  };
}

/**
 * `body` e NULL pentru toate cele 9 servicii — sursa n-a avut niciun text.
 *
 * De acum textul și PREȚURILE vin din catalogul de servicii
 * (`src/content/servicii.ts`, transcris din documentul atelierului): pagina își
 * caută capitolul după slug și randează descrierea, ce include și tabelele lui.
 * O pagină de serviciu fără preț e o pagină care nu răspunde la singura
 * întrebare pentru care a fost deschisă.
 *
 * Când nu există capitol (`sudura-cu-argon` — documentul n-are tarif de sudură
 * în argon), pagina rămâne pe layout-ul vechi și trimite la lista completă. Mai
 * bine niciun preț decât prețul altei lucrări.
 */
export async function ServicePage({ service, locale }: { service: Service; locale: Locale }) {
  const t = await getTranslations();
  const [settings, all] = await Promise.all([getSettings(), getServices()]);
  const title = (locale === "ru" ? service.title_ru : service.title_ro) ?? service.title_ro;
  const body = locale === "ru" ? service.body_ru : service.body_ro;
  const others = all.filter((s) => s.id !== service.id).slice(0, 6);
  const cap = serviciuPentruSlug(service.slug_ro);
  const dela = cap ? pretDeLa(cap.tabele) : null;
  const img = service.image_url ? `https://anvelope-ungheni.md${service.image_url}` : null;

  return (
    <article className="shell py-[var(--sp-6)]">
      <Breadcrumb
        items={[
          { label: t("nav.home"), href: locale === "ru" ? "/ru" : "/" },
          { label: t("services.title"), href: locale === "ru" ? "/ru/uslugi" : "/servicii" },
          { label: title },
        ]}
      />

      <div className="mt-[var(--sp-5)] grid gap-[var(--sp-8)] lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <div className="min-w-0">
          <h1 className="optical-left text-700 font-semibold tracking-[var(--tr-title)] text-[var(--ink-strong)] sm:text-800">{title}</h1>
          <TreadRule variant="mark" width={128} className="mt-[var(--sp-3)] text-[var(--accent)]" />

          {img && (
            <div className="relative mt-[var(--sp-6)] aspect-[4/3] overflow-hidden rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--img-plate)]">
              <Image src={img} alt={title} fill sizes="(min-width: 1024px) 640px, 92vw" className="object-cover" />
            </div>
          )}

          {/* Se randează doar dacă există. Nu punem tab gol. */}
          {body && <div className="measure mt-[var(--sp-6)] text-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: body }} />}

          {cap ? (
            <>
              <p className="measure mt-[var(--sp-6)] text-500 font-medium leading-snug text-[var(--ink-strong)]">
                {sText(cap.carlig, locale)}
              </p>
              <p className="measure mt-[var(--sp-4)] text-300 text-[var(--ink)]">{sText(cap.corp, locale)}</p>

              {cap.include ? (
                <div className="mt-[var(--sp-5)]">
                  <p className="label">{sText(cap.include.titlu, locale)}</p>
                  <ul className="mt-[var(--sp-3)] space-y-[var(--sp-2)]">
                    {cap.include.puncte.map((p, i) => (
                      <li key={i} className="measure flex gap-[var(--sp-3)] text-300 text-[var(--ink)]">
                        <span aria-hidden="true" className="mt-[0.7em] h-px w-[10px] shrink-0 bg-[var(--line-contrast)]" />
                        <span>{sText(p, locale)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* Prețurile capitolului, aceleași date ca pe pagina de servicii —
                  o singură sursă, ca să nu se despartă niciodată. */}
              {cap.tabele.map((tabel, i) =>
                tabel.randuri.length > 8 ? (
                  <TabelFiltrat key={i} tabel={tabel} locale={locale} coloanaEvidentiata={5} />
                ) : (
                  <TabelPreturi key={i} tabel={tabel} locale={locale} />
                ),
              )}
            </>
          ) : null}

          <p className="mt-[var(--sp-5)] text-200">
            <Link href="/servicii" className="nav-link">
              {locale === "ru" ? "Все услуги и цены" : "Toate serviciile și prețurile"}
            </Link>
          </p>

          <div className="mt-[var(--sp-8)] flex flex-wrap items-center gap-[var(--sp-3)]">
            <a href={telLink(settings.phone_e164)} className="inline-flex min-h-11 items-center gap-[var(--sp-2)] rounded-[var(--radius-sm)] bg-[var(--accent)] px-[var(--sp-5)] text-300 font-medium text-[var(--accent-ink)]">
              <IconPhone size={17} />
              <span className="num">{settings.phone_display}</span>
            </a>
            <WhatsAppButton message={t("wa.service", { service: title })} label={t("services.askOnWhatsApp")} />
          </div>

          <ul className="mt-[var(--sp-6)] flex flex-wrap gap-x-[var(--sp-6)] gap-y-[var(--sp-2)] text-200 text-[var(--ink-muted)]">
            <li className="flex items-center gap-[var(--sp-2)]"><IconPin size={15} />{settings.address}</li>
            <li className="flex items-center gap-[var(--sp-2)]"><IconClock size={15} />{t("contact.hoursValue")}</li>
          </ul>
        </div>

        <aside className="lg:sticky lg:top-[76px] lg:self-start">
          <div className="rounded-[var(--radius-sm)] border border-[var(--line)] p-[var(--sp-5)]">
            <h2 className="text-400 font-semibold text-[var(--ink-strong)]">{t("services.book")}</h2>
            <BookingForm serviceId={service.id} locale={locale} phone={settings.phone_display} />
          </div>
        </aside>
      </div>

      {others.length > 0 && (
        <section className="mt-[var(--sp-12)]">
          <h2 className="text-500 font-semibold text-[var(--ink-strong)]">{t("services.title")}</h2>
          <TreadRule variant="full" className="mt-[var(--sp-3)] text-[var(--line)]" />
          <ul className="mt-[var(--sp-5)] grid gap-[var(--sp-3)] sm:grid-cols-2 lg:grid-cols-3">
            {others.map((s) => (
              <li key={s.id}>
                <Link href={{ pathname: "/[slug]", params: { slug: (locale === "ru" ? s.slug_ru : s.slug_ro) ?? s.slug_ro } }}
                  className="flex h-full items-center rounded-[var(--radius-sm)] border border-[var(--line)] px-[var(--sp-4)] py-[var(--sp-4)] text-300 text-[var(--ink-strong)] transition-colors duration-[var(--dur-1)] hover:border-[var(--line-strong)]">
                  {(locale === "ru" ? s.title_ru : s.title_ro) ?? s.title_ro}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org", "@type": "Service", name: title,
          provider: { "@type": "AutoRepair", name: "anvelope-ungheni.md", telephone: settings.phone_e164, address: settings.address },
          areaServed: settings.city,
          ...(dela !== null
            ? { offers: { "@type": "AggregateOffer", priceCurrency: "MDL", lowPrice: dela } }
            : {}),
        }),
      }} />
    </article>
  );
}
