import type { Metadata } from "next";
import Link from "next/link";
import { adminDb } from "@/lib/supabase/server";
import { formatCount } from "@/lib/format";
import { DryRunButtons, QuarantineActions } from "./SyncControls";

export const metadata: Metadata = { title: "Sincronizare" };

const RUNS_PAGE = 20;

type SearchParams = { pagina?: string; carantina?: string };

type ImportRun = {
  id: number;
  source: string;
  actor: string | null;
  dry_run: boolean;
  started_at: string;
  finished_at: string | null;
  rows_total: number;
  rows_created: number;
  rows_updated: number;
  rows_skipped: number;
  rows_deactivated: number;
  prices_changed: number;
  prices_locked: number;
  errors: unknown;
  notes: string | null;
};

type QuarantineRow = {
  id: number;
  pandashop_id: string;
  reason: string;
  raw: unknown;
  created_at: string;
  resolved_at: string | null;
  resolution: string | null;
};

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ro-MD", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function errorsSummary(errors: unknown): string {
  if (!errors) return "—";
  if (Array.isArray(errors)) {
    if (!errors.length) return "0";
    return String(errors.length);
  }
  return "—";
}

function pageHref(sp: SearchParams, page: number): string {
  const params = new URLSearchParams();
  if (sp.carantina) params.set("carantina", sp.carantina);
  if (page > 1) params.set("pagina", String(page));
  const qs = params.toString();
  return qs ? `/admin/sincronizare?${qs}` : "/admin/sincronizare";
}

