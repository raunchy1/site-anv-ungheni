import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { IconPin, IconPhone, IconClock } from "@/components/icons";
import { TreadRule } from "@/components/icons";
import { Logo } from "@/components/brand/Logo";
import { telLink } from "@/lib/format";
import { getBrands, getServices } from "@/lib/db/queries";
import type { Locale, Settings } from "@/lib/types";

/** Brandurile cu cele mai multe produse — utile, nu decorative. */
const TOP_BRANDS = 12;
const POPULAR_SIZES = [
  { width: 205, aspect: 55, diameter: "R16" },
  { width: 195, aspect: 65, diameter: "R15" },
  { width: 215, aspect: 60, diameter: "R16" },
  { width: 225, aspect: 45, diameter: "R17" },
  { width: 235, aspect: 55, diameter: "R18" },
  { width: 185, aspect: 65, diameter: "R15" },
];

export async function SiteFooter({ settings, locale }: { settings: Settings; locale: Locale }) {
  const t = await getTranslations({ locale });
  const [brands, services] = await Promise.all([getBrands(), getServices()]);
  const top = [...brands].sort((a, b) => b.product_count - a.product_count).slice(0, TOP_BRANDS);
  const hours = settings.opening_hours;

  return (
    <footer className="mt-[var(--sp-16)] border-t border-[var(--line)] bg-[var(--surface-2)]">
      <div className="shell grid gap-[var(--sp-8)] py-[var(--sp-10)] sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo height={44} className="logo" />
          <TreadRule variant="mark" width={92} className="mt-[var(--sp-2)] text-[var(--accent)]" />
          <ul className="mt-[var(--sp-4)] space-y-[var(--sp-3)] text-[var(--fs-200)] text-[var(--ink-muted)]">
            <li className="flex gap-[var(--sp-2)]">
              <IconPin size={16} className="mt-[2px] shrink-0" />
              <span>{settings.address}</span>
            </li>
            <li className="flex gap-[var(--sp-2)]">
              <IconPhone size={16} className="mt-[2px] shrink-0" />
              <a href={telLink(settings.phone_e164)} className="num text-[var(--ink-strong)]">{settings.phone_display}</a>
            </li>
            <li className="flex gap-[var(--sp-2)]">
              <IconClock size={16} className="mt-[2px] shrink-0" />
              <span>
                {t("contact.hoursValue")}
                {/* Cand `opening_hours.sun` se completeaza in admin, programul de
                    duminica apare aici. Pana atunci nu se afiseaza nimic: o nota
                    de lucru pe subsolul fiecarei pagini o citeste clientul, nu
                    programatorul. */}
              </span>
            </li>
          </ul>
        </div>

        <div>
          <p className="label">{t("home.popularSizes")}</p>
          <ul className="mt-[var(--sp-3)] space-y-[var(--sp-2)] text-[var(--fs-200)]">
            {POPULAR_SIZES.map((s) => (
              <li key={`${s.width}-${s.aspect}-${s.diameter}`}>
                <Link
                  href={{ pathname: "/catalog/[...filtre]", params: { filtre: [`latime_${s.width}`, `inaltime_${s.aspect}`, `diametru_${s.diameter.toLowerCase()}`] } }}
                  className="nav-link num"
                >
                  {s.width}/{s.aspect} {s.diameter}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="label">{t("nav.services")}</p>
          <ul className="mt-[var(--sp-3)] space-y-[var(--sp-2)] text-[var(--fs-200)]">
            {services.slice(0, 6).map((s) => (
              <li key={s.id}>
                <Link href={{ pathname: "/[slug]", params: { slug: (locale === "ru" ? s.slug_ru : s.slug_ro) ?? s.slug_ro } }} className="nav-link">
                  {(locale === "ru" ? s.title_ru : s.title_ro) ?? s.title_ro}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="label">{t("nav.brands")}</p>
          <ul className="mt-[var(--sp-3)] grid grid-cols-2 gap-x-[var(--sp-4)] gap-y-[var(--sp-2)] text-[var(--fs-200)]">
            {top.map((b) => (
              <li key={b.id}>
                <Link href={{ pathname: "/[slug]", params: { slug: (locale === "ru" ? b.slug_ru : b.slug_ro) ?? b.slug_ro } }} className="nav-link">
                  {b.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-[var(--line)]">
        <div className="shell flex flex-wrap items-center justify-between gap-[var(--sp-3)] py-[var(--sp-4)] text-[var(--fs-100)] text-[var(--ink-muted)]">
          <p>
            {t("trust.warranty")} · {t("trust.mounting")} · {t("trust.delivery")}
          </p>
          <nav className="flex flex-wrap gap-[var(--sp-4)]">
            <Link href={{ pathname: "/[slug]", params: { slug: locale === "ru" ? "usloviya-ispolzovaniya" : "termeni-si-conditii" } }} className="nav-link">
              {locale === "ru" ? "Условия" : "Termeni"}
            </Link>
            <Link href={{ pathname: "/[slug]", params: { slug: locale === "ru" ? "dostavka-i-oplata" : "livrare-si-plata" } }} className="nav-link">
              {locale === "ru" ? "Доставка" : "Livrare"}
            </Link>
            <Link href={{ pathname: "/[slug]", params: { slug: locale === "ru" ? "vozvrat-i-garantiya" : "retur-si-garantie" } }} className="nav-link">
              {locale === "ru" ? "Возврат" : "Retur"}
            </Link>
            <Link href={{ pathname: "/[slug]", params: { slug: locale === "ru" ? "politika-konfidencialnosti" : "politica-de-confidentialitate" } }} className="nav-link">
              {locale === "ru" ? "Конфиденциальность" : "Confidențialitate"}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
