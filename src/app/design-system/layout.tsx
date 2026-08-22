import { fontVars } from "../fonts";

/** `/design-system` stă în afara rutării pe limbi, deci își aduce propriul document. */
export default function DesignSystemLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className={`${fontVars} h-full`} suppressHydrationWarning>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
