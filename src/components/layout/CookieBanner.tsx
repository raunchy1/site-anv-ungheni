"use client";

import { useEffect, useRef } from "react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { useConsent } from "@/lib/consent/store";
import type { Locale } from "@/lib/types";

/**
 * Bara de consimțământ.
 *
 * Trei reguli pe care le respectă, pentru că fără ele un banner nu e conform, e
 * doar decor:
 *
 *   1. „Doar necesare" e la fel de vizibil ca „Accept" — același contur, aceeași
 *      mărime, unul lângă altul. Un refuz ascuns într-un link mic invalidează
 *      consimțământul; e cea mai amendată greșeală din câte s-au dat în UE.
 *   2. Nimic nu se încarcă înainte de răspuns. Harta Google stă blocată în
 *      `MapEmbed` până când `usePermis("harta")` spune da, deci bara nu e o
 *      formalitate afișată peste o pagină care oricum a trimis deja datele.
 *   3. Alegerea se poate schimba oricând, din „Setări cookie" în subsol.
 *
 * Nu blochează pagina. Un perete peste conținut, la fel, nu e consimțământ
 * liber, iar aici n-are ce apăra: fără „da", nimic terț nu s-a încărcat.
 */

const T = {
  ro: {
    titlu: "Cookie și date",
    text: "Site-ul folosește stocare locală strict necesară pentru coș și pentru ultima dimensiune căutată. Harta Google de pe pagina de contact este singurul element extern și se încarcă doar cu acordul tău.",
    accept: "Accept harta",
    doarNecesare: "Doar necesare",
    politica: "Politica de cookie",
    confidentialitate: "Confidențialitate",
    setari: "Setări cookie",
    inchide: "Închide",
  },
  ru: {
    titlu: "Cookie и данные",
    text: "Сайт использует локальное хранилище, необходимое для корзины и последнего искомого размера. Карта Google на странице контактов — единственный внешний элемент, и она загружается только с вашего согласия.",
    accept: "Разрешить карту",
    doarNecesare: "Только необходимые",
    politica: "Политика cookie",
    confidentialitate: "Конфиденциальность",
    setari: "Настройки cookie",
    inchide: "Закрыть",
  },
} as const;

export function CookieBanner({ locale }: { locale: Locale }) {
  const { alese, gata, deschis, accepta, refuza } = useConsent();
  const ref = useRef<HTMLDivElement>(null);

  /* Se arată dacă n-a ales nimeni încă, sau dacă a cerut să revadă alegerea.
     `gata` ține bara ascunsă la hidratare: altfel ar clipi o dată pe fiecare
     încărcare, chiar pentru cine a răspuns demult. */
  const vizibil = gata && (alese === null || deschis);

  /* Focusul intră în bară când apare, ca oamenii care navighează cu tastatura
     să nu trebuiască să parcurgă tot subsolul până la ea. */
  useEffect(() => {
    if (vizibil) ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [vizibil]);

  if (!vizibil) return null;

  const t = T[locale] ?? T.ro;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="false"
      aria-labelledby="consim-titlu"
      className={
        "fixed inset-x-0 bottom-0 z-50 border-t border-[var(--line)] bg-[var(--surface)] " +
        "pb-[calc(56px+env(safe-area-inset-bottom))] sm:pb-[env(safe-area-inset-bottom)] " +
        "shadow-[0_-8px_24px_-12px_rgb(0_0_0/0.18)]"
      }
    >
      <div className="shell flex flex-col gap-[var(--sp-4)] py-[var(--sp-4)] lg:flex-row lg:items-center lg:justify-between lg:gap-[var(--sp-6)]">
        <div className="min-w-0">
          <h2 id="consim-titlu" className="label text-[var(--ink-strong)]">
            {t.titlu}
          </h2>
          <p className="measure mt-[var(--sp-1)] text-200 text-[var(--ink-muted)]">
            {t.text}{" "}
            <Link
              href={{ pathname: "/[slug]", params: { slug: locale === "ru" ? "politika-cookie" : "politica-cookie" } }}
              className="nav-link underline"
            >
              {t.politica}
            </Link>
            {" · "}
            <Link
              href={{
                pathname: "/[slug]",
                params: { slug: locale === "ru" ? "politika-konfidencialnosti" : "politica-de-confidentialitate" },
              }}
              className="nav-link underline"
            >
              {t.confidentialitate}
            </Link>
          </p>
        </div>

        {/* Aceeași greutate vizuală pentru ambele. Niciunul nu e `primary`:
            butonul roșu al site-ului e rezervat comenzii, iar aici a accepta
            n-are de ce să pară mai important decât a refuza. */}
        <div className="flex shrink-0 flex-col gap-[var(--sp-3)] sm:flex-row">
          <Button type="button" variant="secondary" size="md" onClick={() => refuza()} className="sm:min-w-[9rem]">
            {t.doarNecesare}
          </Button>
          <Button type="button" variant="secondary" size="md" onClick={() => accepta()} className="sm:min-w-[9rem]">
            {t.accept}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Linkul din subsol care redeschide alegerea. Obligatoriu: consimțământul se retrage la fel de ușor cum se dă. */
export function CookieSettingsLink({ locale }: { locale: Locale }) {
  const { redeschide } = useConsent();
  const t = T[locale] ?? T.ro;
  return (
    <button type="button" onClick={redeschide} className="nav-link text-left">
      {t.setari}
    </button>
  );
}
