/**
 * Tariful de livrare.
 *
 * Stă într-un fișier separat, nu lângă acțiunea de server, pentru un motiv
 * concret: într-un modul cu `"use server"` TOATE exporturile devin referințe de
 * acțiune. Un obiect exportat de acolo ajunge în client ca funcție, iar
 * `COST_LIVRARE[livrare]` dă `undefined` — adică „Total: NaN MDL" pe ecranul de
 * comandă. S-a întâmplat exact așa, o dată.
 *
 * Cifrele: în Ungheni livrăm noi, deci nu costă nimic; în restul țării plătim
 * curier.
 */
export const COST_LIVRARE = {
  ridicare_magazin: 0,
  curier_ungheni: 0,
  curier_moldova: 100,
} as const;

export type MetodaLivrare = keyof typeof COST_LIVRARE;
