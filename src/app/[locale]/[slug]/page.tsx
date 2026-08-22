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

export const revalidate = 900;
/** Slug-urile negenerate la build se randează la prima cerere și rămân în cache. */
export const dynamicParams = true;

/**
 * Pre-generăm rutele care aduc trafic: cele 134 de branduri, cele 9 servicii,
 * cele 4 pagini legale și primele 400 de produse disponibile, cele mai ieftine —
 * adică exact ce vede un client care caută preț. Restul de 14.600 de fișe se
 * randează la prima cerere și rămân în cache; a le pre-genera pe toate ar face
 * build-ul să dureze zeci de minute pentru pagini pe care nu le cere nimeni.
 */
export async function generateStaticParams() {
  const [{ data: products }, { data: brands }, { data: services }, { data: legal }] = await Promise.all([
    db.from("products").select("slug_ro, slug_ru")
      .eq("is_active", true).in("stock_status", ["in_stock", "supplier"])
      .not("price_mdl", "is", null).order("price_mdl", { ascending: true }).limit(400),
    db.from("brands").select("slug_ro, slug_ru").gt("product_count", 0),
    db.from("services").select("slug_ro, slug_ru").eq("is_active", true),
    db.from("legal_pages").select("slug_ro, slug_ru"),
  ]);

  type Pair = { slug_ro: string; slug_ru: string | null };
  const all = [...(products ?? []), ...(brands ?? []), ...(services ?? []), ...(legal ?? [])] as Pair[];
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
