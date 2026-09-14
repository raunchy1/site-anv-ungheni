import type { Metadata } from "next";
import Link from "next/link";
import { adminDb } from "@/lib/supabase/server";
import { formatCount } from "@/lib/format";

export const metadata: Metadata = { title: "Mărci" };

const PAGE_SIZE = 40;

type SearchParams = { q?: string; stare?: string; pagina?: string };

type BrandRow = {
  id: number;
  name: string;
  slug_ro: string;
  slug_ru: string | null;
  logo_url: string | null;
  product_count: number;
  is_active: boolean;
};

function safeTerm(v: string): string {
  return v.replace(/[%,]/g, "").trim();
}

function pageHref(sp: SearchParams, page: number): string {
  const params = new URLSearchParams();
  if (sp.q) params.set("q", sp.q);
  if (sp.stare) params.set("stare", sp.stare);
  if (page > 1) params.set("pagina", String(page));
  const qs = params.toString();
  return qs ? `/admin/marci?${qs}` : "/admin/marci";
}

export default async function MarciPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.pagina) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = adminDb()
    .from("brands")
    .select("id, name, slug_ro, slug_ru, logo_url, product_count, is_active", { count: "exact" })
    .order("name", { ascending: true })
    .range(from, to);

  const q = sp.q ? safeTerm(sp.q) : "";
  if (q) query = query.or(`name.ilike.%${q}%,slug_ro.ilike.%${q}%,slug_ru.ilike.%${q}%`);
  if (sp.stare === "active") query = query.eq("is_active", true);
  if (sp.stare === "inactive") query = query.eq("is_active", false);

  const { data, count, error } = await query;
  const brands = (data ?? []) as BrandRow[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-[var(--sp-4)]">
        <h1 className="text-500 font-semibold text-[var(--ink-strong)]">Mărci</h1>
        <div className="flex items-center gap-[var(--sp-3)]">
          <p className="text-200 text-[var(--ink-muted)]">{formatCount(count ?? 0)} mărci</p>
          <Link
            href="/admin/marci/nou"
            className="h-9 rounded-[var(--radius-xs)] bg-[var(--accent)] px-[var(--sp-4)] text-200 font-semibold leading-9 text-[var(--on-accent)] hover:bg-[var(--accent-hover)]"
          >
            Marcă nouă
          </Link>
        </div>
      </div>

      <form
        method="get"
        className="mt-[var(--sp-4)] flex flex-wrap items-end gap-[var(--sp-3)] rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--surface)] p-[var(--sp-4)]"
      >
        <div className="flex flex-col gap-[var(--sp-1)]">
          <label htmlFor="q" className="text-100 font-medium uppercase tracking-wide text-[var(--ink-muted)]">
            Căutare
          </label>
          <input
            id="q"
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="nume, slug…"
            className="h-10 w-64 rounded-[var(--radius-sm)] border border-[var(--field-line)] bg-[var(--field-bg)] px-[var(--sp-3)] text-300 outline-none focus:border-[var(--accent)]"
          />
        </div>
        <div className="flex flex-col gap-[var(--sp-1)]">
          <label htmlFor="stare" className="text-100 font-medium uppercase tracking-wide text-[var(--ink-muted)]">
            Stare
          </label>
          <select
            id="stare"
            name="stare"
            defaultValue={sp.stare ?? ""}
            className="h-10 w-44 rounded-[var(--radius-sm)] border border-[var(--field-line)] bg-[var(--field-bg)] px-[var(--sp-2)] text-300 outline-none focus:border-[var(--accent)]"
          >
            <option value="">Toate</option>
            <option value="active">Active</option>
            <option value="inactive">Dezactivate</option>
          </select>
        </div>
        <button
          type="submit"
          className="h-10 rounded-[var(--radius-xs)] bg-[var(--accent)] px-[var(--sp-5)] text-300 font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)]"
        >
          Filtrează
        </button>
        {q || sp.stare ? (
          <Link href="/admin/marci" className="h-10 px-[var(--sp-2)] text-300 text-[var(--ink-muted)] underline">
            Resetează
          </Link>
        ) : null}
      </form>

      {error ? (
        <p className="mt-[var(--sp-4)] text-300 text-[var(--warn)]">Eroare la citirea mărcilor: {error.message}</p>
      ) : (
        <div className="mt-[var(--sp-4)] overflow-x-auto rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--surface)]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[var(--line-strong)] bg-[var(--bg-sunken)] text-left">
                {["Logo", "Nume", "Slug RO", "Produse", "Stare", ""].map((h) => (
                  <th
                    key={h || "act"}
                    className="whitespace-nowrap px-[var(--sp-3)] py-[var(--sp-2)] text-100 font-semibold uppercase tracking-wide text-[var(--ink-muted)]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {brands.map((b) => (
                <tr key={b.id} className="border-b border-[var(--line)] last:border-b-0">
                  <td className="px-[var(--sp-3)] py-[var(--sp-2)]">
                    {b.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.logo_url} alt="" className="h-8 w-16 object-contain" />
                    ) : (
                      <span className="text-200 text-[var(--ink-muted)]">—</span>
                    )}
                  </td>
                  <td className="max-w-[220px] truncate px-[var(--sp-3)] py-[var(--sp-2)] text-300 font-medium text-[var(--ink-strong)]">
                    {b.name}
                  </td>
                  <td className="max-w-[200px] truncate px-[var(--sp-3)] py-[var(--sp-2)] text-200 text-[var(--ink-muted)]">
                    {b.slug_ro}
                  </td>
                  <td className="whitespace-nowrap px-[var(--sp-3)] py-[var(--sp-2)] text-300 text-[var(--ink)]">
                    {formatCount(b.product_count)}
                  </td>
                  <td className="px-[var(--sp-3)] py-[var(--sp-2)]">
                    <span
                      className={`rounded-[var(--radius-xs)] border px-[var(--sp-2)] py-[2px] text-100 font-medium uppercase tracking-wide ${
                        b.is_active
                          ? "border-[var(--ok)] text-[var(--ok)]"
                          : "border-[var(--line-strong)] text-[var(--ink-muted)]"
                      }`}
                    >
                      {b.is_active ? "Activă" : "Dezactivată"}
                    </span>
                  </td>
                  <td className="px-[var(--sp-3)] py-[var(--sp-2)] text-200">
                    <Link href={`/admin/marci/${b.id}`} className="text-[var(--accent)] underline">
                      Editează
                    </Link>
                  </td>
                </tr>
              ))}
              {!brands.length ? (
                <tr>
                  <td colSpan={6} className="px-[var(--sp-4)] py-[var(--sp-6)] text-center text-300 text-[var(--ink-muted)]">
                    Nicio marcă nu corespunde filtrelor.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-[var(--sp-4)] flex items-center justify-between">
        <p className="text-200 text-[var(--ink-muted)]">
          Pagina {page} din {totalPages}
        </p>
        <div className="flex items-center gap-[var(--sp-2)]">
          {page > 1 ? (
            <Link
              href={pageHref(sp, page - 1)}
              className="h-9 rounded-[var(--radius-xs)] border border-[var(--line-strong)] px-[var(--sp-3)] text-200 font-medium leading-9 text-[var(--ink-strong)] hover:bg-[var(--surface-2)]"
            >
              ← Anterior
            </Link>
          ) : null}
          {page < totalPages ? (
            <Link
              href={pageHref(sp, page + 1)}
              className="h-9 rounded-[var(--radius-xs)] border border-[var(--line-strong)] px-[var(--sp-3)] text-200 font-medium leading-9 text-[var(--ink-strong)] hover:bg-[var(--surface-2)]"
            >
              Următor →
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
