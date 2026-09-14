"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/supabase/auth";
import { GET as syncCronGet } from "@/app/api/cron/sync/route";

export type ActionResult = { ok: true; message?: string; body?: unknown } | { ok: false; error: string };

export type QuarantineResolution = "approved" | "rejected" | "ignored";

const VALID_RESOLUTIONS: QuarantineResolution[] = ["approved", "rejected", "ignored"];

/** Rezolvă un rând deschis din sync_quarantine — doar marchează, fără a rescrie pipeline-ul. */
export async function resolveQuarantine(id: number, resolution: QuarantineResolution): Promise<ActionResult> {
  await requireAdminUser();
  if (!VALID_RESOLUTIONS.includes(resolution)) return { ok: false, error: "Rezoluție invalidă." };

  const { error } = await adminDb()
    .from("sync_quarantine")
    .update({ resolution, resolved_at: new Date().toISOString() })
    .eq("id", id)
    .is("resolved_at", null);

  if (error) return { ok: false, error: "Nu s-a putut rezolva elementul din carantină." };

  revalidatePath("/admin/sincronizare");
  return { ok: true, message: `Marcat ca ${resolution}.` };
}

/**
 * Declanșează dry-run pe ruta existentă `/api/cron/sync?dry=1`.
 * CRON_SECRET rămâne doar pe server — se construiește un Request intern
 * și se apelează handler-ul GET, fără a expune secretul în browser.
 */
export async function runSyncDryRun(mode: "new" | "refresh"): Promise<ActionResult> {
  await requireAdminUser();

  const secret = process.env.CRON_SECRET;
  if (!secret) return { ok: false, error: "CRON_SECRET nu e configurat pe server." };

  const url = new URL("http://internal.local/api/cron/sync");
  url.searchParams.set("dry", "1");
  url.searchParams.set("mode", mode === "refresh" ? "refresh" : "new");

  const request = new Request(url.toString(), {
    method: "GET",
    headers: { authorization: `Bearer ${secret}` },
  });

  try {
    const res = await syncCronGet(request);
    const body = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      return {
        ok: false,
        error: typeof body.eroare === "string" ? body.eroare : typeof body.error === "string" ? body.error : `HTTP ${res.status}`,
      };
    }
    revalidatePath("/admin/sincronizare");
    const sarit = typeof body.sarit === "string" ? body.sarit : null;
    return {
      ok: true,
      message: sarit ? `Sărit: ${sarit}` : `Dry-run (${mode}) OK — nimic scris.`,
      body,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
