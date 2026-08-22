"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createClient } from "@supabase/supabase-js";
import type { Locale } from "@/lib/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } },
);

/** Telefon moldovenesc: +373 urmat de 8 cifre, cu sau fără spații. */
const PHONE = /^(\+?373|0)\s?\d{2}\s?\d{3}\s?\d{3}$/;

export function BookingForm({ serviceId, locale, phone }: { serviceId: number; locale: Locale; phone: string }) {
  const t = useTranslations("services");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const phoneValue = String(form.get("phone") ?? "");
    if (!PHONE.test(phoneValue.trim())) {
      setError(locale === "ru" ? "Проверьте номер телефона" : "Verifică numărul de telefon");
      return;
    }
    setState("sending");
    setError(null);
    const { error: err } = await supabase.from("service_bookings").insert({
      service_id: serviceId,
      name: String(form.get("name") ?? ""),
      phone: phoneValue,
      car_model: String(form.get("car") ?? "") || null,
      preferred_date: String(form.get("date") ?? "") || null,
      note: String(form.get("note") ?? "") || null,
      // honeypot: un om nu-l vede, deci nu-l completează
      hp: String(form.get("website") ?? ""),
    });
    if (err) { setState("error"); setError(t("error", { phone })); return; }
    setState("sent");
  }

  if (state === "sent") {
    return <p className="mt-[var(--sp-4)] text-300 text-[var(--ink)]">{t("sent")}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="mt-[var(--sp-4)] flex flex-col gap-[var(--sp-4)]">
      <Input name="name" label={t("name")} required autoComplete="name" />
      <Input name="phone" label={t("phone")} required type="tel" inputMode="tel" autoComplete="tel" placeholder="+373 68 263 644" />
      <Input name="car" label={t("car")} />
      <Input name="date" label={t("date")} type="date" />
      <Input name="note" label={t("note")} />

      {/* honeypot — ascuns vizual și pentru cititoarele de ecran, dar prezent în DOM */}
      <div aria-hidden="true" className="sr-only-abs">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {error && <p role="alert" className="text-200 text-[var(--danger,var(--accent))]">{error}</p>}

      <Button type="submit" variant="primary" size="md" disabled={state === "sending"}>
        {t("submit")}
      </Button>
    </form>
  );
}
