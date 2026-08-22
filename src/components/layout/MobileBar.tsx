import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { IconTyre, IconSearch, IconWhatsApp, IconCart } from "@/components/icons";
import { whatsappLink } from "@/lib/format";
import type { Settings } from "@/lib/types";

/**
 * 70%+ din trafic e mobil, iar comanda pleacă des pe WhatsApp — de aceea
 * WhatsApp e în bara fixă, nu într-un widget plutitor care acoperă conținutul.
 */
export function MobileBar({ settings }: { settings: Settings }) {
  const t = useTranslations("nav");
  void settings;

  const item = "flex flex-1 flex-col items-center justify-center gap-[2px] py-[var(--sp-2)] text-[var(--fs-100)] text-[var(--ink-muted)]";

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--surface)] sm:hidden" aria-label={t("catalog")}>
      <div className="flex h-[56px]">
        <Link href="/catalog" className={item}><IconTyre size={20} />{t("catalog")}</Link>
        <Link href="/catalog" className={item}><IconSearch size={20} />{t("search")}</Link>
        <a href={whatsappLink("Bună ziua!")} target="_blank" rel="noopener" className={item}>
          <IconWhatsApp size={20} />WhatsApp
        </a>
        <Link href="/cos" className={item}><IconCart size={20} />{t("cart")}</Link>
      </div>
    </nav>
  );
}
