"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/supabase/auth";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type BookingStatus = "nou" | "confirmat" | "finalizat" | "anulat";

const BOOKING_STATUSES: readonly BookingStatus[] = ["nou", "confirmat", "finalizat", "anulat"];

export async function updateBookingStatus(id: number, status: BookingStatus): Promise<ActionResult> {
  await requireAdminUser();

  if (!BOOKING_STATUSES.includes(status)) {
    return { ok: false, error: "Stare de programare invalidă." };
  }

  const { error } = await adminDb().from("service_bookings").update({ status }).eq("id", id);

  if (error) return { ok: false, error: "Nu s-a putut actualiza starea programării." };

  revalidatePath("/admin/programari");
  revalidatePath(`/admin/programari/${id}`);
  return { ok: true };
}
