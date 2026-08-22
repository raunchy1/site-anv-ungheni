import type { Metadata } from "next";
import { DesignSystemShell } from "./Shell";

/**
 * Ruta interna de design system.
 * `noindex, nofollow` si exclusa din `sitemap.xml` — vezi ARCHITECTURE.md §3.
 */
export const metadata: Metadata = {
  title: "Design system",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function DesignSystemPage() {
  return <DesignSystemShell />;
}
