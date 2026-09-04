import type { MetadataRoute } from "next";
import { db } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/format";

export const revalidate = 86400;

/**
 * 15.010 produse depășesc limita de 50.000 de URL-uri doar dacă am indexa și
 * combinațiile de filtre — nu o facem (ARCHITECTURE.md §5). Aici intră doar
 * paginile care merită indexate: produse disponibile, branduri cu stoc,
 * servicii, categorii și paginile statice.
 *
 * Produsele indisponibile sunt excluse deliberat: 46% din catalog n-are preț,
 * iar o pagină fără preț nu are ce oferi în rezultatele căutării.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const both = (roPath: string, ruPath: string, priority: number, changeFrequency: "daily" | "weekly" | "monthly") => [
    { url: `${SITE_URL}${roPath}`, priority, changeFrequency, alternates: { languages: { ro: `${SITE_URL}${roPath}`, ru: `${SITE_URL}/ru${ruPath}` } } },
    { url: `${SITE_URL}/ru${ruPath}`, priority, changeFrequency, alternates: { languages: { ro: `${SITE_URL}${roPath}`, ru: `${SITE_URL}/ru${ruPath}` } } },
  ];

  const staticPages: MetadataRoute.Sitemap = [
    ...both("/", "", 1, "daily"),
    ...both("/catalog-anvelope", "/katalog-shin", 0.9, "daily"),
    ...both("/senzori-presiune-anvelope", "/datchiki-davleniya-v-shinah", 0.5, "monthly"),
    ...both("/servicii", "/uslugi", 0.7, "monthly"),
    ...both("/contact", "/kontakty", 0.5, "monthly"),
  ];

  const products: MetadataRoute.Sitemap = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await db.from("products")
      .select("slug_ro, slug_ru, updated_at")
      .eq("is_active", true).in("stock_status", ["in_stock", "supplier"])
      .range(from, from + 999);
    if (!data?.length) break;
    for (const p of data as { slug_ro: string; slug_ru: string | null; updated_at: string }[]) {
      const ru = p.slug_ru ?? p.slug_ro;
      products.push({
        url: `${SITE_URL}/${p.slug_ro}`,
        lastModified: p.updated_at,
        changeFrequency: "weekly",
        priority: 0.6,
        alternates: { languages: { ro: `${SITE_URL}/${p.slug_ro}`, ru: `${SITE_URL}/ru/${ru}` } },
      });
    }
    if (data.length < 1000) break;
  }

  const { data: brands } = await db.from("brands").select("slug_ro, slug_ru, product_count").gt("product_count", 0);
  const { data: services } = await db.from("services").select("slug_ro, slug_ru").eq("is_active", true);

  /* Paginile legale intră în hartă doar în limba în care chiar au text: fără
     `body`, pagina se randează pe `noindex` (LegalPageView), iar o adresă
     trimisă în sitemap și refuzată la indexare e o contradicție pe care Search
     Console o raportează ca eroare. */
  const { data: legal } = await db.from("legal_pages").select("slug_ro, slug_ru, body_ro, body_ru, updated_at");
  type LegalRow = { slug_ro: string; slug_ru: string | null; body_ro: string | null; body_ru: string | null; updated_at: string };
  const legalPages: MetadataRoute.Sitemap = ((legal ?? []) as LegalRow[]).flatMap((p) => {
    const ro = `${SITE_URL}/${p.slug_ro}`;
    const ru = `${SITE_URL}/ru/${p.slug_ru ?? p.slug_ro}`;
    const languages = {
      ...(p.body_ro ? { ro } : {}),
      ...(p.body_ru ? { ru } : {}),
    };
    const entry = (url: string) => ({
      url, lastModified: p.updated_at, changeFrequency: "yearly" as const, priority: 0.2, alternates: { languages },
    });
    return [...(p.body_ro ? [entry(ro)] : []), ...(p.body_ru ? [entry(ru)] : [])];
  });

  return [
    ...staticPages,
    ...((brands ?? []) as { slug_ro: string; slug_ru: string | null }[]).flatMap((b) =>
      both(`/${b.slug_ro}`, `/${b.slug_ru ?? b.slug_ro}`, 0.7, "weekly")),
    ...((services ?? []) as { slug_ro: string; slug_ru: string | null }[]).flatMap((s) =>
      both(`/${s.slug_ro}`, `/${s.slug_ru ?? s.slug_ro}`, 0.6, "monthly")),
    ...legalPages,
    ...products,
  ];
}
