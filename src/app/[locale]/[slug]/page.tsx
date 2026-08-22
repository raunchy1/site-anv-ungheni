import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import {
  getBrandBySlug, getLegalPageBySlug, getProductBySlug, getServiceBySlug, resolveRootSlug,
} from "@/lib/db/queries";
import { ProductPage, productMetadata } from "@/components/product/ProductPage";
import { BrandPage, brandMetadata } from "@/components/product/BrandPage";
import { ServicePage, serviceMetadata } from "@/components/product/ServicePage";
import { LegalPageView, legalMetadata } from "@/components/product/LegalPageView";
import type { Locale } from "@/lib/types";

export const revalidate = 900;

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

export default async function RootSlugPage({
  params, searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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
      const sp = await searchParams;
      const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
      return <BrandPage brand={brand} locale={l} search={{ pagina: one(sp.pagina), sortare: one(sp.sortare), indisponibile: one(sp.indisponibile) }} />;
    }
    case "product": {
      const product = await getProductBySlug(slug, l);
      if (!product) notFound();
      return <ProductPage product={product} locale={l} />;
    }
  }
}
