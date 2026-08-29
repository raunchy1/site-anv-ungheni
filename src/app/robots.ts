import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/format";

/**
 * Cât timp site-ul nou stă pe un URL `*.vercel.app`, indexarea e închisă
 * complet.
 *
 * Motivul: e aceeași marfă, aceleași texte și aceleași prețuri ca pe
 * anvelope-ungheni.md. Lăsat la vedere, Google alege singur care versiune e
 * „originalul" — și poate alege preview-ul. Se deschide automat când
 * NEXT_PUBLIC_SITE_URL arată spre domeniul real.
 */
const PREVIEW = /vercel\.app$/.test(new URL(SITE_URL).hostname);

export default function robots(): MetadataRoute.Robots {
  if (PREVIEW) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
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
