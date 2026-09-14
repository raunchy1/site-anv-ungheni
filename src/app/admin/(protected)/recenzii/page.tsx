import type { Metadata } from "next";
import Link from "next/link";
import { adminDb } from "@/lib/supabase/server";
import { formatCount } from "@/lib/format";
import { ReviewActions } from "./ReviewActions";

export const metadata: Metadata = { title: "Recenzii" };

const PAGE_SIZE = 30;

type SearchParams = {
  q?: string;
  stare?: string;
  pagina?: string;
};

type ReviewRow = {
  id: number;
  product_id: number | null;
  service_id: number | null;
  author: string;
  rating: number;
  body: string;
  pros: string | null;
  cons: string | null;
  is_approved: boolean;
  created_at: string;
  products: { title_ro: string } | null;
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
  return qs ? `/admin/recenzii?${qs}` : "/admin/recenzii";
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

function stars(rating: number): string {
  return "★".repeat(rating) + "☆".repeat(Math.max(0, 5 - rating));
}

export default async function RecenziiPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.pagina) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const db = adminDb();

  let query = db
    .from("reviews")
    .select(
      `id, product_id, service_id, author, rating, body, pros, cons, is_approved, created_at,
       products ( title_ro ), services ( title_ro )`,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  const q = sp.q ? safeTerm(sp.q) : "";
  if (q) query = query.or(`author.ilike.%${q}%,body.ilike.%${q}%`);
  if (sp.stare === "aprobate") query = query.eq("is_approved", true);
  if (sp.stare === "asteptare") query = query.eq("is_approved", false);

  const { data, count, error } = await query;
  const reviews = (data ?? []) as unknown as ReviewRow[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-[var(--sp-4)]">
        <h1 className="text-500 font-semibold text-[var(--ink-strong)]">Recenzii</h1>
        <p className="text-200 text-[var(--ink-muted)]">{formatCount(count ?? 0)} recenzii</p>
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
            placeholder="autor, text…"
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
            <option value="asteptare">În așteptare</option>
            <option value="aprobate">Aprobate</option>
          </select>
        </div>

        <button
          type="submit"
          className="h-10 rounded-[var(--radius-xs)] bg-[var(--accent)] px-[var(--sp-5)] text-300 font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)]"
        >
          Filtrează
        </button>
        {q || sp.stare ? (
          <Link href="/admin/recenzii" className="h-10 px-[var(--sp-2)] text-300 text-[var(--ink-muted)] underline">
            Resetează
          </Link>
        ) : null}
      </form>

      {error ? (
        <p className="mt-[var(--sp-4)] text-300 text-[var(--warn)]">Eroare la citirea recenziilor: {error.message}</p>
      ) : (
        <div className="mt-[var(--sp-4)] flex flex-col gap-[var(--sp-3)]">
          {reviews.map((r) => {
            const target =
              r.products?.title_ro ??
              r.services?.title_ro ??
              (r.product_id ? `Produs #${r.product_id}` : r.service_id ? `Serviciu #${r.service_id}` : "—");
            return (
              <article
                key={r.id}
                className="rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--surface)] p-[var(--sp-4)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-[var(--sp-4)]">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-[var(--sp-3)] gap-y-[var(--sp-1)]">
                      <h2 className="text-300 font-semibold text-[var(--ink-strong)]">{r.author}</h2>
                      <span className="text-200 text-[var(--accent)]" aria-label={`${r.rating} din 5`}>
                        {stars(r.rating)}
                      </span>
                      <span className="text-200 text-[var(--ink-muted)]">{formatDateTime(r.created_at)}</span>
                    </div>
                    <p className="mt-[var(--sp-1)] text-200 text-[var(--ink-muted)]">
                      Despre:{" "}
                      {r.product_id ? (
                        <Link
                          href={`/admin/produse/${r.product_id}`}
                          className="text-[var(--ink)] underline-offset-2 hover:text-[var(--accent)] hover:underline"
                        >
                          {target}
                        </Link>
                      ) : (
                        <span className="text-[var(--ink)]">{target}</span>
                      )}
                    </p>
                    <p className="mt-[var(--sp-3)] whitespace-pre-wrap text-300 text-[var(--ink)]">{r.body}</p>
                    {(r.pros || r.cons) && (
                      <div className="mt-[var(--sp-2)] grid gap-[var(--sp-2)] text-200 sm:grid-cols-2">
                        {r.pros ? (
                          <p>
                            <span className="font-medium text-[var(--ok)]">Plusuri:</span> {r.pros}
                          </p>
                        ) : null}
                        {r.cons ? (
                          <p>
                            <span className="font-medium text-[var(--warn)]">Minusuri:</span> {r.cons}
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>
                  <ReviewActions id={r.id} isApproved={r.is_approved} />
                </div>
              </article>
            );
          })}
          {!reviews.length ? (
            <p className="rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--surface)] px-[var(--sp-4)] py-[var(--sp-6)] text-center text-300 text-[var(--ink-muted)]">
              Nicio recenzie nu corespunde filtrelor.
            </p>
          ) : null}
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
