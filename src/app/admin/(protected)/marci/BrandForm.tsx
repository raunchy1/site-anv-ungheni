"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { BrandFormState } from "./actions";

const inputClass =
  "h-10 rounded-[var(--radius-sm)] border border-[var(--field-line)] bg-[var(--field-bg)] px-[var(--sp-3)] text-300 text-[var(--ink-strong)] outline-none focus:border-[var(--accent)]";
const labelClass = "text-100 font-medium uppercase tracking-wide text-[var(--ink-muted)]";
const areaClass =
  "min-h-[96px] rounded-[var(--radius-sm)] border border-[var(--field-line)] bg-[var(--field-bg)] px-[var(--sp-3)] py-[var(--sp-2)] text-300 text-[var(--ink-strong)] outline-none focus:border-[var(--accent)]";

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

export type BrandFormValues = {
  id?: number;
  name: string;
  slug_ro: string;
  slug_ru: string | null;
  description_ro: string | null;
  description_ru: string | null;
  logo_url: string | null;
  meta_title_ro: string | null;
  meta_title_ru: string | null;
  meta_desc_ro: string | null;
  meta_desc_ru: string | null;
  is_active: boolean;
  product_count?: number;
  logo_on_dark?: boolean;
  logo_ratio?: number | null;
};

export function BrandForm({
  brand,
  action,
  title,
}: {
  brand: BrandFormValues;
  action: (prev: BrandFormState, formData: FormData) => Promise<BrandFormState>;
  title: string;
}) {
  const [state, formAction, pending] = useActionState<BrandFormState, FormData>(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-[var(--sp-4)]">
      <div className="flex items-baseline justify-between gap-[var(--sp-4)]">
        <div>
          <Link href="/admin/marci" className="text-200 text-[var(--ink-muted)] underline hover:text-[var(--ink-strong)]">
            ← Înapoi la listă
          </Link>
          <h1 className="mt-[var(--sp-1)] text-500 font-semibold text-[var(--ink-strong)]">{title}</h1>
          {brand.product_count != null ? (
            <p className="mt-[var(--sp-1)] text-200 text-[var(--ink-muted)]">{brand.product_count} produse legate</p>
          ) : null}
        </div>
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

      <Section title="Identitate">
        <Field label="Nume *" htmlFor="name">
          <input id="name" name="name" required defaultValue={brand.name} className={inputClass} />
        </Field>
        <Field label="Activă" htmlFor="is_active">
          <label className="flex h-10 items-center gap-[var(--sp-2)] text-300 text-[var(--ink)]">
            <input id="is_active" name="is_active" type="checkbox" defaultChecked={brand.is_active} className="size-4" />
            Vizibilă în catalog / filtre
          </label>
        </Field>
        <Field label="Slug RO *" htmlFor="slug_ro">
          <input id="slug_ro" name="slug_ro" required defaultValue={brand.slug_ro} className={inputClass} />
        </Field>
        <Field label="Slug RU" htmlFor="slug_ru">
          <input id="slug_ru" name="slug_ru" defaultValue={brand.slug_ru ?? ""} className={inputClass} />
        </Field>
      </Section>

      <Section title="Logo">
        <div className="sm:col-span-2">
          <Field label="URL logo" htmlFor="logo_url">
            <input
              id="logo_url"
              name="logo_url"
              defaultValue={brand.logo_url ?? ""}
              placeholder="https://… sau cale publică"
              className={inputClass}
            />
          </Field>
          {(brand.logo_on_dark != null || brand.logo_ratio != null) && (
            <p className="mt-[var(--sp-2)] text-200 text-[var(--ink-muted)]">
              logo_on_dark={String(brand.logo_on_dark ?? false)}
              {brand.logo_ratio != null ? ` · ratio=${brand.logo_ratio}` : ""} — setate de importul de logo-uri, nu aici.
            </p>
          )}
          {brand.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logo_url} alt="" className="mt-[var(--sp-3)] h-12 max-w-[200px] object-contain" />
          ) : null}
        </div>
      </Section>

      <Section title="Descriere">
        <div className="sm:col-span-2">
          <Field label="Descriere RO" htmlFor="description_ro">
            <textarea id="description_ro" name="description_ro" defaultValue={brand.description_ro ?? ""} className={areaClass} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Descriere RU" htmlFor="description_ru">
            <textarea id="description_ru" name="description_ru" defaultValue={brand.description_ru ?? ""} className={areaClass} />
          </Field>
        </div>
      </Section>

      <Section title="SEO">
        <Field label="Meta title RO" htmlFor="meta_title_ro">
          <input id="meta_title_ro" name="meta_title_ro" defaultValue={brand.meta_title_ro ?? ""} className={inputClass} />
        </Field>
        <Field label="Meta title RU" htmlFor="meta_title_ru">
          <input id="meta_title_ru" name="meta_title_ru" defaultValue={brand.meta_title_ru ?? ""} className={inputClass} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Meta description RO" htmlFor="meta_desc_ro">
            <textarea id="meta_desc_ro" name="meta_desc_ro" defaultValue={brand.meta_desc_ro ?? ""} className={areaClass} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Meta description RU" htmlFor="meta_desc_ru">
            <textarea id="meta_desc_ru" name="meta_desc_ru" defaultValue={brand.meta_desc_ru ?? ""} className={areaClass} />
          </Field>
        </div>
      </Section>
    </form>
  );
}
