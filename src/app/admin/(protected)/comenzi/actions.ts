"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/supabase/auth";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type OrderStatus = "nou" | "confirmat" | "in_livrare" | "finalizat" | "anulat";

const ORDER_STATUSES: readonly OrderStatus[] = [
  "nou",
  "confirmat",
  "in_livrare",
  "finalizat",
  "anulat",
];

export async function updateOrderStatus(id: number, status: OrderStatus): Promise<ActionResult> {
  await requireAdminUser();

  if (!ORDER_STATUSES.includes(status)) {
    return { ok: false, error: "Stare de comandă invalidă." };
  }

  const { error } = await adminDb().from("orders").update({ status }).eq("id", id);

  if (error) return { ok: false, error: "Nu s-a putut actualiza starea comenzii." };

  revalidatePath("/admin/comenzi");
  revalidatePath(`/admin/comenzi/${id}`);
  return { ok: true };
}
