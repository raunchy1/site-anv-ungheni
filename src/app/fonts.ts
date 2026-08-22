import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

/**
 * Două familii, o singură superfamilie.
 *
 * IBM Plex Sans — grotesc tehnic, variabil, cu chirilic și latin-ext desenate de
 * aceeași echipă. Verificat pe fișierele reale servite de Google Fonts: zero glife
 * lipsă din Ă Â Î Ș Ț și din tot alfabetul chirilic, iar cele zece cifre au toate
 * lățimea 600/1000em din desen, deci se aliniază fără `font-feature-settings`.
 *
 * IBM Plex Mono — aceeași lățime de cifră. `205/55 R16` în Mono și `1 847` în Sans
 * cad pe același pas orizontal.
 *
 * SUBSETURI PE LIMBĂ — măsurat, nu presupus. `next/font` preîncarcă tot ce declari.
 * Cu toate subseturile într-o singură instanță, o pagină românească descărca
 * 13 fișiere / 184 KB, jumătate chirilic pe care nu-l afișează niciodată.
 *
 * RO: `latin` + `latin-ext` (Ă Â Î Ș Ț sunt în latin-ext).
 * RU: `latin` + `cyrillic` — `latin` e obligatoriu și acolo, titlurile de produs
 * sunt „Michelin Primacy 4 205/55 R16", nu chirilice.
 * `cyrillic-ext` nu se încarcă nicăieri: nu conține nimic din rusa modernă.
 *
 * Apelurile sunt scrise pe litere, nu generate: `next/font` se evaluează la build
 * și refuză orice argument care nu e literal.
 */
const sansRo = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const sansRu = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin", "cyrillic"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

/**
 * Mono nu se preîncarcă. Măsurat: `next/font` preîncărca 12 fișiere prin payload-ul
 * RSC, dintre care 9 erau Mono, iar toate concurau cu imaginea LCP pe mobil.
 * Cifrele apar cu fallback-ul metric apropiat și se schimbă la `swap` — pe un
 * catalog de prețuri, o zecime de secundă de fallback e mai ieftină decât o
 * secundă de LCP.
 */
const monoRo = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin", "latin-ext"],
  display: "swap",
  preload: false,
  fallback: ["ui-monospace", "monospace"],
});

const monoRu = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin", "cyrillic"],
  display: "swap",
  preload: false,
  fallback: ["ui-monospace", "monospace"],
});

/** Variabilele de font pentru limba cerută. */
export const fontVarsFor = (locale: string): string =>
  locale === "ru" ? `${sansRu.variable} ${monoRu.variable}` : `${sansRo.variable} ${monoRo.variable}`;

/** Pentru rutele din afara segmentului de limbă (`/design-system`). */
export const fontVars = `${sansRo.variable} ${monoRo.variable}`;
