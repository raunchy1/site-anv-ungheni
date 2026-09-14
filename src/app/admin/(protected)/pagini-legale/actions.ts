"use server";

import { updateTag } from "next/cache";
import { adminDb } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/supabase/auth";

export type LegalFormState = { ok: true; message: string } | { ok: false; error: string } | null;

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

export async function updateLegalPage(
  id: number,
  _prev: LegalFormState,
  formData: FormData,
): Promise<LegalFormState> {
  await requireAdminUser();

  const titleRo = str(formData, "title_ro");
  const slugRo = str(formData, "slug_ro");
  if (!titleRo) return { ok: false, error: "Titlul RO e obligatoriu." };
  if (!slugRo) return { ok: false, error: "Slug RO e obligatoriu." };

  const patch = {
    title_ro: titleRo,
    title_ru: str(formData, "title_ru"),
    slug_ro: slugRo,
    slug_ru: str(formData, "slug_ru"),
    body_ro: str(formData, "body_ro"),
    body_ru: str(formData, "body_ru"),
    meta_desc_ro: str(formData, "meta_desc_ro"),
    meta_desc_ru: str(formData, "meta_desc_ru"),
    sort_order: num(formData, "sort_order") ?? 0,
  };

  const { error } = await adminDb().from("legal_pages").update(patch).eq("id", id);
  if (error) {
    if (error.message.includes("duplicate") || error.code === "23505") {
      return { ok: false, error: "Slug-ul există deja la altă pagină." };
    }
    return { ok: false, error: "Nu s-a putut salva pagina." };
  }

  updateTag("catalog");
  return { ok: true, message: "Pagina a fost salvată." };
}
