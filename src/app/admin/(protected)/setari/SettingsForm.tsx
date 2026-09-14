"use client";

import { useActionState } from "react";
import type { SettingsFormState } from "./actions";

const inputClass =
  "h-10 rounded-[var(--radius-sm)] border border-[var(--field-line)] bg-[var(--field-bg)] px-[var(--sp-3)] text-300 text-[var(--ink-strong)] outline-none focus:border-[var(--accent)]";
const labelClass = "text-100 font-medium uppercase tracking-wide text-[var(--ink-muted)]";

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[var(--sp-1)]">
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--surface)] p-[var(--sp-4)]">
      <h2 className="text-300 font-semibold text-[var(--ink-strong)]">{title}</h2>
      <div className="mt-[var(--sp-3)] grid grid-cols-1 gap-[var(--sp-3)] sm:grid-cols-2">{children}</div>
    </section>
  );
}

export type SettingsValues = {
  phone_display: string;
  phone_e164: string;
  email: string;
  address: string;
  city: string;
  maps_url: string;
  lat: number;
  lng: number;
  warranty_years: number;
  credit_badge_ro: string | null;
  credit_badge_ru: string | null;
  sync_enabled: boolean;
  opening_hours: { mon_sat?: string; sun?: string | null; note?: string | null };
  pricing_rules: { default_margin_pct?: number } | null;
};

export function SettingsForm({
  settings,
  action,
}: {
  settings: SettingsValues;
  action: (prev: SettingsFormState, formData: FormData) => Promise<SettingsFormState>;
}) {
  const [state, formAction, pending] = useActionState<SettingsFormState, FormData>(action, null);
  const hours = settings.opening_hours ?? {};
  const margin = settings.pricing_rules?.default_margin_pct ?? 15;

  return (
    <form action={formAction} className="flex flex-col gap-[var(--sp-4)]">
      <div className="flex items-baseline justify-between gap-[var(--sp-4)]">
        <h1 className="text-500 font-semibold text-[var(--ink-strong)]">Setări</h1>
        <button
          type="submit"
          disabled={pending}
          className="h-10 rounded-[var(--radius-xs)] bg-[var(--accent)] px-[var(--sp-5)] text-300 font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {pending ? "Se salvează…" : "Salvează"}
        </button>
      </div>

      {state?.ok === true ? <p className="text-300 text-[var(--ok)]">{state.message}</p> : null}
      {state?.ok === false ? <p className="text-300 text-[var(--warn)]">{state.error}</p> : null}

      <Section title="Contact">
        <Field label="Telefon afișat *" htmlFor="phone_display">
          <input id="phone_display" name="phone_display" required defaultValue={settings.phone_display} className={inputClass} />
        </Field>
        <Field label="Telefon E.164 *" htmlFor="phone_e164">
          <input id="phone_e164" name="phone_e164" required defaultValue={settings.phone_e164} className={inputClass} />
        </Field>
        <Field label="E-mail *" htmlFor="email">
          <input id="email" name="email" type="email" required defaultValue={settings.email} className={inputClass} />
        </Field>
        <Field label="Oraș *" htmlFor="city">
          <input id="city" name="city" required defaultValue={settings.city} className={inputClass} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Adresă *" htmlFor="address">
            <input id="address" name="address" required defaultValue={settings.address} className={inputClass} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="URL Google Maps *" htmlFor="maps_url">
            <input id="maps_url" name="maps_url" required defaultValue={settings.maps_url} className={inputClass} />
          </Field>
        </div>
        <Field label="Latitudine *" htmlFor="lat">
          <input id="lat" name="lat" type="number" step="any" required defaultValue={settings.lat} className={inputClass} />
        </Field>
        <Field label="Longitudine *" htmlFor="lng">
          <input id="lng" name="lng" type="number" step="any" required defaultValue={settings.lng} className={inputClass} />
        </Field>
      </Section>

      <Section title="Program">
        <Field label="Luni–Sâmbătă" htmlFor="hours_mon_sat">
          <input id="hours_mon_sat" name="hours_mon_sat" defaultValue={hours.mon_sat ?? ""} className={inputClass} />
        </Field>
        <Field label="Duminică (gol = închis)" htmlFor="hours_sun">
          <input id="hours_sun" name="hours_sun" defaultValue={hours.sun ?? ""} className={inputClass} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Notă program" htmlFor="hours_note">
            <input id="hours_note" name="hours_note" defaultValue={hours.note ?? ""} className={inputClass} />
          </Field>
        </div>
      </Section>

      <Section title="Comercial">
        <Field label="Garanție (ani)" htmlFor="warranty_years">
          <input
            id="warranty_years"
            name="warranty_years"
            type="number"
            defaultValue={settings.warranty_years}
            className={inputClass}
          />
        </Field>
        <Field label="Marjă implicită sync (%)" htmlFor="default_margin_pct">
          <input
            id="default_margin_pct"
            name="default_margin_pct"
            type="number"
            step="0.1"
            defaultValue={margin}
            className={inputClass}
          />
        </Field>
        <Field label="Badge credit RO" htmlFor="credit_badge_ro">
          <input
            id="credit_badge_ro"
            name="credit_badge_ro"
            defaultValue={settings.credit_badge_ro ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Badge credit RU" htmlFor="credit_badge_ru">
          <input
            id="credit_badge_ru"
            name="credit_badge_ru"
            defaultValue={settings.credit_badge_ru ?? ""}
            className={inputClass}
          />
        </Field>
      </Section>

      <Section title="Sincronizare">
        <div className="sm:col-span-2">
          <label className="flex items-start gap-[var(--sp-3)] text-300 text-[var(--ink)]">
            <input
              id="sync_enabled"
              name="sync_enabled"
              type="checkbox"
              defaultChecked={settings.sync_enabled}
              className="mt-1 size-4"
            />
            <span>
              <span className="font-medium text-[var(--ink-strong)]">sync_enabled</span>
              <span className="mt-[var(--sp-1)] block text-200 text-[var(--ink-muted)]">
                Pipeline-ul cron respectă acest comutator. Debifat = rulările se opresc fără să scrie în catalog.
                Vezi și{" "}
                <a href="/admin/sincronizare" className="text-[var(--accent)] underline">
                  Sincronizare
                </a>
                .
              </span>
            </span>
          </label>
        </div>
      </Section>
    </form>
  );
}
