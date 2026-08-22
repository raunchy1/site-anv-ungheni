"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import type { Locale } from "@/lib/types";

/**
 * Comutatorul păstrează pagina curentă. Pentru rutele cu slug traductibil
 * (produs, brand, serviciu), perechea RO/RU vine din bază — vezi `LocalizedSlugs`.
 */
export function LanguageSwitch({ locale, slugs }: { locale: Locale; slugs?: { ro: string; ru: string } }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const go = (next: Locale) => {
    if (slugs) {
      router.replace({ pathname: "/[slug]", params: { slug: next === "ru" ? slugs.ru : slugs.ro } }, { locale: next });
      return;
    }
    router.replace(
      // @ts-expect-error — pathname-ul curent e deja o rută validă din routing.pathnames
      { pathname, params },
      { locale: next },
    );
  };

  return (
    <div className="flex items-center rounded-[var(--radius-sm)] border border-[var(--line)] p-[2px]" role="group" aria-label="Limba">
      {(["ro", "ru"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => go(l)}
          aria-current={locale === l ? "true" : undefined}
          className={`min-w-[34px] rounded-[calc(var(--radius-sm)-2px)] px-[var(--sp-2)] py-[2px] text-[var(--fs-100)] font-medium uppercase transition-colors duration-[var(--dur-1)] ${
            locale === l ? "bg-[var(--ink-strong)] text-[var(--surface)]" : "text-[var(--ink-muted)] hover:text-[var(--ink-strong)]"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
