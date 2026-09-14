import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/supabase/server";
import { BrandForm } from "../BrandForm";
import { updateBrand } from "../actions";

export const metadata: Metadata = { title: "Editează marca" };

type BrandDetail = {
  id: number;
  name: string;
  slug_ro: string;
  slug_ru: string | null;
  description_ro: string | null;
  description_ru: string | null;
  logo_url: string | null;
  logo_on_dark: boolean;
  logo_ratio: number | null;
  meta_title_ro: string | null;
  meta_title_ru: string | null;
  meta_desc_ro: string | null;
  meta_desc_ru: string | null;
  product_count: number;
  is_active: boolean;
};

export default async function MarcaEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isFinite(id)) notFound();

  const { data, error } = await adminDb()
    .from("brands")
    .select(
      "id, name, slug_ro, slug_ru, description_ro, description_ru, logo_url, logo_on_dark, logo_ratio, meta_title_ro, meta_title_ru, meta_desc_ro, meta_desc_ru, product_count, is_active",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) notFound();
  const brand = data as BrandDetail;
  const bound = updateBrand.bind(null, brand.id);

  return <BrandForm brand={brand} action={bound} title={brand.name} />;
}
