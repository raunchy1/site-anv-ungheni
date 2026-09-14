"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/supabase/auth";

export type ServiceFormState = { ok: true; message: string } | { ok: false; error: string } | null;

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

function servicePatch(formData: FormData) {
  return {
    title_ro: str(formData, "title_ro"),
    title_ru: str(formData, "title_ru"),
    slug_ro: str(formData, "slug_ro"),
    slug_ru: str(formData, "slug_ru"),
    body_ro: str(formData, "body_ro"),
    body_ru: str(formData, "body_ru"),
    excerpt_ro: str(formData, "excerpt_ro"),
    excerpt_ru: str(formData, "excerpt_ru"),
    image_url: str(formData, "image_url"),
    price_from_mdl: num(formData, "price_from_mdl"),
    meta_title_ro: str(formData, "meta_title_ro"),
    meta_title_ru: str(formData, "meta_title_ru"),
    meta_desc_ro: str(formData, "meta_desc_ro"),
    meta_desc_ru: str(formData, "meta_desc_ru"),
    sort_order: num(formData, "sort_order") ?? 0,
    is_active: formData.get("is_active") === "on",
  };
}

export async function updateService(
  id: number,
  _prev: ServiceFormState,
  formData: FormData,
): Promise<ServiceFormState> {
  await requireAdminUser();
  const patch = servicePatch(formData);
  if (!patch.title_ro) return { ok: false, error: "Titlul RO e obligatoriu." };
  if (!patch.slug_ro) return { ok: false, error: "Slug RO e obligatoriu." };

  const { error } = await adminDb().from("services").update(patch).eq("id", id);
  if (error) {
    if (error.message.includes("duplicate") || error.code === "23505") {
      return { ok: false, error: "Slug-ul există deja la alt serviciu." };
    }
    return { ok: false, error: "Nu s-a putut salva serviciul." };
  }

  updateTag("catalog");
  return { ok: true, message: "Serviciul a fost salvat." };
}

export async function createService(_prev: ServiceFormState, formData: FormData): Promise<ServiceFormState> {
  await requireAdminUser();
  const patch = servicePatch(formData);
  if (!patch.title_ro) return { ok: false, error: "Titlul RO e obligatoriu." };
  if (!patch.slug_ro) return { ok: false, error: "Slug RO e obligatoriu." };

  const { data, error } = await adminDb().from("services").insert(patch).select("id").single();
  if (error || !data) {
    if (error?.message.includes("duplicate") || error?.code === "23505") {
      return { ok: false, error: "Slug-ul există deja la alt serviciu." };
    }
    return { ok: false, error: "Nu s-a putut crea serviciul." };
  }

  updateTag("catalog");
  redirect(`/admin/servicii/${data.id}`);
}
