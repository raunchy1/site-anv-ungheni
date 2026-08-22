import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

/**
 * Doua familii, o singura superfamilie.
 *
 * IBM Plex Sans — grotesc tehnic, variabil, cu chirilic si latin-ext desenate
 * de aceeasi echipa. Verificat pe fisierele reale servite de Google Fonts:
 * 0 glife lipsa din Ă Â Î Ș Ț si din tot alfabetul chirilic, si — esential
 * pentru un catalog de cifre — cele zece cifre au TOATE latimea 600/1000em
 * din desen, deci se aliniaza vertical fara `font-feature-settings`.
 *
 * IBM Plex Mono — aceeasi latime de cifra, 600/1000em. `205/55 R16` scris in
 * Mono si `1 847` scris in Sans cad pe acelasi pas orizontal. Asta e motivul
 * pentru care sunt aceste doua si nu altele: nici o alta pereche testata nu
 * are cifre metric-compatibile intre text si date.
 *
 * `display: swap` cu fallback metric apropiat — pe 3G din Ungheni, textul
 * apare inainte de font.
 */
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
  fallback: ["ui-monospace", "monospace"],
});

export const metadata: Metadata = {
  title: {
    default: "Anvelope Ungheni",
    template: "%s · Anvelope Ungheni",
  },
  description:
    "Anvelope și service auto în Ungheni. 15.010 poziții în catalog, montaj și echilibrare.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ro"
      className={`${plexSans.variable} ${plexMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
