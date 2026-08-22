import { getTranslations } from "next-intl/server";
import { SizeSelector } from "@/components/ui/SizeSelector";
import { TreadRule } from "@/components/icons";
import { getLocale } from "next-intl/server";
import type { Locale } from "@/lib/types";

/** 404-ul conține selectorul de dimensiune: niciun capăt de drum. */
export default async function NotFound() {
  const t = await getTranslations("errors");
  const locale = (await getLocale()) as Locale;

  return (
    <div className="shell py-[var(--sp-12)]">
      <h1 className="optical-left text-700 font-semibold tracking-[var(--tr-title)] text-[var(--ink-strong)]">{t("notFoundTitle")}</h1>
      <TreadRule variant="mark" width={128} className="mt-[var(--sp-3)] text-[var(--accent)]" />
      <p className="measure mt-[var(--sp-5)] text-300 text-[var(--ink-muted)]">{t("notFoundBody")}</p>
      <div className="mt-[var(--sp-7)]"><SizeSelector locale={locale} /></div>
    </div>
  );
}
