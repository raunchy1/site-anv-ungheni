"use server";

import { updateTag } from "next/cache";
import { adminDb } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/supabase/auth";

export type SettingsFormState = { ok: true; message: string } | { ok: false; error: string } | null;

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

export async function updateSettings(_prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  await requireAdminUser();

  const phoneDisplay = str(formData, "phone_display");
  const phoneE164 = str(formData, "phone_e164");
  const email = str(formData, "email");
  const address = str(formData, "address");
  const city = str(formData, "city");
  const mapsUrl = str(formData, "maps_url");

  if (!phoneDisplay || !phoneE164 || !email || !address || !city || !mapsUrl) {
    return { ok: false, error: "Telefon, e-mail, adresă, oraș și maps_url sunt obligatorii." };
  }

  const lat = num(formData, "lat");
  const lng = num(formData, "lng");
  const warranty = num(formData, "warranty_years");
  if (lat == null || lng == null) return { ok: false, error: "Coordonatele lat/lng sunt obligatorii." };

  const marginRaw = num(formData, "default_margin_pct");
  const { data: existing } = await adminDb().from("settings").select("pricing_rules").eq("id", true).single();
  const rules =
    existing?.pricing_rules && typeof existing.pricing_rules === "object"
      ? { ...(existing.pricing_rules as Record<string, unknown>) }
      : {};
  if (marginRaw != null) rules.default_margin_pct = marginRaw;

  const patch = {
    phone_display: phoneDisplay,
    phone_e164: phoneE164,
    email,
    address,
    city,
    maps_url: mapsUrl,
    lat,
    lng,
    warranty_years: warranty ?? 2,
    credit_badge_ro: str(formData, "credit_badge_ro"),
    credit_badge_ru: str(formData, "credit_badge_ru"),
    sync_enabled: formData.get("sync_enabled") === "on",
    opening_hours: {
      mon_sat: str(formData, "hours_mon_sat") ?? "9:00-20:00",
      sun: str(formData, "hours_sun"),
      note: str(formData, "hours_note"),
    },
    pricing_rules: rules,
  };

  const { error } = await adminDb().from("settings").update(patch).eq("id", true);
  if (error) return { ok: false, error: "Nu s-au putut salva setările." };

  updateTag("catalog");
  return { ok: true, message: "Setările au fost salvate." };
}

export async function setSyncEnabled(enabled: boolean): Promise<SettingsFormState> {
  await requireAdminUser();
  const { error } = await adminDb().from("settings").update({ sync_enabled: enabled }).eq("id", true);
  if (error) return { ok: false, error: "Nu s-a putut actualiza sync_enabled." };
  updateTag("catalog");
  return { ok: true, message: enabled ? "Sincronizarea e pornită." : "Sincronizarea e oprită." };
}
