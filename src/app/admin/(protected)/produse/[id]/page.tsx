import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminDb, imageUrl } from "@/lib/supabase/server";
import type { Season } from "@/lib/types";
import { ProductEditForm } from "./ProductEditForm";
import { ImagesPanel } from "./ImagesPanel";
import type { ProductImageRow } from "./images-actions";

export const metadata: Metadata = { title: "Editează produs" };

export type ProductDetail = {
  id: number;
  slug_ro: string;
  slug_ru: string | null;
  title_ro: string;
  title_ru: string | null;
  description_ro: string | null;
  description_ru: string | null;
  meta_title_ro: string | null;
  meta_title_ru: string | null;
  meta_desc_ro: string | null;
  meta_desc_ru: string | null;
  width: number | null;
  aspect: number | null;
  diameter: string | null;
  size_raw: string | null;
  load_index: string | null;
  speed_index: string | null;
  is_xl: boolean;
  is_runflat: boolean;
  season: Season | null;
  brand_id: number | null;
  brand_name: string | null;
  model: string | null;
  is_active: boolean;
};

const COLUMNS = `id, slug_ro, slug_ru, title_ro, title_ru, description_ro, description_ru,
  meta_title_ro, meta_title_ru, meta_desc_ro, meta_desc_ru,
  width, aspect, diameter, size_raw, load_index, speed_index,
  is_xl, is_runflat, season, brand_id, brand_name, model, is_active`;

export default async function EditeazaProdusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId)) notFound();

  const db = adminDb();
  const [{ data: product, error }, { data: brands }, { data: images }] = await Promise.all([
    db.from("products").select(COLUMNS).eq("id", productId).single(),
    db.from("brands").select("id, name").eq("is_active", true).order("name"),
    db
      .from("product_images")
      .select(
        "id, product_id, storage_path, original_path, content_hash, width, height, alt_ro, alt_ru, sort_order",
      )
      .eq("product_id", productId)
      .order("sort_order", { ascending: true }),
  ]);

  if (error || !product) notFound();

  const rows = (images ?? []) as ProductImageRow[];
  const imageUrls: Record<number, string | null> = {};
  for (const img of rows) {
    imageUrls[img.id] = imageUrl(img.storage_path);
  }

  const detail = product as unknown as ProductDetail;
  const canApplyToModel = detail.brand_id != null && Boolean(detail.model?.trim());

  return (
    <div className="flex flex-col gap-[var(--sp-4)]">
      <ProductEditForm product={detail} brands={(brands ?? []) as { id: number; name: string }[]} />
      <ImagesPanel
        productId={productId}
        images={rows}
        imageUrls={imageUrls}
        canApplyToModel={canApplyToModel}
      />
    </div>
  );
}
