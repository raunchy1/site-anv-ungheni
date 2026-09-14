import type { Metadata } from "next";
import { fontVars } from "../fonts";

/**
 * Panoul stă în afara segmentului [locale] — vezi ARHITECTURA în
 * PROMPT-PANOU-ADMIN.md §4. Își aduce propriul document, ca /design-system.
 *
 * Complet dinamic: niciun ecran de-al panoului nu trebuie să intre vreodată
 * în cache-ul ISR — un preț sau un stoc afișat din cache ar minți omul care
 * tocmai l-a schimbat.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · Anvelope Ungheni" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className={`${fontVars} h-full`} suppressHydrationWarning>
      <body className="min-h-full bg-[var(--bg-sunken)] text-[var(--ink)] antialiased">{children}</body>
    </html>
  );
}
