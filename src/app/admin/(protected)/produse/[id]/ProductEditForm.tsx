"use client";

import { useState, useTransition, useActionState } from "react";
import Link from "next/link";
import type { Season } from "@/lib/types";
import { updateProduct, previewSlug, type ProductFormState } from "./actions";
import type { ProductDetail } from "./page";

const SEASON_OPTIONS: { value: Season; label: string }[] = [
  { value: "vara", label: "Vară" },
  { value: "iarna", label: "Iarnă" },
  { value: "all_season", label: "All Season" },
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

export function ProductEditForm({
  product,
  brands,
}: {
  product: ProductDetail;
  brands: { id: number; name: string }[];
}) {
  const boundAction = updateProduct.bind(null, product.id);
  const [state, formAction, pending] = useActionState<ProductFormState, FormData>(boundAction, null);

  const [titleRo, setTitleRo] = useState(product.title_ro);
  const [titleRu, setTitleRu] = useState(product.title_ru ?? "");
  const [slugRo, setSlugRo] = useState(product.slug_ro);
  const [slugRu, setSlugRu] = useState(product.slug_ru ?? "");
  const [slugRegenerating, startSlugRegenerate] = useTransition();

  const slugChanged = slugRo !== product.slug_ro || slugRu !== (product.slug_ru ?? "");

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
          <h1 className="mt-[var(--sp-1)] text-500 font-semibold text-[var(--ink-strong)]">{product.title_ro}</h1>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="h-11 shrink-0 rounded-[var(--radius-xs)] bg-[var(--accent)] px-[var(--sp-5)] text-300 font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Se salvează…" : "Salvează"}
        </button>
      </div>

      {state ? (
        <p
          role="alert"
          className={`text-300 ${state.ok ? "text-[var(--ok)]" : "text-[var(--warn)]"}`}
        >
          {state.ok ? state.message : state.error}
        </p>
      ) : null}

      <Section title="Slug">
        <div className="sm:col-span-2 rounded-[var(--radius-sm)] border border-[var(--warn)] bg-[var(--surface-2)] p-[var(--sp-3)] text-200 text-[var(--ink-strong)]">
          Schimbarea slug-ului schimbă adresa produsului. Adresa veche nu mai există — orice link deja
          indexat de Google sau distribuit clienților duce la o pagină inexistentă. Modifică doar dacă
          știi ce faci.
        </div>
        <Field label="Slug RO" htmlFor="slug_ro">
          <input id="slug_ro" name="slug_ro" value={slugRo} onChange={(e) => setSlugRo(e.target.value)} required className={inputClass} />
        </Field>
        <Field label="Slug RU" htmlFor="slug_ru">
          <input id="slug_ru" name="slug_ru" value={slugRu} onChange={(e) => setSlugRu(e.target.value)} className={inputClass} />
        </Field>
        <div className="sm:col-span-2 flex items-center gap-[var(--sp-3)]">
          <button
            type="button"
            onClick={regenerateSlug}
            disabled={slugRegenerating}
            className="h-9 rounded-[var(--radius-xs)] border border-[var(--line-strong)] px-[var(--sp-3)] text-200 font-medium text-[var(--ink-strong)] hover:bg-[var(--surface-2)] disabled:opacity-50"
          >
            {slugRegenerating ? "Se calculează…" : "Regenerează din titluri"}
          </button>
          {slugChanged ? (
            <span className="text-200 font-medium text-[var(--warn)]">Slug schimbat față de cel salvat.</span>
          ) : null}
        </div>
      </Section>

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

      <Section title="Descrieri">
        <Field label="Descriere RO" htmlFor="description_ro">
          <textarea
            id="description_ro"
            name="description_ro"
            defaultValue={product.description_ro ?? ""}
            rows={5}
            className={`${inputClass} h-auto py-[var(--sp-2)]`}
          />
        </Field>
        <Field label="Descriere RU" htmlFor="description_ru">
          <textarea
            id="description_ru"
            name="description_ru"
            defaultValue={product.description_ru ?? ""}
            rows={5}
            className={`${inputClass} h-auto py-[var(--sp-2)]`}
          />
        </Field>
      </Section>

      <Section title="Meta (SEO)">
        <Field label="Meta title RO" htmlFor="meta_title_ro">
          <input id="meta_title_ro" name="meta_title_ro" defaultValue={product.meta_title_ro ?? ""} className={inputClass} />
        </Field>
        <Field label="Meta title RU" htmlFor="meta_title_ru">
          <input id="meta_title_ru" name="meta_title_ru" defaultValue={product.meta_title_ru ?? ""} className={inputClass} />
        </Field>
        <Field label="Meta description RO" htmlFor="meta_desc_ro">
          <textarea
            id="meta_desc_ro"
            name="meta_desc_ro"
            defaultValue={product.meta_desc_ro ?? ""}
            rows={3}
            className={`${inputClass} h-auto py-[var(--sp-2)]`}
          />
        </Field>
        <Field label="Meta description RU" htmlFor="meta_desc_ru">
          <textarea
            id="meta_desc_ru"
            name="meta_desc_ru"
            defaultValue={product.meta_desc_ru ?? ""}
            rows={3}
            className={`${inputClass} h-auto py-[var(--sp-2)]`}
          />
        </Field>
      </Section>

      <Section title="Măsură și indici">
        <Field label="Lățime (width)" htmlFor="width">
          <input id="width" name="width" type="number" defaultValue={product.width ?? ""} className={inputClass} />
        </Field>
        <Field label="Profil (aspect)" htmlFor="aspect">
          <input id="aspect" name="aspect" type="number" defaultValue={product.aspect ?? ""} className={inputClass} />
        </Field>
        <Field label="Diametru" htmlFor="diameter">
          <input id="diameter" name="diameter" placeholder="R16" defaultValue={product.diameter ?? ""} className={inputClass} />
        </Field>
        <Field label="Măsură completă (size_raw)" htmlFor="size_raw">
          <input id="size_raw" name="size_raw" placeholder="205/55 R16" defaultValue={product.size_raw ?? ""} className={inputClass} />
        </Field>
        <Field label="Indice sarcină (load_index)" htmlFor="load_index">
          <input id="load_index" name="load_index" defaultValue={product.load_index ?? ""} className={inputClass} />
        </Field>
        <Field label="Indice viteză (speed_index)" htmlFor="speed_index">
          <input id="speed_index" name="speed_index" defaultValue={product.speed_index ?? ""} className={inputClass} />
        </Field>
        <Field label="Sezon" htmlFor="season">
          <select id="season" name="season" defaultValue={product.season ?? ""} className={inputClass}>
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
            <input type="checkbox" name="is_xl" defaultChecked={product.is_xl} className="h-4 w-4" />
            XL
          </label>
          <label className="flex h-10 items-center gap-[var(--sp-2)] text-300 text-[var(--ink-strong)]">
            <input type="checkbox" name="is_runflat" defaultChecked={product.is_runflat} className="h-4 w-4" />
            Runflat
          </label>
        </div>
      </Section>

      <Section title="Marcă și model">
        <Field label="Marcă" htmlFor="brand_id">
          <select id="brand_id" name="brand_id" defaultValue={product.brand_id != null ? String(product.brand_id) : ""} className={inputClass}>
            <option value="">— fără marcă —</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Model" htmlFor="model">
          <input id="model" name="model" defaultValue={product.model ?? ""} className={inputClass} />
        </Field>
      </Section>

      <Section title="Stare">
        <label className="flex h-10 items-center gap-[var(--sp-2)] text-300 text-[var(--ink-strong)]">
          <input type="checkbox" name="is_active" defaultChecked={product.is_active} className="h-4 w-4" />
          Activ (vizibil pe site)
        </label>
      </Section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="h-11 rounded-[var(--radius-xs)] bg-[var(--accent)] px-[var(--sp-6)] text-300 font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Se salvează…" : "Salvează"}
        </button>
      </div>
    </form>
  );
}
