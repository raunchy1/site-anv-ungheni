"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/supabase/auth";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Soft: aprobă (`is_approved = true`) sau respinge (`is_approved = false`) — fără ștergere. */
export async function setReviewApproval(id: number, isApproved: boolean): Promise<ActionResult> {
  await requireAdminUser();

  const { error } = await adminDb().from("reviews").update({ is_approved: isApproved }).eq("id", id);

  if (error) return { ok: false, error: "Nu s-a putut actualiza recenzia." };

  revalidatePath("/admin/recenzii");
  return { ok: true };
}
