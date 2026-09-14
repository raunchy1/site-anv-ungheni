"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/supabase/auth";
import { idLiber } from "@/lib/admin/id-liber";
import type { Season, StockStatus } from "@/lib/types";
// Convenția de slug e a catalogului — aceeași ca la editorul de produs (Etapa 2).
import { slugPereche } from "../../../../../../tools/sync/pandashop/slug.mjs";

export type CreateProductState = { ok: false; error: string } | null;

const VALID_SEASONS: Season[] = ["vara", "iarna", "all_season"];
const VALID_STOCK: StockStatus[] = ["in_stock", "supplier", "out_of_stock"];

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed === "" ? null : trimmed;
}

function num(formData: FormData, key: string): number | null {
  const v = str(formData, key);
  if (v == null) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** Propunere de slug din titluri — nu se salvează singură. */
export async function previewSlug(titleRo: string, titleRu: string): Promise<{ slug_ro: string; slug_ru: string }> {
  await requireAdminUser();
  return slugPereche(titleRo, titleRu || titleRo);
}

/** Încarcă toate `legacy_product_id` existente (paginat — PostgREST limitează la 1000). */
async function loadLegacyIds(db: ReturnType<typeof adminDb>): Promise<Set<number>> {
  const folosite = new Set<number>();
  const pageSize = 1000;
  let from = 0;
  for (;;) {
    const { data, error } = await db
      .from("products")
      .select("legacy_product_id")
      .order("legacy_product_id", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    for (const row of rows) folosite.add(row.legacy_product_id as number);
    if (rows.length < pageSize) break;
    from += pageSize;
  }
  return folosite;
}

export async function createProduct(_prev: CreateProductState, formData: FormData): Promise<CreateProductState> {
  await requireAdminUser();
  const db = adminDb();

  const titleRo = str(formData, "title_ro");
  if (!titleRo) return { ok: false, error: "Titlul RO e obligatoriu." };

  const titleRu = str(formData, "title_ru");
  let slugRo = str(formData, "slug_ro");
  let slugRu = str(formData, "slug_ru");

  // Dacă adminul n-a completat slug-urile, le generăm din titluri (aceeași regulă ca sync).
  if (!slugRo || !slugRu) {
    const pair = slugPereche(titleRo, titleRu || titleRo);
    if (!slugRo) slugRo = pair.slug_ro || null;
    if (!slugRu) slugRu = pair.slug_ru || null;
  }
  if (!slugRo) return { ok: false, error: "Slug RO e obligatoriu — completează titlul sau slug-ul." };

  const seasonRaw = str(formData, "season");
  const season = VALID_SEASONS.includes(seasonRaw as Season) ? (seasonRaw as Season) : null;

  const stockRaw = str(formData, "stock_status") ?? "out_of_stock";
  const stockStatus = VALID_STOCK.includes(stockRaw as StockStatus)
    ? (stockRaw as StockStatus)
    : ("out_of_stock" as StockStatus);

  const priceMdl = num(formData, "price_mdl");
  if (priceMdl != null && priceMdl <= 0) {
    return { ok: false, error: "Prețul trebuie să fie un număr mai mare ca 0." };
  }
  // products_stocked_needs_price: stoc ≠ out_of_stock cere preț
  if (stockStatus !== "out_of_stock" && priceMdl == null) {
    return { ok: false, error: "Pune un preț — fără preț, produsul nu poate fi pe stoc." };
  }

  const brandIdRaw = str(formData, "brand_id");
  const brandId = brandIdRaw != null ? Number(brandIdRaw) : null;
  const resolvedBrandId = brandId != null && Number.isFinite(brandId) ? brandId : null;
  let brandName: string | null = null;
  if (resolvedBrandId != null) {
    const { data: brand } = await db.from("brands").select("name").eq("id", resolvedBrandId).single();
    brandName = brand?.name ?? null;
  }

  const width = num(formData, "width");
  const aspect = num(formData, "aspect");
  const diameter = str(formData, "diameter");
  const sizeRaw = str(formData, "size_raw");
  const hasSize =
    Boolean(sizeRaw) ||
    (width != null && aspect != null && Boolean(diameter));
  // products_active_needs_size: activ + size_source = 'none' e refuzat
  const sizeSource = hasSize ? "attribute" : "none";
  const isActive = formData.get("is_active") === "on";
  if (isActive && !hasSize) {
    return {
      ok: false,
      error: "Un produs activ are nevoie de o măsură validă — completează măsura sau lasă-l inactiv.",
    };
  }

  let folosite: Set<number>;
  try {
    folosite = await loadLegacyIds(db);
  } catch {
    return { ok: false, error: "Nu s-au putut citi ID-urile existente." };
  }
  const legacyProductId = idLiber(`admin:${Date.now()}`, folosite);

  const row = {
    legacy_product_id: legacyProductId,
    title_ro: titleRo,
    title_ru: titleRu,
    description_ro: str(formData, "description_ro"),
    description_ru: str(formData, "description_ru"),
    meta_title_ro: str(formData, "meta_title_ro"),
    meta_title_ru: str(formData, "meta_title_ru"),
    meta_desc_ro: str(formData, "meta_desc_ro"),
    meta_desc_ru: str(formData, "meta_desc_ru"),
    width: width != null ? Math.trunc(width) : null,
    aspect: aspect != null ? Math.trunc(aspect) : null,
    diameter,
    size_raw: sizeRaw,
    size_source: sizeSource,
    size_system: hasSize ? ("metric" as const) : null,
    load_index: str(formData, "load_index"),
    speed_index: str(formData, "speed_index"),
    is_xl: formData.get("is_xl") === "on",
    is_runflat: formData.get("is_runflat") === "on",
    season,
    brand_id: resolvedBrandId,
    brand_name: brandName,
    model: str(formData, "model"),
    is_active: isActive,
    slug_ro: slugRo,
    slug_ru: slugRu,
    // Capcană PROMPT Etapa 4: fără lock, sync-ul de noapte poate atinge produsul.
    price_locked: true,
    price_source: "admin_edit" as const,
    price_mdl: priceMdl,
    price_updated_at: priceMdl != null ? new Date().toISOString() : null,
    stock_status: stockStatus,
    // Enum product_source: legacy | pandashop_sync | manual | pneuexpert_sync — nu există 'admin'.
    source: "manual" as const,
    category: "anvelope" as const,
    imported_at: new Date().toISOString(),
  };

  const { data: inserted, error } = await db
    .from("products")
    .insert(row)
    .select("id, slug_ro, slug_ru")
    .single();

  if (error) {
    if (error.message.includes("products_active_needs_size")) {
      return {
        ok: false,
        error: "Un produs activ are nevoie de o măsură validă — completează măsura sau lasă-l inactiv.",
      };
    }
    if (error.message.includes("products_stocked_needs_price")) {
      return { ok: false, error: "Pune un preț — fără preț, produsul nu poate fi pe stoc." };
    }
    if (error.code === "23505") {
      return { ok: false, error: "Slug-ul e deja folosit de alt produs — alege altul." };
    }
    return { ok: false, error: "Nu s-a putut crea produsul." };
  }
  if (!inserted) return { ok: false, error: "Nu s-a putut crea produsul." };

  updateTag("catalog");
  updateTag(`produs:${inserted.slug_ro}`);
  if (inserted.slug_ru) updateTag(`produs:${inserted.slug_ru}`);

  redirect(`/admin/produse/${inserted.id}`);
}
