import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  /** Indicatorul de dev acopera coltul din stanga-jos in capturile de ecran. */
  devIndicators: false,
  /** Nu generam AGENTS.md / CLAUDE.md in radacina: instructiunile proiectului
      sunt in ARCHITECTURE.md si DECISIONS.md, si nu vrem doua surse. */
  agentRules: false,
  images: {
    /**
     * Fotografiile de catalog raman, pana la migrarea in Supabase Storage,
     * pe host-ul vechi. Un singur pattern, cat mai ingust posibil.
     */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "anvelope-ungheni.md",
        pathname: "/image/**",
      },
      {
        protocol: "https",
        hostname: "tzzycvsbnlurypfstisc.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
    /**
     * Logo-urile de marcă vin în SVG din media kit-urile producătorilor.
     * Riscul obișnuit al SVG-ului (script inline) nu se aplică aici: în bucket
     * scrie exclusiv `tools/seed/upload-brand-logos.mjs`, cu service role, din
     * fișiere puse manual — nu există încărcare de la utilizatori. Peste asta,
     * CSP-ul de mai jos le randează fără scripturi și fără pluginuri.
     */
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    /**
     * Cardurile au maximum 280px pe desktop si ~45vw pe mobil.
     * Lista implicita a Next genereaza 8 variante pe care nu le cere nimeni.
     */
    imageSizes: [96, 128, 192, 256, 350],
    deviceSizes: [640, 828, 1080, 1440],
  },
};

export default withNextIntl(nextConfig);
