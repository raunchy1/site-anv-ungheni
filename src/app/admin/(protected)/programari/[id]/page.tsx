import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/supabase/server";
import type { BookingStatus } from "../actions";
import { BookingStatusSelect } from "../StatusSelect";

type BookingDetail = {
  id: number;
  service_id: number | null;
  name: string;
  phone: string;
  car_model: string | null;
  preferred_date: string | null;
  note: string | null;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
  services: { title_ro: string; slug_ro: string } | null;
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

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso + (iso.includes("T") ? "" : "T12:00:00")).toLocaleDateString("ro-MD", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `Programare #${id}` };
}

export default async function ProgramareDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const { data, error } = await adminDb()
    .from("service_bookings")
    .select(
      `id, service_id, name, phone, car_model, preferred_date, note, status, created_at, updated_at,
       services ( title_ro, slug_ro )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) notFound();
  const b = data as unknown as BookingDetail;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-[var(--sp-4)]">
        <div>
          <Link href="/admin/programari" className="text-200 text-[var(--ink-muted)] underline">
            ← Înapoi la programări
          </Link>
          <h1 className="mt-[var(--sp-2)] text-500 font-semibold text-[var(--ink-strong)]">
            Programare #{b.id}
          </h1>
          <p className="mt-[var(--sp-1)] text-200 text-[var(--ink-muted)]">
            Primită {formatDateTime(b.created_at)}
            {b.updated_at !== b.created_at ? ` · actualizată ${formatDateTime(b.updated_at)}` : null}
          </p>
        </div>
        <div className="w-48">
          <p className="mb-[var(--sp-1)] text-100 font-medium uppercase tracking-wide text-[var(--ink-muted)]">
            Stare
          </p>
          <BookingStatusSelect id={b.id} status={b.status} />
        </div>
      </div>

      <section className="mt-[var(--sp-6)] max-w-xl rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--surface)] p-[var(--sp-4)]">
        <h2 className="text-300 font-semibold text-[var(--ink-strong)]">Detalii</h2>
        <dl className="mt-[var(--sp-3)] grid grid-cols-[auto_1fr] gap-x-[var(--sp-4)] gap-y-[var(--sp-2)] text-300">
          <dt className="text-[var(--ink-muted)]">Client</dt>
          <dd className="text-[var(--ink-strong)]">{b.name}</dd>
          <dt className="text-[var(--ink-muted)]">Telefon</dt>
          <dd className="text-[var(--ink-strong)]">
            <a href={`tel:${b.phone}`} className="underline">
              {b.phone}
            </a>
          </dd>
          <dt className="text-[var(--ink-muted)]">Serviciu</dt>
          <dd className="text-[var(--ink-strong)]">{b.services?.title_ro ?? "—"}</dd>
          <dt className="text-[var(--ink-muted)]">Mașină</dt>
          <dd className="text-[var(--ink-strong)]">{b.car_model ?? "—"}</dd>
          <dt className="text-[var(--ink-muted)]">Data dorită</dt>
          <dd className="text-[var(--ink-strong)]">{formatDate(b.preferred_date)}</dd>
          <dt className="text-[var(--ink-muted)]">Notă</dt>
          <dd className="whitespace-pre-wrap text-[var(--ink-strong)]">{b.note?.trim() || "—"}</dd>
        </dl>
      </section>
    </div>
  );
}
