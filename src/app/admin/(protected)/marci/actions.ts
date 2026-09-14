"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/supabase/auth";

export type BrandFormState = { ok: true; message: string } | { ok: false; error: string } | null;

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed === "" ? null : trimmed;
}

function brandPatch(formData: FormData) {
  return {
    name: str(formData, "name"),
    slug_ro: str(formData, "slug_ro"),
    slug_ru: str(formData, "slug_ru"),
    description_ro: str(formData, "description_ro"),
    description_ru: str(formData, "description_ru"),
    logo_url: str(formData, "logo_url"),
    meta_title_ro: str(formData, "meta_title_ro"),
    meta_title_ru: str(formData, "meta_title_ru"),
    meta_desc_ro: str(formData, "meta_desc_ro"),
    meta_desc_ru: str(formData, "meta_desc_ru"),
    is_active: formData.get("is_active") === "on",
  };
}

export async function updateBrand(id: number, _prev: BrandFormState, formData: FormData): Promise<BrandFormState> {
  await requireAdminUser();
  const patch = brandPatch(formData);
  if (!patch.name) return { ok: false, error: "Numele e obligatoriu." };
  if (!patch.slug_ro) return { ok: false, error: "Slug RO e obligatoriu." };

  const { error } = await adminDb().from("brands").update(patch).eq("id", id);
  if (error) {
    if (error.message.includes("duplicate") || error.code === "23505") {
      return { ok: false, error: "Slug-ul există deja la altă marcă." };
    }
    return { ok: false, error: "Nu s-a putut salva marca." };
  }

  updateTag("catalog");
  return { ok: true, message: "Marca a fost salvată." };
}

/** Soft: dezactivează sau reactivează — fără DELETE. */
export async function setBrandActive(id: number, isActive: boolean): Promise<BrandFormState> {
  await requireAdminUser();
  const { error } = await adminDb().from("brands").update({ is_active: isActive }).eq("id", id);
  if (error) return { ok: false, error: "Nu s-a putut actualiza starea." };
  updateTag("catalog");
  return { ok: true, message: isActive ? "Marca a fost reactivată." : "Marca a fost dezactivată." };
}

export async function createBrand(_prev: BrandFormState, formData: FormData): Promise<BrandFormState> {
  await requireAdminUser();
  const patch = brandPatch(formData);
  if (!patch.name) return { ok: false, error: "Numele e obligatoriu." };
  if (!patch.slug_ro) return { ok: false, error: "Slug RO e obligatoriu." };

  const { data, error } = await adminDb().from("brands").insert(patch).select("id").single();
  if (error || !data) {
    if (error?.message.includes("duplicate") || error?.code === "23505") {
      return { ok: false, error: "Slug-ul există deja la altă marcă." };
    }
    return { ok: false, error: "Nu s-a putut crea marca." };
  }

  updateTag("catalog");
  redirect(`/admin/marci/${data.id}`);
}
