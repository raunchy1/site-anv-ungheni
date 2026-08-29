import { cn } from "@/lib/cn";
import type { TabelPreturi as Tabel } from "@/content/servicii";
import { text } from "@/content/servicii";
import type { Locale } from "@/lib/types";

/**
 * Tabelul de prețuri.
 *
 * Trei decizii, toate din același motiv — omul care se uită aici compară cifre,
 * nu citește:
 *
 * 1. CIFRELE ÎN MONO, aliniate la dreapta. Coloana de prețuri trebuie să se
 *    citească pe verticală, iar `1 500` și `90` trebuie să aibă unitățile una
 *    sub alta. Prima coloană rămâne în Sans: e etichetă, nu valoare.
 * 2. COLOANA CARE CONTEAZĂ E MARCATĂ. La vulcanizare, „Service complet" e
 *    prețul pe care îl caută 9 din 10 clienți; stă pe fundal coborât, ca să se
 *    găsească fără să numeri coloanele. Fără culoare — roșul e rezervat.
 * 3. FĂRĂ ZEBRĂ. Liniile subțiri despart destul; benzile alternante ar adăuga
 *    o a doua rețea peste cea de cifre.
 *
 * PE TELEFON, tabelul lat nu rămâne tabel. Șapte coloane pe 390 px înseamnă
 * trei vizibile și patru derulate — iar „Service complet", cifra pe care o
 * caută toată lumea, ar fi tocmai cea ascunsă. Sub 640 px fiecare rând devine
 * un card: „R15 · AUTO" în cap, apoi operațiunile una sub alta. Aceleași date,
 * din aceeași sursă, zero derulare laterală.
 */
export function TabelPreturi({
  tabel,
  locale,
  coloanaEvidentiata,
}: {
  tabel: Tabel;
  locale: Locale;
  /** Indexul coloanei de scos în față (0-based). */
  coloanaEvidentiata?: number;
}) {
  /* O coloană se aliniază la dreapta doar dacă TOATE valorile ei sunt cifre.
     „Tip" (AUTO, SUV, Tablă) e text și rămâne la stânga — altfel coloana pare
     o valoare, nu o etichetă. */
  const numeric = (i: number) =>
    i > 0 && tabel.randuri.every((r) => /^[\d.,]+$/.test(String(r[i] ?? "")));

  /** Peste patru coloane nu mai încape pe telefon; vezi comentariul de sus. */
  const lat = tabel.coloane.length > 4;

  return (
    <figure className="mt-[var(--sp-5)] max-w-[var(--measure-table)]">
      {tabel.titlu ? (
        <figcaption className="label mb-[var(--sp-3)]">{text(tabel.titlu, locale)}</figcaption>
      ) : null}

      <div
        className={cn(
          "scroll-x overflow-x-auto rounded-[var(--radius-sm)] border border-[var(--line)]",
          lat && "hidden sm:block",
        )}
      >
        <table className="w-full border-collapse text-[var(--fs-200)]">
          <thead>
            <tr className="border-b border-[var(--line-strong)] bg-[var(--bg-sunken)]">
              {tabel.coloane.map((c, i) => (
                <th
                  key={i}
                  scope="col"
                  className={cn(
                    "px-[var(--sp-3)] py-[var(--sp-3)] text-left align-bottom",
                    "text-[var(--fs-100)] font-semibold uppercase tracking-[var(--tr-label)] text-[var(--ink-muted)]",
                    numeric(i) && "text-right",
                    i === 0 && "sticky left-0 z-10 bg-[var(--bg-sunken)]",
                    i === coloanaEvidentiata && "text-[var(--ink-strong)]",
                  )}
                >
                  {text(c, locale)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tabel.randuri.map((r, ri) => (
              <tr
                key={ri}
                className="border-b border-[var(--line)] last:border-0 transition-colors duration-[var(--dur-1)] hover:bg-[var(--surface-2)]"
              >
                {r.map((v, ci) => (
                  <td
                    key={ci}
                    className={cn(
                      "px-[var(--sp-3)] py-[var(--sp-3)] whitespace-nowrap",
                      ci === 0
                        ? "sticky left-0 z-10 bg-[var(--surface)] font-medium text-[var(--ink-strong)]"
                        : "text-[var(--ink)]",
                      numeric(ci) && "num font-mono text-right tabular-nums",
                      // tabelele de două coloane au prețul în text („150 lei”),
                      // deci se aliniază la dreapta, dar rămâne în Sans
                      tabel.coloane.length === 2 && ci === 1 && "num text-right font-medium text-[var(--ink-strong)]",
                      ci === coloanaEvidentiata && "bg-[var(--bg-sunken)] font-semibold text-[var(--ink-strong)]",
                    )}
                  >
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ------------------------------------------------ varianta de telefon */}
      {lat ? (
        <ul className="space-y-[var(--sp-2)] sm:hidden">
          {tabel.randuri.map((r, ri) => (
            <li key={ri} className="rounded-[var(--radius-sm)] border border-[var(--line)]">
              <p className="flex items-baseline gap-[var(--sp-2)] border-b border-[var(--line)] bg-[var(--bg-sunken)] px-[var(--sp-3)] py-[var(--sp-2)]">
                <span className="num font-mono text-300 font-semibold text-[var(--ink-strong)]">{r[0]}</span>
                <span className="text-200 text-[var(--ink-muted)]">{r[1]}</span>
              </p>
              <dl className="divide-y divide-[var(--line)]">
                {r.slice(2).map((v, ci) => {
                  const col = ci + 2;
                  return (
                    <div
                      key={col}
                      className={cn(
                        "flex items-baseline justify-between gap-[var(--sp-3)] px-[var(--sp-3)] py-[var(--sp-2)]",
                        col === coloanaEvidentiata && "bg-[var(--bg-sunken)]",
                      )}
                    >
                      <dt className="text-200 text-[var(--ink-muted)]">{text(tabel.coloane[col], locale)}</dt>
                      <dd
                        className={cn(
                          "num font-mono text-300 tabular-nums text-[var(--ink-strong)]",
                          col === coloanaEvidentiata && "font-semibold",
                        )}
                      >
                        {v}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </li>
          ))}
        </ul>
      ) : null}

      {tabel.nota ? (
        <p className="measure mt-[var(--sp-3)] text-[var(--fs-200)] text-[var(--ink-muted)]">
          {text(tabel.nota, locale)}
        </p>
      ) : null}
    </figure>
  );
}
