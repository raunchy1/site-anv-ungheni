"use server";

import { updateTag } from "next/cache";
import { adminDb } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/supabase/auth";
import type { StockStatus } from "@/lib/types";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Vezi PROMPT-PANOU-ADMIN.md §2.1: eticheta unui produs se deduce din slug-ul
 * cu care a fost citit (`produs:<slug>`), și RO/RU pot avea slug-uri diferite
 * — se golesc amândouă. `catalog` acoperă listările; se golește doar aici,
 * unde chiar s-a schimbat preț sau stoc, nu la fiecare tastă din filtre.
 *
 * `updateTag`, nu `revalidateTag`: suntem într-o Server Action, iar
 * citește-ce-ai-scris contează — admin-ul trebuie să vadă imediat propria
 * modificare, nu o fereastră de `cacheLife`. Vezi nota din
 * `src/app/api/cron/sync/route.ts`, unde ruta (nu o Server Action) foloseşte
 * `revalidateTag(tag, { expire: 0 })` pentru exact acelaşi motiv, pe altă cale.
 */
function revalidateProduct(slugRo: string, slugRu: string | null) {
  updateTag(`produs:${slugRo}`);
  if (slugRu) updateTag(`produs:${slugRu}`);
  updateTag("catalog");
}

export async function updateProductPrice(id: number, priceMdl: number): Promise<ActionResult> {
  await requireAdminUser();

  if (!Number.isFinite(priceMdl) || priceMdl <= 0) {
    return { ok: false, error: "Prețul trebuie să fie un număr mai mare ca 0." };
  }

  const { data, error } = await adminDb()
    .from("products")
    .update({
      price_mdl: priceMdl,
      // Prețul pus manual nu se mai suprascrie la sincronizarea de noapte.
      price_locked: true,
      price_source: "admin_edit",
      price_updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("slug_ro, slug_ru")
    .single();

  if (error || !data) return { ok: false, error: "Nu s-a putut salva prețul." };

  revalidateProduct(data.slug_ro, data.slug_ru);
  return { ok: true };
}

export async function updateProductStock(id: number, stockStatus: StockStatus): Promise<ActionResult> {
  await requireAdminUser();

  const { data, error } = await adminDb()
    .from("products")
    .update({ stock_status: stockStatus })
    .eq("id", id)
    .select("slug_ro, slug_ru")
    .single();

  if (error) {
    // constrângerea products_stocked_needs_price (migrarea 0002)
    if (error.message.includes("products_stocked_needs_price")) {
      return { ok: false, error: "Pune mai întâi un preț — fără preț, produsul nu poate fi pe stoc." };
    }
    return { ok: false, error: "Nu s-a putut salva starea de stoc." };
  }
  if (!data) return { ok: false, error: "Produsul nu a fost găsit." };

  revalidateProduct(data.slug_ro, data.slug_ru);
  return { ok: true };
}

/** Butonul de deblocare din §2.2: prețul revine sub sincronizarea de noapte. */
export async function unlockProductPrice(id: number): Promise<ActionResult> {
  await requireAdminUser();

  const { data, error } = await adminDb()
    .from("products")
    .update({ price_locked: false })
    .eq("id", id)
    .select("slug_ro, slug_ru")
    .single();

  if (error || !data) return { ok: false, error: "Nu s-a putut debloca prețul." };

  revalidateProduct(data.slug_ro, data.slug_ru);
  return { ok: true };
}
