import type { Metadata } from "next";
import { adminDb } from "@/lib/supabase/server";
import { SettingsForm, type SettingsValues } from "./SettingsForm";
import { updateSettings } from "./actions";

export const metadata: Metadata = { title: "Setări" };

export default async function SetariPage() {
  const { data, error } = await adminDb()
    .from("settings")
    .select(
      "phone_display, phone_e164, email, address, city, maps_url, lat, lng, warranty_years, credit_badge_ro, credit_badge_ru, sync_enabled, opening_hours, pricing_rules",
    )
    .eq("id", true)
    .single();

  if (error || !data) {
    return <p className="text-300 text-[var(--warn)]">Eroare la citirea setărilor: {error?.message ?? "lipsă rând"}</p>;
  }

  return <SettingsForm settings={data as SettingsValues} action={updateSettings} />;
}
