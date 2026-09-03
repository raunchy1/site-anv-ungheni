import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CartLink } from "@/components/cart/CartLink";
import { LanguageSwitch } from "./LanguageSwitch";
import { Logo } from "@/components/brand/Logo";
import { IconPhone } from "@/components/icons";
import { telLink } from "@/lib/format";
import type { Locale, Settings } from "@/lib/types";

/**
 * Telefonul stă în header ca element proeminent, nu ca detaliu de contact:
 * în Moldova o parte substanțială din comenzi se fac telefonic.
 */
export function SiteHeader({ settings, locale }: { settings: Settings; locale: Locale }) {
  const t = useTranslations("nav");

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--surface)]/95 backdrop-blur-[2px]">
      <div className="shell flex h-[60px] items-center gap-[var(--sp-5)]">
        {/* Numele accesibil sta pe link, nu pe SVG: SVG-ul e `aria-hidden`,
            altfel cititorul de ecran ar anunta de doua ori acelasi lucru. */}
        <Link
          href="/"
          aria-label={t("logoHome")}
          className="logo shrink-0"
        >
          <Logo height={38} className="sm:hidden" />
          <Logo height={48} className="hidden sm:block" />
        </Link>

        <nav className="hidden items-center gap-[var(--sp-5)] text-[var(--fs-200)] md:flex">
          <Link href="/catalog" className="nav-link">{t("catalog")}</Link>
          <Link href="/servicii" className="nav-link">{t("services")}</Link>
          <Link href="/contact" className="nav-link">{t("contact")}</Link>
        </nav>

        <div className="ml-auto flex items-center gap-[var(--sp-4)]">
          <a
            href={telLink(settings.phone_e164)}
            className="hidden items-center gap-[var(--sp-2)] font-mono text-[var(--fs-300)] font-medium text-[var(--ink-strong)] sm:flex"
          >
            <IconPhone size={16} className="text-[var(--ink-muted)]" />
            {settings.phone_display}
          </a>
          <LanguageSwitch locale={locale} />
          {/* Favoritele si compararea nu au inca pagini: `/favorite`,
              `/comparare` si perechile lor RU raspund 404. Doua pictograme pe
              antetul fiecarei pagini care duc in 404 sunt mai rele decat lipsa
              lor, iar Next le si preincarca, deci 404-urile apar chiar si fara
              ca cineva sa apese. Se pun la loc odata cu paginile. */}
          <div className="hidden items-center gap-[var(--sp-1)] sm:flex">
            <CartLink />
          </div>
        </div>
      </div>
    </header>
  );
}
