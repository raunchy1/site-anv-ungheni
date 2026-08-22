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

/* ------------------------------------------------------------- comerț */

import type { Locale, Product, Season } from "./types";

/** „4 285 MDL" cu unitate, sau `null` când produsul n-are preț. */
export const money = (value: number | null | undefined, withUnit = true): string | null =>
  value == null ? null : withUnit ? formatPriceWithUnit(Number(value)) : formatPrice(Number(value));

/**
 * Nimeni nu cumpără o singură anvelopă. Prețul bucății rămâne primar — e ce
 * compară clientul în Google — dar setul se afișează imediat dedesubt, ca să nu
 * facă înmulțirea în cap și să plece.
 */
export const priceForSet = (unit: number | null | undefined, qty = 4): number | null =>
  unit == null ? null : Number(unit) * qty;

export const sizeLabel = (p: Pick<Product, "size_raw" | "width" | "aspect" | "diameter">): string | null =>
  formatSize({ width: p.width, aspect: p.aspect, diameter: p.diameter, sizeRaw: p.size_raw });

export const indexLabel = (p: Pick<Product, "load_index" | "speed_index">): string | null =>
  formatIndex(p.load_index, normalizeSpeedIndex(p.speed_index));

export const SEASONS: Season[] = ["vara", "iarna", "all_season"];

/* ---------------------------------------------------------------- WhatsApp */

/**
 * În Moldova se comandă pe WhatsApp mai des decât prin coș, deci linkul e canal
 * principal, nu buton decorativ. Mesajul vine din traduceri, deci e în limba paginii.
 */
const WA_NUMBER = "37368263644";

export const whatsappLink = (message: string): string =>
  `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;

export const telLink = (e164: string): string => `tel:${e164.replace(/\s/g, "")}`;

/* ----------------------------------------------------------------- canonic */

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://anvelope-ungheni.md";

/** URL absolut în limba dată. RO la rădăcină, RU sub /ru. */
export const absoluteUrl = (path: string, locale: Locale): string => {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return locale === "ru" ? `${SITE_URL}/ru${clean}` : `${SITE_URL}${clean}`;
};
