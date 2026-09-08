"use client";

import { useTranslations } from "next-intl";
import { TELEFON_AFISAT, TELEFON_E164, telLink } from "@/lib/format";

/**
 * CE VEDE OMUL CÂND RANDAREA CADE.
 *
 * Până acum: nimic de-al nostru. Fără graniță de eroare, Next livrează pagina
 * lui albă, „Application error: a server-side exception has occurred" — în
 * engleză, fără telefon, fără drum înapoi. Traducerile pentru pagina asta
 * existau de la început (`errors.serverTitle`, `errors.serverBody`), doar că nu
 * le citea nimeni.
 *
 * Contează exact în ziua în care baza clipește. O pagină deja randată continuă
 * să vină din cache chiar dacă interogarea eșuează la reîmprospătare; una cerută
 * prima oară nu are ce servi — și atunci singurul lucru care mai poate fi de
 * folos e numărul de telefon, scris mare, plus butonul de reîncercare. Marfa se
 * vinde și la telefon.
 */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errors");

  return (
    <div className="shell py-[var(--sp-12)]">
      <h1 className="text-700 font-semibold tracking-[var(--tr-title)] text-[var(--ink-strong)]">
        {t("serverTitle")}
      </h1>
      <p className="measure mt-[var(--sp-5)] text-300 text-[var(--ink-muted)]">
        {t("serverBody", { phone: TELEFON_AFISAT })}
      </p>
      <div className="mt-[var(--sp-6)] flex flex-wrap items-center gap-[var(--sp-4)]">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)] px-[var(--sp-5)] text-300 font-semibold text-[var(--on-accent)] transition-colors duration-[var(--dur-1)] hover:bg-[var(--accent-hover)]"
        >
          {t("retry")}
        </button>
        <a href={telLink(TELEFON_E164)} className="num text-400 font-medium text-[var(--ink-strong)] underline underline-offset-4">
          {TELEFON_AFISAT}
        </a>
      </div>
    </div>
  );
}
