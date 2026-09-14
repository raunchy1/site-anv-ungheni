"use server";

import { updateTag } from "next/cache";
import { adminDb } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/supabase/auth";
import type { Season } from "@/lib/types";
// Convenția de slug e a catalogului, nu a panoului: RO cu cratime, RU cu
// lățimea lipită. Se refolosește fișierul din sync, nu se rescrie regula aici.
import { slugPereche } from "../../../../../../tools/sync/pandashop/slug.mjs";

export type ProductFormState = { ok: true; message: string } | { ok: false; error: string } | null;

const VALID_SEASONS: Season[] = ["vara", "iarna", "all_season"];

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed === "" ? null : trimmed;
}

function num(formData: FormData, key: string): number | null {
  const v = str(formData, key);
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Propunere de slug din titlurile curente ale formularului — nu se salvează singură. */
export async function previewSlug(titleRo: string, titleRu: string): Promise<{ slug_ro: string; slug_ru: string }> {
  await requireAdminUser();
  return slugPereche(titleRo, titleRu || titleRo);
}

export async function updateProduct(id: number, _prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  await requireAdminUser();
  const db = adminDb();

  const { data: existing, error: fetchError } = await db
    .from("products")
    .select("slug_ro, slug_ru, title_ro, title_ru, is_active")
    .eq("id", id)
    .single();
  if (fetchError || !existing) return { ok: false, error: "Produsul nu a fost găsit." };

  const titleRo = str(formData, "title_ro");
  const slugRo = str(formData, "slug_ro");
  const slugRu = str(formData, "slug_ru");
  if (!titleRo) return { ok: false, error: "Titlul RO e obligatoriu." };
  if (!slugRo) return { ok: false, error: "Slug RO e obligatoriu." };

  const seasonRaw = str(formData, "season");
  const season = VALID_SEASONS.includes(seasonRaw as Season) ? (seasonRaw as Season) : null;

  const brandIdRaw = str(formData, "brand_id");
  const brandId = brandIdRaw != null ? Number(brandIdRaw) : null;
  let brandName: string | null = null;
  if (brandId != null) {
    const { data: brand } = await db.from("brands").select("name").eq("id", brandId).single();
    brandName = brand?.name ?? null;
  }

  const patch = {
    title_ro: titleRo,
    title_ru: str(formData, "title_ru"),
    description_ro: str(formData, "description_ro"),
    description_ru: str(formData, "description_ru"),
    meta_title_ro: str(formData, "meta_title_ro"),
    meta_title_ru: str(formData, "meta_title_ru"),
    meta_desc_ro: str(formData, "meta_desc_ro"),
    meta_desc_ru: str(formData, "meta_desc_ru"),
    width: num(formData, "width"),
    aspect: num(formData, "aspect"),
    diameter: str(formData, "diameter"),
    size_raw: str(formData, "size_raw"),
    load_index: str(formData, "load_index"),
    speed_index: str(formData, "speed_index"),
    is_xl: formData.get("is_xl") === "on",
    is_runflat: formData.get("is_runflat") === "on",
    season,
    brand_id: brandId,
    brand_name: brandName,
    model: str(formData, "model"),
    is_active: formData.get("is_active") === "on",
    slug_ro: slugRo,
    slug_ru: slugRu,
  };

  const { data: updated, error } = await db
    .from("products")
    .update(patch)
    .eq("id", id)
    .select("slug_ro, slug_ru")
    .single();

  if (error) {
    // constrângerea products_active_needs_size (migrarea 0002)
    if (error.message.includes("products_active_needs_size")) {
      return { ok: false, error: "Un produs activ are nevoie de o măsură validă — completează măsura sau dezactivează-l." };
    }
    if (error.code === "23505") {
      return { ok: false, error: "Slug-ul e deja folosit de alt produs — alege altul." };
    }
    return { ok: false, error: "Nu s-a putut salva produsul." };
  }
  if (!updated) return { ok: false, error: "Produsul nu a fost găsit." };

  // Golește fișa nouă ȘI pe cea veche, dacă slug-ul s-a schimbat — altfel
  // adresa veche rămâne în cache cu conținut învechit până la o lună (§2.1).
  // Fișa se golește la orice salvare (orice câmp de-aici e pe pagina publică);
  // `catalog` doar când s-a schimbat ceva vizibil în listări — titlu sau
  // disponibilitate — nu la fiecare tastă dintr-o descriere.
  updateTag(`produs:${updated.slug_ro}`);
  if (updated.slug_ru) updateTag(`produs:${updated.slug_ru}`);
  if (existing.slug_ro !== updated.slug_ro) updateTag(`produs:${existing.slug_ro}`);
  if (existing.slug_ru && existing.slug_ru !== updated.slug_ru) updateTag(`produs:${existing.slug_ru}`);

  const titleChanged = existing.title_ro !== patch.title_ro || existing.title_ru !== patch.title_ru;
  const availabilityChanged = existing.is_active !== patch.is_active;
  if (titleChanged || availabilityChanged) updateTag("catalog");

  return { ok: true, message: "Salvat." };
}
