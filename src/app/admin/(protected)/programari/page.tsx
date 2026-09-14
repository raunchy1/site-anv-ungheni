import type { Metadata } from "next";
import Link from "next/link";
import { adminDb } from "@/lib/supabase/server";
import { formatCount } from "@/lib/format";
import type { BookingStatus } from "./actions";
import { BookingStatusSelect } from "./StatusSelect";

export const metadata: Metadata = { title: "Programări" };

const PAGE_SIZE = 30;

const STATUS_LABEL: Record<BookingStatus, string> = {
  nou: "Nouă",
  confirmat: "Confirmată",
  finalizat: "Finalizată",
  anulat: "Anulată",
};

type SearchParams = {
  q?: string;
  stare?: string;
  pagina?: string;
};

type BookingRow = {
  id: number;
  service_id: number | null;
  name: string;
  phone: string;
  car_model: string | null;
  preferred_date: string | null;
  note: string | null;
  status: BookingStatus;
  created_at: string;
  services: { title_ro: string } | null;
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
  return qs ? `/admin/programari?${qs}` : "/admin/programari";
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ro-MD", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso + (iso.includes("T") ? "" : "T12:00:00")).toLocaleDateString("ro-MD", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function ProgramariPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.pagina) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const db = adminDb();

  let query = db
    .from("service_bookings")
    .select(
      "id, service_id, name, phone, car_model, preferred_date, note, status, created_at, services ( title_ro )",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  const q = sp.q ? safeTerm(sp.q) : "";
  if (q) query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%,car_model.ilike.%${q}%`);
  if (sp.stare) query = query.eq("status", sp.stare);

  const { data, count, error } = await query;
  const bookings = (data ?? []) as unknown as BookingRow[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-[var(--sp-4)]">
        <h1 className="text-500 font-semibold text-[var(--ink-strong)]">Programări</h1>
        <p className="text-200 text-[var(--ink-muted)]">{formatCount(count ?? 0)} programări</p>
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
            placeholder="nume, telefon, mașină…"
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
            {(Object.keys(STATUS_LABEL) as BookingStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="h-10 rounded-[var(--radius-xs)] bg-[var(--accent)] px-[var(--sp-5)] text-300 font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)]"
        >
          Filtrează
        </button>
        {q || sp.stare ? (
          <Link href="/admin/programari" className="h-10 px-[var(--sp-2)] text-300 text-[var(--ink-muted)] underline">
            Resetează
          </Link>
        ) : null}
      </form>

      {error ? (
        <p className="mt-[var(--sp-4)] text-300 text-[var(--warn)]">
          Eroare la citirea programărilor: {error.message}
        </p>
      ) : (
        <div className="mt-[var(--sp-4)] overflow-x-auto rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--surface)]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[var(--line-strong)] bg-[var(--bg-sunken)] text-left">
                {["Data cererii", "Client", "Telefon", "Serviciu", "Mașină", "Data dorită", "Stare", ""].map(
                  (h) => (
                    <th
                      key={h || "act"}
                      className="whitespace-nowrap px-[var(--sp-3)] py-[var(--sp-2)] text-100 font-semibold uppercase tracking-wide text-[var(--ink-muted)]"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b border-[var(--line)] last:border-b-0">
                  <td className="whitespace-nowrap px-[var(--sp-3)] py-[var(--sp-2)] text-200 text-[var(--ink-muted)]">
                    {formatDateTime(b.created_at)}
                  </td>
                  <td className="max-w-[180px] truncate px-[var(--sp-3)] py-[var(--sp-2)] text-300 text-[var(--ink-strong)]">
                    {b.name}
                  </td>
                  <td className="whitespace-nowrap px-[var(--sp-3)] py-[var(--sp-2)] text-300 text-[var(--ink)]">
                    {b.phone}
                  </td>
                  <td className="max-w-[200px] truncate px-[var(--sp-3)] py-[var(--sp-2)] text-300 text-[var(--ink)]">
                    {b.services?.title_ro ?? (b.service_id ? `#${b.service_id}` : "—")}
                  </td>
                  <td className="max-w-[140px] truncate px-[var(--sp-3)] py-[var(--sp-2)] text-300 text-[var(--ink)]">
                    {b.car_model ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-[var(--sp-3)] py-[var(--sp-2)] text-300 text-[var(--ink)]">
                    {formatDate(b.preferred_date)}
                  </td>
                  <td className="px-[var(--sp-3)] py-[var(--sp-2)]">
                    <BookingStatusSelect id={b.id} status={b.status} />
                  </td>
                  <td className="px-[var(--sp-3)] py-[var(--sp-2)] text-200">
                    <Link href={`/admin/programari/${b.id}`} className="text-[var(--accent)] underline">
                      Detaliu
                    </Link>
                  </td>
                </tr>
              ))}
              {!bookings.length ? (
                <tr>
                  <td colSpan={8} className="px-[var(--sp-4)] py-[var(--sp-6)] text-center text-300 text-[var(--ink-muted)]">
                    Nicio programare nu corespunde filtrelor.
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
              className="h-9 rounded-[var(--radius-xs)] border border-[var(--line-strong)] px-[var(--sp-3)] text-200 font-medium text-[var(--ink-strong)] hover:bg-[var(--surface-2)]"
            >
              ← Anterior
            </Link>
          ) : null}
          {page < totalPages ? (
            <Link
              href={pageHref(sp, page + 1)}
              className="h-9 rounded-[var(--radius-xs)] border border-[var(--line-strong)] px-[var(--sp-3)] text-200 font-medium text-[var(--ink-strong)] hover:bg-[var(--surface-2)]"
            >
              Următor →
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
