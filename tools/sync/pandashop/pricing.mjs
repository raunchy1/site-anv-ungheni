/**
 * Prețul nostru din prețul lor.
 *
 * Regulile stau în `settings.pricing_rules`, editabile din admin fără deploy.
 * Se evaluează în ordine și câștigă PRIMA care se potrivește — nu se cumulează.
 * Ordinea e deliberată: excepția pe brand bate excepția pe interval, care bate
 * marja implicită. Altfel o regulă pe brand n-ar avea niciodată efect.
 *
 *   {
 *     "default_margin_pct": 15,
 *     "rounding": "end_9",
 *     "by_brand": { "Michelin": 12, "Comforser": 22 },
 *     "by_price_range": [ { "max": 1000, "pct": 20 }, { "min": 5000, "pct": 10 } ]
 *   }
 *
 * ROTUNJIREA. `end_9`: se urcă la următorul multiplu de 10, minus 1 — 1828,5
 * devine 1829, 668,15 devine 669. Un preț de forma „…9" citește ca preț gândit,
 * nu ca rezultat de calculator, și e convenția din retail de la noi. Alternativa
 * `none` lasă cifra exactă, rotunjită la leu.
 */

export const REGULI_IMPLICITE = {
  default_margin_pct: 15,
  rounding: 'end_9',
  by_brand: {},
  by_price_range: [],
};

/** Ce marjă se aplică, și de ce. Motivul intră în jurnal, ca să fie explicabil. */
export function marja(pretLor, brand, reguli = REGULI_IMPLICITE) {
  const r = { ...REGULI_IMPLICITE, ...(reguli ?? {}) };

  const peBrand = r.by_brand?.[brand];
  if (typeof peBrand === 'number') return { pct: peBrand, motiv: `brand:${brand}` };

  for (const interval of r.by_price_range ?? []) {
    const subMax = interval.max == null || pretLor <= interval.max;
    const pesteMin = interval.min == null || pretLor >= interval.min;
    if (subMax && pesteMin && typeof interval.pct === 'number') {
      return { pct: interval.pct, motiv: `interval:${interval.min ?? '−∞'}–${interval.max ?? '∞'}` };
    }
  }

  return { pct: r.default_margin_pct, motiv: 'implicit' };
}

export function rotunjeste(valoare, mod = 'end_9') {
  if (mod === 'none') return Math.round(valoare);
  /* Următorul multiplu de 10, minus 1. Pentru o valoare exact pe „…0" formula ar
     da „…9" din decada de DEDESUBT (1000 -> 999), adică sub marja calculată; de
     aceea se urcă o decadă când s-ar întâmpla. Prins de test, nu de ochi. */
  const r = Math.ceil(valoare / 10) * 10 - 1;
  return r < valoare ? r + 10 : r;
}

/**
 * @returns {{ pret: number, pct: number, motiv: string }} sau null dacă prețul lor lipsește.
 */
export function calculeazaPret(pretLor, brand, reguli) {
  if (typeof pretLor !== 'number' || !Number.isFinite(pretLor) || pretLor <= 0) return null;
  const { pct, motiv } = marja(pretLor, brand, reguli);
  const brut = pretLor * (1 + pct / 100);
  return { pret: rotunjeste(brut, (reguli ?? REGULI_IMPLICITE).rounding ?? 'end_9'), pct, motiv };
}
