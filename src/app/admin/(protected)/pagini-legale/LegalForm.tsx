"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { LegalFormState } from "./actions";

const inputClass =
  "h-10 rounded-[var(--radius-sm)] border border-[var(--field-line)] bg-[var(--field-bg)] px-[var(--sp-3)] text-300 text-[var(--ink-strong)] outline-none focus:border-[var(--accent)]";
const labelClass = "text-100 font-medium uppercase tracking-wide text-[var(--ink-muted)]";
const areaClass =
  "min-h-[220px] rounded-[var(--radius-sm)] border border-[var(--field-line)] bg-[var(--field-bg)] px-[var(--sp-3)] py-[var(--sp-2)] font-mono text-200 text-[var(--ink-strong)] outline-none focus:border-[var(--accent)]";

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

export type LegalFormValues = {
  title_ro: string;
  title_ru: string | null;
  slug_ro: string;
  slug_ru: string | null;
  body_ro: string | null;
  body_ru: string | null;
  meta_desc_ro: string | null;
  meta_desc_ru: string | null;
  sort_order: number;
};

export function LegalForm({
  page,
  action,
  title,
}: {
  page: LegalFormValues;
  action: (prev: LegalFormState, formData: FormData) => Promise<LegalFormState>;
  title: string;
}) {
  const [state, formAction, pending] = useActionState<LegalFormState, FormData>(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-[var(--sp-4)]">
      <div className="flex items-baseline justify-between gap-[var(--sp-4)]">
        <div>
          <Link
            href="/admin/pagini-legale"
            className="text-200 text-[var(--ink-muted)] underline hover:text-[var(--ink-strong)]"
          >
            ← Înapoi la listă
          </Link>
          <h1 className="mt-[var(--sp-1)] text-500 font-semibold text-[var(--ink-strong)]">{title}</h1>
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
        <Field label="Titlu RO *" htmlFor="title_ro">
          <input id="title_ro" name="title_ro" required defaultValue={page.title_ro} className={inputClass} />
        </Field>
        <Field label="Titlu RU" htmlFor="title_ru">
          <input id="title_ru" name="title_ru" defaultValue={page.title_ru ?? ""} className={inputClass} />
        </Field>
        <Field label="Slug RO *" htmlFor="slug_ro">
          <input id="slug_ro" name="slug_ro" required defaultValue={page.slug_ro} className={inputClass} />
        </Field>
        <Field label="Slug RU" htmlFor="slug_ru">
          <input id="slug_ru" name="slug_ru" defaultValue={page.slug_ru ?? ""} className={inputClass} />
        </Field>
        <Field label="Ordine" htmlFor="sort_order">
          <input id="sort_order" name="sort_order" type="number" defaultValue={page.sort_order} className={inputClass} />
        </Field>
      </Section>

      <Section title="Conținut (HTML permis, ca în migrări)">
        <div className="sm:col-span-2">
          <Field label="Body RO" htmlFor="body_ro">
            <textarea id="body_ro" name="body_ro" defaultValue={page.body_ro ?? ""} className={areaClass} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Body RU" htmlFor="body_ru">
            <textarea id="body_ru" name="body_ru" defaultValue={page.body_ru ?? ""} className={areaClass} />
          </Field>
        </div>
      </Section>

      <Section title="SEO">
        <div className="sm:col-span-2">
          <Field label="Meta description RO" htmlFor="meta_desc_ro">
            <textarea
              id="meta_desc_ro"
              name="meta_desc_ro"
              defaultValue={page.meta_desc_ro ?? ""}
              className="min-h-[80px] rounded-[var(--radius-sm)] border border-[var(--field-line)] bg-[var(--field-bg)] px-[var(--sp-3)] py-[var(--sp-2)] text-300 outline-none focus:border-[var(--accent)]"
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Meta description RU" htmlFor="meta_desc_ru">
            <textarea
              id="meta_desc_ru"
              name="meta_desc_ru"
              defaultValue={page.meta_desc_ru ?? ""}
              className="min-h-[80px] rounded-[var(--radius-sm)] border border-[var(--field-line)] bg-[var(--field-bg)] px-[var(--sp-3)] py-[var(--sp-2)] text-300 outline-none focus:border-[var(--accent)]"
            />
          </Field>
        </div>
      </Section>
    </form>
  );
}
