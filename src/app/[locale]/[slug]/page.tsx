import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import {
  getBrandBySlug, getLegalPageBySlug, getProductBySlug, getServiceBySlug, resolveRootSlug,
} from "@/lib/db/queries";
import { db } from "@/lib/supabase/server";
import { ProductPage, productMetadata } from "@/components/product/ProductPage";
import { BrandPage, brandMetadata } from "@/components/product/BrandPage";
import { ServicePage, serviceMetadata } from "@/components/product/ServicePage";
import { LegalPageView, legalMetadata } from "@/components/product/LegalPageView";
import type { Locale } from "@/lib/types";

/** O zi, nu 15 minute: vezi nota din `catalog/[...filtre]/page.tsx`. */
export const revalidate = 86400;
/** Slug-urile negenerate la build se randează la prima cerere și rămân în cache. */
export const dynamicParams = true;

/**
 * Pre-generăm rutele PUȚINE ȘI STABILE: cele 134 de branduri, cele 9 servicii,
 * cele 4 pagini legale. Fișele de produs NU se mai pre-generează, niciuna.
 *
 * Pana acum se pre-generau si primele 400 de produse dupa pret. Cantareau 200 MB
 * de HTML si de payload RSC PER LIMBA, adica 400 MB din cei ~1 GB pe care ii urca
 * fiecare deploy — iar Deployment Storage aduna toate deploy-urile pastrate, nu
 * doar ultimul. La 10 GB, contul se umplea in opt deploy-uri.
 *
 * Nu se pierde nimic in afara de prima randare. Ruta are `dynamicParams` si
 * `revalidate = 86400`, deci fisa se randeaza la prima cerere si ramane in
 * cache-ul ISR o zi — exact regimul in care traiau deja celelalte 14.600 de
 * fise. Iar cache-ul ISR se masoara separat de Deployment Storage, si acolo
 * avem loc: 64.000 de scrieri din 200.000.
 */
export async function generateStaticParams() {
  const [{ data: brands }, { data: services }, { data: legal }] = await Promise.all([
    db.from("brands").select("slug_ro, slug_ru").gt("product_count", 0),
    db.from("services").select("slug_ro, slug_ru").eq("is_active", true),
    db.from("legal_pages").select("slug_ro, slug_ru"),
  ]);

  type Pair = { slug_ro: string; slug_ru: string | null };
  const all = [...(brands ?? []), ...(services ?? []), ...(legal ?? [])] as Pair[];
  return all.flatMap((r) => [
    { locale: "ro", slug: r.slug_ro },
    { locale: "ru", slug: r.slug_ru ?? r.slug_ro },
  ]);
}

/**
 * Resolver de rută rădăcină. Produsele, brandurile, serviciile și paginile legale
 * stau toate pe `/`. Ordinea e fixă și verificată: pagină legală -> serviciu ->
 * brand -> produs -> 404. Raportul de migrare confirmă zero coliziuni în ambele
 * spații de nume (REPORT.md §8).
 */
export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const l = locale as Locale;
  const match = await resolveRootSlug(slug, l);
  if (!match) return {};

  switch (match.type) {
    case "legal": return legalMetadata(await getLegalPageBySlug(slug, l), l);
    case "service": return serviceMetadata(await getServiceBySlug(slug, l), l);
    case "brand": return brandMetadata(await getBrandBySlug(slug, l), l);
    case "product": return productMetadata(await getProductBySlug(slug, l), l);
  }
}

/**
 * Ruta nu citește `searchParams`. Ar face-o dinamică pentru toate cele 15.000 de
 * slug-uri, inclusiv pentru fișele pre-generate — măsurat, diferența e între 6 ms
 * și 400 ms de TTFB. Paginarea paginilor de brand trăiește în ruta de catalog
 * (`/catalog-anvelope/marca_michelin?pagina=2`), unde dinamismul e firesc.
 */
export default async function RootSlugPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const l = locale as Locale;
  const match = await resolveRootSlug(slug, l);
  if (!match) notFound();

  switch (match.type) {
    case "legal": {
      const page = await getLegalPageBySlug(slug, l);
      if (!page) notFound();
      return <LegalPageView page={page} locale={l} />;
    }
    case "service": {
      const service = await getServiceBySlug(slug, l);
      if (!service) notFound();
      return <ServicePage service={service} locale={l} />;
    }
    case "brand": {
      const brand = await getBrandBySlug(slug, l);
      if (!brand) notFound();
      return <BrandPage brand={brand} locale={l} />;
    }
    case "product": {
      const product = await getProductBySlug(slug, l);
      if (!product) notFound();
      return <ProductPage product={product} locale={l} />;
    }
  }
}
