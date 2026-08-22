import "./globals.css";

/**
 * Layout rădăcină minimal. `<html>` și `<body>` se scriu în `[locale]/layout.tsx`,
 * pentru că atributul `lang` depinde de limbă.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
