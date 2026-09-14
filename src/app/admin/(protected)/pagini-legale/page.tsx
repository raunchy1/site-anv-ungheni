import type { Metadata } from "next";
import Link from "next/link";
import { adminDb } from "@/lib/supabase/server";
import { formatCount } from "@/lib/format";

export const metadata: Metadata = { title: "Pagini legale" };

type LegalRow = {
  id: number;
  title_ro: string;
  slug_ro: string;
  sort_order: number;
  updated_at: string;
  body_ro: string | null;
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ro-MD", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function PaginiLegalePage() {
  const { data, error, count } = await adminDb()
    .from("legal_pages")
    .select("id, title_ro, slug_ro, sort_order, updated_at, body_ro", { count: "exact" })
    .order("sort_order", { ascending: true });

  const pages = (data ?? []) as LegalRow[];

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-[var(--sp-4)]">
        <h1 className="text-500 font-semibold text-[var(--ink-strong)]">Pagini legale</h1>
        <p className="text-200 text-[var(--ink-muted)]">{formatCount(count ?? 0)} pagini</p>
      </div>

      {error ? (
        <p className="mt-[var(--sp-4)] text-300 text-[var(--warn)]">Eroare: {error.message}</p>
      ) : (
        <div className="mt-[var(--sp-4)] overflow-x-auto rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--surface)]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[var(--line-strong)] bg-[var(--bg-sunken)] text-left">
                {["Ordine", "Titlu RO", "Slug", "Conținut", "Actualizat", ""].map((h) => (
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
              {pages.map((p) => (
                <tr key={p.id} className="border-b border-[var(--line)] last:border-b-0">
                  <td className="px-[var(--sp-3)] py-[var(--sp-2)] text-300 text-[var(--ink-muted)]">{p.sort_order}</td>
                  <td className="max-w-[280px] truncate px-[var(--sp-3)] py-[var(--sp-2)] text-300 font-medium text-[var(--ink-strong)]">
                    {p.title_ro}
                  </td>
                  <td className="max-w-[220px] truncate px-[var(--sp-3)] py-[var(--sp-2)] text-200 text-[var(--ink-muted)]">
                    {p.slug_ro}
                  </td>
                  <td className="px-[var(--sp-3)] py-[var(--sp-2)] text-200">
                    {p.body_ro ? (
                      <span className="text-[var(--ok)]">Completat</span>
                    ) : (
                      <span className="text-[var(--ink-muted)]">Gol</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-[var(--sp-3)] py-[var(--sp-2)] text-200 text-[var(--ink-muted)]">
                    {formatDateTime(p.updated_at)}
                  </td>
                  <td className="px-[var(--sp-3)] py-[var(--sp-2)] text-200">
                    <Link href={`/admin/pagini-legale/${p.id}`} className="text-[var(--accent)] underline">
                      Editează
                    </Link>
                  </td>
                </tr>
              ))}
              {!pages.length ? (
                <tr>
                  <td colSpan={6} className="px-[var(--sp-4)] py-[var(--sp-6)] text-center text-300 text-[var(--ink-muted)]">
                    Nicio pagină legală.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
