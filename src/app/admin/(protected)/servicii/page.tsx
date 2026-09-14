import type { Metadata } from "next";
import Link from "next/link";
import { adminDb } from "@/lib/supabase/server";
import { formatCount } from "@/lib/format";

export const metadata: Metadata = { title: "Servicii" };

type ServiceRow = {
  id: number;
  title_ro: string;
  slug_ro: string;
  price_from_mdl: number | null;
  sort_order: number;
  is_active: boolean;
};

export default async function ServiciiPage() {
  const { data, error, count } = await adminDb()
    .from("services")
    .select("id, title_ro, slug_ro, price_from_mdl, sort_order, is_active", { count: "exact" })
    .order("sort_order", { ascending: true });

  const services = (data ?? []) as ServiceRow[];

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-[var(--sp-4)]">
        <h1 className="text-500 font-semibold text-[var(--ink-strong)]">Servicii</h1>
        <div className="flex items-center gap-[var(--sp-3)]">
          <p className="text-200 text-[var(--ink-muted)]">{formatCount(count ?? 0)} servicii</p>
          <Link
            href="/admin/servicii/nou"
            className="h-9 rounded-[var(--radius-xs)] bg-[var(--accent)] px-[var(--sp-4)] text-200 font-semibold leading-9 text-[var(--on-accent)] hover:bg-[var(--accent-hover)]"
          >
            Serviciu nou
          </Link>
        </div>
      </div>

      {error ? (
        <p className="mt-[var(--sp-4)] text-300 text-[var(--warn)]">Eroare: {error.message}</p>
      ) : (
        <div className="mt-[var(--sp-4)] overflow-x-auto rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--surface)]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[var(--line-strong)] bg-[var(--bg-sunken)] text-left">
                {["Ordine", "Titlu RO", "Slug", "De la (MDL)", "Stare", ""].map((h) => (
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
              {services.map((s) => (
                <tr key={s.id} className="border-b border-[var(--line)] last:border-b-0">
                  <td className="px-[var(--sp-3)] py-[var(--sp-2)] text-300 text-[var(--ink-muted)]">{s.sort_order}</td>
                  <td className="max-w-[280px] truncate px-[var(--sp-3)] py-[var(--sp-2)] text-300 font-medium text-[var(--ink-strong)]">
                    {s.title_ro}
                  </td>
                  <td className="max-w-[200px] truncate px-[var(--sp-3)] py-[var(--sp-2)] text-200 text-[var(--ink-muted)]">
                    {s.slug_ro}
                  </td>
                  <td className="whitespace-nowrap px-[var(--sp-3)] py-[var(--sp-2)] text-300 text-[var(--ink)]">
                    {s.price_from_mdl != null ? `${s.price_from_mdl}` : "—"}
                  </td>
                  <td className="px-[var(--sp-3)] py-[var(--sp-2)]">
                    <span
                      className={`rounded-[var(--radius-xs)] border px-[var(--sp-2)] py-[2px] text-100 font-medium uppercase tracking-wide ${
                        s.is_active
                          ? "border-[var(--ok)] text-[var(--ok)]"
                          : "border-[var(--line-strong)] text-[var(--ink-muted)]"
                      }`}
                    >
                      {s.is_active ? "Activ" : "Dezactivat"}
                    </span>
                  </td>
                  <td className="px-[var(--sp-3)] py-[var(--sp-2)] text-200">
                    <Link href={`/admin/servicii/${s.id}`} className="text-[var(--accent)] underline">
                      Editează
                    </Link>
                  </td>
                </tr>
              ))}
              {!services.length ? (
                <tr>
                  <td colSpan={6} className="px-[var(--sp-4)] py-[var(--sp-6)] text-center text-300 text-[var(--ink-muted)]">
                    Niciun serviciu.
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
