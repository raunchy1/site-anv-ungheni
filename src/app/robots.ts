import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/format";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Rutele tranzacționale și cele interne n-au ce căuta în index.
        disallow: ["/admin", "/api/", "/cos", "/checkout", "/comanda/", "/design-system",
          "/ru/korzina", "/ru/oformlenie-zakaza", "/favorite", "/comparare", "/ru/izbrannoe", "/ru/sravnenie"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
