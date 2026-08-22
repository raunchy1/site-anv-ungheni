/**
 * Formatare de cifre. Un singur loc, pentru ca alinierea verticala din tabel
 * depinde de faptul ca fiecare pret e construit identic.
 */

/** Spatiu ingust neintreruptibil — grupeaza miile fara sa rupa randul. */
const NBSP = " ";

/**
 * `1847` -> `1 847`. Fara zecimale: catalogul nu are niciuna, iar `,00`
 * ar adauga trei caractere de zgomot la 15.010 randuri.
 */
export function formatPrice(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
}

export function formatPriceWithUnit(value: number): string {
  return `${formatPrice(value)}${NBSP}MDL`;
}

/** `15010` -> `15 010`. Aceleasi reguli ca la pret. */
export const formatCount = formatPrice;

export type SizeParts = {
  width: number | null;
  aspect: number | null;
  diameter: string | null;
  sizeRaw: string | null;
};

/**
 * `205/55 R16`, sau `31x10.50 R15` pentru cele 20 de anvelope imperiale.
 * Sursa are deja stringul; il reconstruim doar cand lipseste.
 */
export function formatSize(p: SizeParts): string | null {
  if (p.sizeRaw) return p.sizeRaw;
  if (p.width && p.aspect && p.diameter) {
    return `${p.width}/${p.aspect} ${p.diameter}`;
  }
  return null;
}

/** `91` + `V` -> `91V`. Indicele e o unitate, nu doua campuri lipite. */
export function formatIndex(
  load: string | null,
  speed: string | null,
): string | null {
  if (!load && !speed) return null;
  return `${load ?? "—"}${speed ?? ""}`;
}

/**
 * Indicele de viteza contine, in 3 randuri din 15.010, un „Н" chirilic in loc
 * de „H" latin — defect de introducere in catalogul sursa. Il normalizam la
 * afisare; corectia in baza se face la import, nu aici.
 */
export function normalizeSpeedIndex(speed: string | null): string | null {
  if (!speed) return null;
  return speed.replace(/Н/g, "H").replace(/Р/g, "R");
}
