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
 */
export const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
  fallback: ["ui-monospace", "monospace"],
});

export const fontVars = `${plexSans.variable} ${plexMono.variable}`;
