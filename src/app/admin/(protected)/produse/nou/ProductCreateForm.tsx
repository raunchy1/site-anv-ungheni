"use client";

import { useState, useTransition, useActionState } from "react";
import Link from "next/link";
import type { Season, StockStatus } from "@/lib/types";
import { createProduct, previewSlug, type CreateProductState } from "./actions";

const SEASON_OPTIONS: { value: Season; label: string }[] = [
  { value: "vara", label: "Vară" },
  { value: "iarna", label: "Iarnă" },
  { value: "all_season", label: "All Season" },
];

const STOCK_OPTIONS: { value: StockStatus; label: string }[] = [
  { value: "out_of_stock", label: "Indisponibil" },
  { value: "supplier", label: "La furnizor" },
  { value: "in_stock", label: "În stoc · atelier" },
];

const inputClass =
  "h-10 rounded-[var(--radius-sm)] border border-[var(--field-line)] bg-[var(--field-bg)] px-[var(--sp-3)] text-300 text-[var(--ink-strong)] outline-none focus:border-[var(--accent)]";
const labelClass = "text-100 font-medium uppercase tracking-wide text-[var(--ink-muted)]";

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
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

export function ProductCreateForm({ brands }: { brands: { id: number; name: string }[] }) {
  const [state, formAction, pending] = useActionState<CreateProductState, FormData>(createProduct, null);

  const [titleRo, setTitleRo] = useState("");
  const [titleRu, setTitleRu] = useState("");
  const [slugRo, setSlugRo] = useState("");
  const [slugRu, setSlugRu] = useState("");
  const [slugRegenerating, startSlugRegenerate] = useTransition();

  function regenerateSlug() {
    startSlugRegenerate(async () => {
      const { slug_ro, slug_ru } = await previewSlug(titleRo, titleRu || titleRo);
      setSlugRo(slug_ro);
      setSlugRu(slug_ru);
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-[var(--sp-4)]">
      <div className="flex items-baseline justify-between gap-[var(--sp-4)]">
        <div>
          <Link href="/admin/produse" className="text-200 text-[var(--ink-muted)] underline hover:text-[var(--ink-strong)]">
            ← Înapoi la listă
          </Link>
          <h1 className="mt-[var(--sp-1)] text-500 font-semibold text-[var(--ink-strong)]">Produs nou</h1>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="h-11 shrink-0 rounded-[var(--radius-xs)] bg-[var(--accent)] px-[var(--sp-5)] text-300 font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Se creează…" : "Creează produs"}
        </button>
      </div>

      {state && !state.ok ? (
        <p role="alert" className="text-300 text-[var(--warn)]">
          {state.error}
        </p>
      ) : null}

      <Section title="Titluri">
        <Field label="Titlu RO" htmlFor="title_ro">
          <input
            id="title_ro"
            name="title_ro"
            value={titleRo}
            onChange={(e) => setTitleRo(e.target.value)}
            required
            className={inputClass}
          />
        </Field>
        <Field label="Titlu RU" htmlFor="title_ru">
          <input
            id="title_ru"
            name="title_ru"
            value={titleRu}
            onChange={(e) => setTitleRu(e.target.value)}
            className={inputClass}
          />
        </Field>
      </Section>

      <Section title="Slug">
        <div className="sm:col-span-2 rounded-[var(--radius-sm)] border border-[var(--line-strong)] bg-[var(--surface-2)] p-[var(--sp-3)] text-200 text-[var(--ink-strong)]">
          Dacă lași slug-urile goale, se generează automat din titluri la salvare (aceeași regulă ca la
          sincronizare: RO cu cratime, RU cu lățimea lipită).
        </div>
        <Field label="Slug RO" htmlFor="slug_ro">
          <input id="slug_ro" name="slug_ro" value={slugRo} onChange={(e) => setSlugRo(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Slug RU" htmlFor="slug_ru">
          <input id="slug_ru" name="slug_ru" value={slugRu} onChange={(e) => setSlugRu(e.target.value)} className={inputClass} />
        </Field>
        <div className="sm:col-span-2 flex items-center gap-[var(--sp-3)]">
          <button
            type="button"
            onClick={regenerateSlug}
            disabled={slugRegenerating || !titleRo.trim()}
            className="h-9 rounded-[var(--radius-xs)] border border-[var(--line-strong)] px-[var(--sp-3)] text-200 font-medium text-[var(--ink-strong)] hover:bg-[var(--surface-2)] disabled:opacity-50"
          >
            {slugRegenerating ? "Se calculează…" : "Generează din titluri"}
          </button>
        </div>
      </Section>

      <Section title="Descrieri">
        <Field label="Descriere RO" htmlFor="description_ro">
          <textarea
            id="description_ro"
            name="description_ro"
            rows={5}
            className={`${inputClass} h-auto py-[var(--sp-2)]`}
          />
        </Field>
        <Field label="Descriere RU" htmlFor="description_ru">
          <textarea
            id="description_ru"
            name="description_ru"
            rows={5}
            className={`${inputClass} h-auto py-[var(--sp-2)]`}
          />
        </Field>
      </Section>

      <Section title="Meta (SEO)">
        <Field label="Meta title RO" htmlFor="meta_title_ro">
          <input id="meta_title_ro" name="meta_title_ro" className={inputClass} />
        </Field>
        <Field label="Meta title RU" htmlFor="meta_title_ru">
          <input id="meta_title_ru" name="meta_title_ru" className={inputClass} />
        </Field>
        <Field label="Meta description RO" htmlFor="meta_desc_ro">
          <textarea
            id="meta_desc_ro"
            name="meta_desc_ro"
            rows={3}
            className={`${inputClass} h-auto py-[var(--sp-2)]`}
          />
        </Field>
        <Field label="Meta description RU" htmlFor="meta_desc_ru">
          <textarea
            id="meta_desc_ru"
            name="meta_desc_ru"
            rows={3}
            className={`${inputClass} h-auto py-[var(--sp-2)]`}
          />
        </Field>
      </Section>

      <Section title="Măsură și indici">
        <Field label="Lățime (width)" htmlFor="width">
          <input id="width" name="width" type="number" className={inputClass} />
        </Field>
        <Field label="Profil (aspect)" htmlFor="aspect">
          <input id="aspect" name="aspect" type="number" className={inputClass} />
        </Field>
        <Field label="Diametru" htmlFor="diameter">
          <input id="diameter" name="diameter" placeholder="R16" className={inputClass} />
        </Field>
        <Field label="Măsură completă (size_raw)" htmlFor="size_raw">
          <input id="size_raw" name="size_raw" placeholder="205/55 R16" className={inputClass} />
        </Field>
        <Field label="Indice sarcină (load_index)" htmlFor="load_index">
          <input id="load_index" name="load_index" className={inputClass} />
        </Field>
        <Field label="Indice viteză (speed_index)" htmlFor="speed_index">
          <input id="speed_index" name="speed_index" className={inputClass} />
        </Field>
        <Field label="Sezon" htmlFor="season">
          <select id="season" name="season" defaultValue="" className={inputClass}>
            <option value="">—</option>
            {SEASON_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <div className="flex items-center gap-[var(--sp-5)]">
          <label className="flex h-10 items-center gap-[var(--sp-2)] text-300 text-[var(--ink-strong)]">
            <input type="checkbox" name="is_xl" className="h-4 w-4" />
            XL
          </label>
          <label className="flex h-10 items-center gap-[var(--sp-2)] text-300 text-[var(--ink-strong)]">
            <input type="checkbox" name="is_runflat" className="h-4 w-4" />
            Runflat
          </label>
        </div>
      </Section>

      <Section title="Marcă și model">
        <Field label="Marcă" htmlFor="brand_id">
          <select id="brand_id" name="brand_id" defaultValue="" className={inputClass}>
            <option value="">— fără marcă —</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Model" htmlFor="model">
          <input id="model" name="model" className={inputClass} />
        </Field>
      </Section>

      <Section title="Preț și stoc">
        <Field label="Preț (MDL)" htmlFor="price_mdl">
          <input id="price_mdl" name="price_mdl" type="number" step="0.01" min="0" className={inputClass} />
        </Field>
        <Field label="Stare stoc" htmlFor="stock_status">
          <select id="stock_status" name="stock_status" defaultValue="out_of_stock" className={inputClass}>
            {STOCK_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <div className="sm:col-span-2 text-200 text-[var(--ink-muted)]">
          Produsele create din panou primesc întotdeauna preț fixat manual (
          <code className="text-100">price_locked</code>
          ) — sincronizarea de noapte nu le rescrie prețul.
        </div>
      </Section>

      <Section title="Stare">
        <label className="flex h-10 items-center gap-[var(--sp-2)] text-300 text-[var(--ink-strong)]">
          <input type="checkbox" name="is_active" className="h-4 w-4" />
          Activ (vizibil pe site) — cere măsură completă
        </label>
      </Section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="h-11 rounded-[var(--radius-xs)] bg-[var(--accent)] px-[var(--sp-6)] text-300 font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Se creează…" : "Creează produs"}
        </button>
      </div>
    </form>
  );
}
