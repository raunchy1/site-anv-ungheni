import type { Metadata } from "next";
import { DesignSystemShell } from "./Shell";
import { getBrandOptions, getSeasonCounts } from "@/lib/db/queries";

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

export default async function DesignSystemPage() {
  const [brands, seasonCounts] = await Promise.all([getBrandOptions(), getSeasonCounts()]);
  return <DesignSystemShell brands={brands} seasonCounts={seasonCounts} />;
}
