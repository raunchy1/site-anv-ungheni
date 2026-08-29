"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { TabelPreturi } from "./TabelPreturi";
import { text, type TabelPreturi as Tabel } from "@/content/servicii";
import type { Locale } from "@/lib/types";

/**
 * Tabelul de vulcanizare, cu filtru de diametru.
 *
 * 27 de rânduri e o listă de căutat, nu de citit. Șoferul știe exact ce
 * diametru are — scrie pe flancul anvelopei — deci un rând de chipsuri îl duce
 * de la 27 de rânduri la trei într-o atingere. Fără filtru, pe telefon ar fi
 * derulat 27 de carduri ca să găsească R17.
 *
 * „Toate" rămâne starea implicită: cine vrea să compare prețul între diametre
 * (înainte să cumpere jante mai mari, de exemplu) vede tot tabelul, ca înainte.
 */
export function TabelFiltrat({
  tabel,
  locale,
  coloanaEvidentiata,
}: {
  tabel: Tabel;
  locale: Locale;
  coloanaEvidentiata?: number;
}) {
  const diametre = [...new Set(tabel.randuri.map((r) => r[0]))];
  const [ales, setAles] = useState<string | null>(null);

  /* Titlul iese din tabel și urcă deasupra filtrului: altfel chipsurile ar sta
     înaintea propriului lor cap de secțiune. */
  const filtrat: Tabel = {
    ...tabel,
    titlu: undefined,
    randuri: ales ? tabel.randuri.filter((r) => r[0] === ales) : tabel.randuri,
  };

  return (
    <div className="mt-[var(--sp-5)] max-w-[var(--measure-table)]">
      {tabel.titlu ? <p className="label mb-[var(--sp-3)]">{text(tabel.titlu, locale)}</p> : null}

      <div className="flex flex-wrap items-center gap-[var(--sp-2)]">
        <span className="text-200 mr-[var(--sp-1)] text-[var(--ink-muted)]">
          {locale === "ru" ? "Диаметр:" : "Diametru:"}
        </span>
        <Chip activ={ales === null} onClick={() => setAles(null)}>
          {locale === "ru" ? "Все" : "Toate"}
        </Chip>
        {diametre.map((d) => (
          <Chip key={d} activ={ales === d} onClick={() => setAles(ales === d ? null : d)} mono>
            {d}
          </Chip>
        ))}
      </div>

      <TabelPreturi tabel={filtrat} locale={locale} coloanaEvidentiata={coloanaEvidentiata} />
    </div>
  );
}

function Chip({
  activ,
  mono = false,
  onClick,
  children,
}: {
  activ: boolean;
  mono?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={activ}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-9 items-center rounded-[var(--radius-xs)] border px-[var(--sp-3)] text-200",
        "transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)]",
        mono && "num font-mono",
        activ
          ? "border-[var(--ink-strong)] bg-[var(--ink-strong)] text-[var(--ink-invert)]"
          : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink-strong)] hover:border-[var(--field-line-hover)] hover:bg-[var(--surface-2)]",
      )}
    >
      {children}
    </button>
  );
}