export default async function SincronizarePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.pagina) || 1);
  const from = (page - 1) * RUNS_PAGE;
  const to = from + RUNS_PAGE - 1;
  const showResolved = sp.carantina === "toate";

  const db = adminDb();

  const settingsRes = await db.from("settings").select("sync_enabled").eq("id", true).single();
  const syncEnabled = Boolean(settingsRes.data?.sync_enabled);

  const runsQuery = db
    .from("import_runs")
    .select(
      "id, source, actor, dry_run, started_at, finished_at, rows_total, rows_created, rows_updated, rows_skipped, rows_deactivated, prices_changed, prices_locked, errors, notes",
      { count: "exact" },
    )
    .order("started_at", { ascending: false })
    .range(from, to);

  let quarantineQuery = db
    .from("sync_quarantine")
    .select("id, pandashop_id, reason, raw, created_at, resolved_at, resolution", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(50);

  if (!showResolved) quarantineQuery = quarantineQuery.is("resolved_at", null);

  const [runsRes, quarantineRes] = await Promise.all([runsQuery, quarantineQuery]);

  const runs = (runsRes.data ?? []) as ImportRun[];
  const quarantine = (quarantineRes.data ?? []) as QuarantineRow[];
  const totalPages = Math.max(1, Math.ceil((runsRes.count ?? 0) / RUNS_PAGE));

  return (
    <div className="flex flex-col gap-[var(--sp-6)]">
      <div className="flex flex-wrap items-baseline justify-between gap-[var(--sp-4)]">
        <div>
          <h1 className="text-500 font-semibold text-[var(--ink-strong)]">Sincronizare</h1>
          <p className="mt-[var(--sp-1)] text-200 text-[var(--ink-muted)]">
            Istoric <code className="text-[var(--ink)]">import_runs</code>, carantină și dry-run. Pipeline-ul nu se
            rescrie de aici.
          </p>
        </div>
        <div className="flex items-center gap-[var(--sp-3)]">
          <span
            className={`rounded-[var(--radius-xs)] border px-[var(--sp-3)] py-[var(--sp-1)] text-200 font-medium ${
              syncEnabled ? "border-[var(--ok)] text-[var(--ok)]" : "border-[var(--warn)] text-[var(--warn)]"
            }`}
          >
            sync_enabled: {syncEnabled ? "pornit" : "oprit"}
          </span>
          <Link href="/admin/setari" className="text-200 text-[var(--accent)] underline">
            Schimbă în Setări
          </Link>
        </div>
      </div>

      <DryRunButtons />

      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-[var(--sp-4)]">
          <h2 className="text-400 font-semibold text-[var(--ink-strong)]">Istoric rulări</h2>
          <p className="text-200 text-[var(--ink-muted)]">{formatCount(runsRes.count ?? 0)} rulări</p>
        </div>

        {runsRes.error ? (
          <p className="mt-[var(--sp-3)] text-300 text-[var(--warn)]">Eroare: {runsRes.error.message}</p>
        ) : (
          <div className="mt-[var(--sp-3)] overflow-x-auto rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--surface)]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[var(--line-strong)] bg-[var(--bg-sunken)] text-left">
                  {[
                    "Început",
                    "Sfârșit",
                    "Sursă",
                    "Actor",
                    "Dry",
                    "Create",
                    "Update",
                    "Skip",
                    "Dezact.",
                    "Prețuri",
                    "Erori",
                  ].map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-[var(--sp-3)] py-[var(--sp-2)] text-100 font-semibold uppercase tracking-wide text-[var(--ink-muted)]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--line)] last:border-b-0 align-top">
                    <td className="whitespace-nowrap px-[var(--sp-3)] py-[var(--sp-2)] text-200 text-[var(--ink-muted)]">
                      {formatDateTime(r.started_at)}
                    </td>
                    <td className="whitespace-nowrap px-[var(--sp-3)] py-[var(--sp-2)] text-200 text-[var(--ink-muted)]">
                      {formatDateTime(r.finished_at)}
                    </td>
                    <td className="whitespace-nowrap px-[var(--sp-3)] py-[var(--sp-2)] text-200 text-[var(--ink)]">
                      {r.source}
                    </td>
                    <td className="max-w-[140px] truncate px-[var(--sp-3)] py-[var(--sp-2)] text-200 text-[var(--ink)]">
                      {r.actor ?? "—"}
                    </td>
                    <td className="px-[var(--sp-3)] py-[var(--sp-2)] text-200">{r.dry_run ? "da" : "nu"}</td>
                    <td className="px-[var(--sp-3)] py-[var(--sp-2)] text-300 text-[var(--ink)]">{r.rows_created}</td>
                    <td className="px-[var(--sp-3)] py-[var(--sp-2)] text-300 text-[var(--ink)]">{r.rows_updated}</td>
                    <td className="px-[var(--sp-3)] py-[var(--sp-2)] text-300 text-[var(--ink)]">{r.rows_skipped}</td>
                    <td className="px-[var(--sp-3)] py-[var(--sp-2)] text-300 text-[var(--ink)]">{r.rows_deactivated}</td>
                    <td className="px-[var(--sp-3)] py-[var(--sp-2)] text-300 text-[var(--ink)]">
                      {r.prices_changed}
                      {r.prices_locked ? (
                        <span className="text-100 text-[var(--ink-muted)]"> (lock {r.prices_locked})</span>
                      ) : null}
                    </td>
                    <td className="px-[var(--sp-3)] py-[var(--sp-2)] text-300 text-[var(--ink)]">
                      {errorsSummary(r.errors)}
                    </td>
                  </tr>
                ))}
                {!runs.length ? (
                  <tr>
                    <td colSpan={11} className="px-[var(--sp-4)] py-[var(--sp-6)] text-center text-300 text-[var(--ink-muted)]">
                      Nicio rulare înregistrată.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-[var(--sp-3)] flex items-center justify-between">
          <p className="text-200 text-[var(--ink-muted)]">
            Pagina {page} din {totalPages}
          </p>
          <div className="flex gap-[var(--sp-2)]">
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
      </section>

      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-[var(--sp-4)]">
          <h2 className="text-400 font-semibold text-[var(--ink-strong)]">Carantină sync</h2>
          <div className="flex items-center gap-[var(--sp-3)]">
            <p className="text-200 text-[var(--ink-muted)]">
              {formatCount(quarantineRes.count ?? 0)} {showResolved ? "total" : "deschise"}
            </p>
            {showResolved ? (
              <Link href="/admin/sincronizare" className="text-200 text-[var(--accent)] underline">
                Doar deschise
              </Link>
            ) : (
              <Link href="/admin/sincronizare?carantina=toate" className="text-200 text-[var(--accent)] underline">
                Toate
              </Link>
            )}
          </div>
        </div>

        {quarantineRes.error ? (
          <p className="mt-[var(--sp-3)] text-300 text-[var(--warn)]">Eroare: {quarantineRes.error.message}</p>
        ) : (
          <div className="mt-[var(--sp-3)] flex flex-col gap-[var(--sp-3)]">
            {quarantine.map((q) => (
              <article
                key={q.id}
                className="rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--surface)] p-[var(--sp-4)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-[var(--sp-4)]">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-[var(--sp-3)] gap-y-[var(--sp-1)]">
                      <h3 className="text-300 font-semibold text-[var(--ink-strong)]">{q.pandashop_id}</h3>
                      <span className="text-200 text-[var(--ink-muted)]">{formatDateTime(q.created_at)}</span>
                      {q.resolved_at ? (
                        <span className="rounded-[var(--radius-xs)] border border-[var(--line-strong)] px-[var(--sp-2)] py-[2px] text-100 uppercase text-[var(--ink-muted)]">
                          {q.resolution ?? "rezolvat"}
                        </span>
                      ) : (
                        <span className="rounded-[var(--radius-xs)] border border-[var(--warn)] px-[var(--sp-2)] py-[2px] text-100 uppercase text-[var(--warn)]">
                          deschis
                        </span>
                      )}
                    </div>
                    <p className="mt-[var(--sp-2)] text-300 text-[var(--ink)]">{q.reason}</p>
                    {q.raw != null ? (
                      <details className="mt-[var(--sp-2)]">
                        <summary className="cursor-pointer text-200 text-[var(--ink-muted)]">raw JSON</summary>
                        <pre className="mt-[var(--sp-1)] max-h-48 overflow-auto rounded-[var(--radius-sm)] bg-[var(--bg-sunken)] p-[var(--sp-2)] text-100">
                          {JSON.stringify(q.raw, null, 2)}
                        </pre>
                      </details>
                    ) : null}
                  </div>
                  {!q.resolved_at ? <QuarantineActions id={q.id} /> : null}
                </div>
              </article>
            ))}
            {!quarantine.length ? (
              <p className="rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--surface)] px-[var(--sp-4)] py-[var(--sp-6)] text-center text-300 text-[var(--ink-muted)]">
                {showResolved ? "Niciun element în carantină." : "Niciun element deschis în carantină."}
              </p>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
