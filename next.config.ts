import type { NextConfig } from "next";

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
    ],
    formats: ["image/avif", "image/webp"],
    /**
     * Cardurile au maximum 280px pe desktop si ~45vw pe mobil.
     * Lista implicita a Next genereaza 8 variante pe care nu le cere nimeni.
     */
    imageSizes: [96, 128, 192, 256, 350],
    deviceSizes: [640, 828, 1080, 1440],
  },
};

export default nextConfig;
