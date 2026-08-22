import { cn } from "@/lib/cn";
import type { Product } from "@/lib/sample-products";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { formatSize, normalizeSpeedIndex } from "@/lib/format";
import { IconAllSeason, IconSummer, IconWinter } from "@/components/icons";

/**
 * TABELUL DE SPECIFICATII E CONTINUTUL PAGINII DE PRODUS.
 * 8 produse din 15.010 au descriere. Nu exista tab „Descriere”. Ce ramane
 * sunt patru randuri, si acele patru randuri trebuie sa arate ca o fisa
 * tehnica, nu ca un rest.
 *
 * Doua decizii de aliniere, ambele vizibile cu ochiul liber daca lipsesc:
 * 1. Valorile sunt in IBM Plex Mono. `205/55 R16` si `31x10.50 R15` incep pe
 *    aceeasi coloana si au aceeasi latime pe caracter, deci cifrele se aliniaza
 *    vertical intre randuri SI intre produse diferite.
 * 2. Coloana de etichete are latime fixa (`--spec-label`), nu `auto`.
 *    Cu `auto`, „Indice de sarcină” si „Индекс нагрузки” ar muta coloana de
 *    valori intre RO si RU, si tabelul ar arata ca alt tabel in fiecare limba.
 */

export type SpecRow = { label: string; value: string; icon?: React.ReactNode };

export function buildSpecRows(p: Product, locale: Locale): SpecRow[] {
  const d = t(locale);
  const size = formatSize(p);
  const seasonIcon =
    p.season === "vara" ? (
      <IconSummer size={15} className="text-[var(--season-summer)]" />
    ) : p.season === "iarna" ? (
      <IconWinter size={15} className="text-[var(--season-winter)]" />
    ) : p.season === "all_season" ? (
      <IconAllSeason size={15} className="text-[var(--season-all)]" />
    ) : undefined;
  const seasonLabel =
    p.season === "vara"
      ? d.summer
      : p.season === "iarna"
        ? d.winter
        : p.season === "all_season"
          ? d.allSeason
          : "—";

  return [
    { label: d.size, value: size ?? "—" },
    { label: d.season, value: seasonLabel, icon: seasonIcon },
    { label: d.loadIndex, value: p.loadIndex ?? "—" },
    { label: d.speedIndex, value: normalizeSpeedIndex(p.speedIndex) ?? "—" },
  ];
}

export function SpecTable({
  rows,
  className,
  caption,
  density = "comfortable",
}: {
  rows: readonly SpecRow[];
  className?: string;
  caption?: string;
  /** `compact` in liste de comparatie, `comfortable` pe pagina de produs. */
  density?: "compact" | "comfortable";
}) {
  const pad = density === "compact" ? "py-[var(--sp-2)]" : "py-[var(--sp-3)]";
  return (
    <table
      className={cn("w-full border-collapse text-left", className)}
      style={{ ["--spec-label" as string]: "11.5rem" }}
    >
      {caption ? <caption className="sr-only-abs">{caption}</caption> : null}
      <tbody>
        {rows.map((r) => (
          <tr key={r.label} className="border-b border-[var(--line)] last:border-b-0">
            <th
              scope="row"
              className={cn(
                "label w-[var(--spec-label)] min-w-[8.5rem] align-baseline font-semibold",
                pad,
              )}
            >
              {r.label}
            </th>
            <td className={cn("align-baseline", pad)}>
              <span className="flex items-center gap-[var(--sp-2)]">
                {r.icon}
                <span className="num font-mono text-400 font-medium text-[var(--ink-strong)]">
                  {r.value}
                </span>
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
