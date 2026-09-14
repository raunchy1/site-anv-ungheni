import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/supabase/server";
import { formatPriceWithUnit } from "@/lib/format";
import { etichetaLivrare, etichetaPlata } from "@/lib/orders/mesaj";
import type { OrderStatus } from "../actions";
import { OrderStatusSelect } from "../StatusSelect";

type OrderDetail = {
  id: number;
  order_number: string;
  customer_name: string;
  phone: string;
  email: string | null;
  city: string;
  address: string | null;
  delivery: "ridicare_magazin" | "curier_ungheni" | "curier_moldova";
  payment: "numerar_livrare" | "numerar_magazin" | "transfer_bancar";
  wants_mounting: boolean;
  note: string | null;
  subtotal_mdl: number;
  delivery_mdl: number;
  total_mdl: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
};

type OrderItem = {
  id: number;
  product_id: number | null;
  title_snapshot: string;
  slug_snapshot: string;
  price_snapshot: number;
  qty: number;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ro-MD", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `Comandă #${id}` };
}

export default async function ComandaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const db = adminDb();
  const [{ data: order, error: orderError }, { data: items, error: itemsError }] = await Promise.all([
    db
      .from("orders")
      .select(
        `id, order_number, customer_name, phone, email, city, address, delivery, payment,
         wants_mounting, note, subtotal_mdl, delivery_mdl, total_mdl, status, created_at, updated_at`,
      )
      .eq("id", id)
      .maybeSingle(),
    db
      .from("order_items")
      .select("id, product_id, title_snapshot, slug_snapshot, price_snapshot, qty")
      .eq("order_id", id)
      .order("id", { ascending: true }),
  ]);

  if (orderError || !order) notFound();
  const o = order as OrderDetail;
  const lines = (items ?? []) as OrderItem[];

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-[var(--sp-4)]">
        <div>
          <Link href="/admin/comenzi" className="text-200 text-[var(--ink-muted)] underline">
            ← Înapoi la comenzi
          </Link>
          <h1 className="mt-[var(--sp-2)] text-500 font-semibold text-[var(--ink-strong)]">
            Comandă {o.order_number}
          </h1>
          <p className="mt-[var(--sp-1)] text-200 text-[var(--ink-muted)]">
            Plasată {formatDate(o.created_at)}
            {o.updated_at !== o.created_at ? ` · actualizată ${formatDate(o.updated_at)}` : null}
          </p>
        </div>
        <div className="w-48">
          <p className="mb-[var(--sp-1)] text-100 font-medium uppercase tracking-wide text-[var(--ink-muted)]">
            Stare
          </p>
          <OrderStatusSelect id={o.id} status={o.status} />
        </div>
      </div>

      <div className="mt-[var(--sp-6)] grid gap-[var(--sp-4)] md:grid-cols-2">
        <section className="rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--surface)] p-[var(--sp-4)]">
          <h2 className="text-300 font-semibold text-[var(--ink-strong)]">Client</h2>
          <dl className="mt-[var(--sp-3)] grid grid-cols-[auto_1fr] gap-x-[var(--sp-4)] gap-y-[var(--sp-2)] text-300">
            <dt className="text-[var(--ink-muted)]">Nume</dt>
            <dd className="text-[var(--ink-strong)]">{o.customer_name}</dd>
            <dt className="text-[var(--ink-muted)]">Telefon</dt>
            <dd className="text-[var(--ink-strong)]">
              <a href={`tel:${o.phone}`} className="underline">
                {o.phone}
              </a>
            </dd>
            <dt className="text-[var(--ink-muted)]">E-mail</dt>
            <dd className="text-[var(--ink-strong)]">{o.email ?? "—"}</dd>
            <dt className="text-[var(--ink-muted)]">Oraș</dt>
            <dd className="text-[var(--ink-strong)]">{o.city}</dd>
            <dt className="text-[var(--ink-muted)]">Adresă</dt>
            <dd className="text-[var(--ink-strong)]">{o.address ?? "—"}</dd>
          </dl>
        </section>

        <section className="rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--surface)] p-[var(--sp-4)]">
          <h2 className="text-300 font-semibold text-[var(--ink-strong)]">Livrare și plată</h2>
          <dl className="mt-[var(--sp-3)] grid grid-cols-[auto_1fr] gap-x-[var(--sp-4)] gap-y-[var(--sp-2)] text-300">
            <dt className="text-[var(--ink-muted)]">Livrare</dt>
            <dd className="text-[var(--ink-strong)]">{etichetaLivrare(o.delivery, "ro")}</dd>
            <dt className="text-[var(--ink-muted)]">Plată</dt>
            <dd className="text-[var(--ink-strong)]">{etichetaPlata(o.payment, "ro")}</dd>
            <dt className="text-[var(--ink-muted)]">Montaj</dt>
            <dd className="text-[var(--ink-strong)]">{o.wants_mounting ? "Da" : "Nu"}</dd>
            <dt className="text-[var(--ink-muted)]">Notă</dt>
            <dd className="whitespace-pre-wrap text-[var(--ink-strong)]">{o.note?.trim() || "—"}</dd>
          </dl>
        </section>
      </div>

      <section className="mt-[var(--sp-4)] overflow-x-auto rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--surface)]">
        <h2 className="border-b border-[var(--line-strong)] px-[var(--sp-4)] py-[var(--sp-3)] text-300 font-semibold text-[var(--ink-strong)]">
          Articole
        </h2>
        {itemsError ? (
          <p className="px-[var(--sp-4)] py-[var(--sp-4)] text-300 text-[var(--warn)]">
            Eroare la citirea articolelor: {itemsError.message}
          </p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[var(--bg-sunken)] text-left">
                {["Produs", "Preț", "Cant.", "Subtotal"].map((h) => (
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
              {lines.map((line) => {
                const lineTotal = Number(line.price_snapshot) * line.qty;
                return (
                  <tr key={line.id} className="border-b border-[var(--line)] last:border-b-0">
                    <td className="px-[var(--sp-3)] py-[var(--sp-3)] text-300 text-[var(--ink-strong)]">
                      {line.product_id ? (
                        <Link
                          href={`/admin/produse/${line.product_id}`}
                          className="underline-offset-2 hover:text-[var(--accent)] hover:underline"
                        >
                          {line.title_snapshot}
                        </Link>
                      ) : (
                        line.title_snapshot
                      )}
                      <p className="text-100 font-mono text-[var(--ink-muted)]">{line.slug_snapshot}</p>
                    </td>
                    <td className="whitespace-nowrap px-[var(--sp-3)] py-[var(--sp-3)] text-300 text-[var(--ink)]">
                      {formatPriceWithUnit(Number(line.price_snapshot))}
                    </td>
                    <td className="whitespace-nowrap px-[var(--sp-3)] py-[var(--sp-3)] text-300 text-[var(--ink)]">
                      {line.qty}
                    </td>
                    <td className="whitespace-nowrap px-[var(--sp-3)] py-[var(--sp-3)] text-300 font-medium text-[var(--ink-strong)]">
                      {formatPriceWithUnit(lineTotal)}
                    </td>
                  </tr>
                );
              })}
              {!lines.length ? (
                <tr>
                  <td colSpan={4} className="px-[var(--sp-4)] py-[var(--sp-6)] text-center text-300 text-[var(--ink-muted)]">
                    Comanda nu are articole.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        )}
        <div className="border-t border-[var(--line-strong)] px-[var(--sp-4)] py-[var(--sp-3)]">
          <dl className="ml-auto grid w-56 grid-cols-[1fr_auto] gap-x-[var(--sp-4)] gap-y-[var(--sp-1)] text-300">
            <dt className="text-[var(--ink-muted)]">Subtotal</dt>
            <dd className="text-right text-[var(--ink)]">{formatPriceWithUnit(Number(o.subtotal_mdl))}</dd>
            <dt className="text-[var(--ink-muted)]">Livrare</dt>
            <dd className="text-right text-[var(--ink)]">{formatPriceWithUnit(Number(o.delivery_mdl))}</dd>
            <dt className="font-semibold text-[var(--ink-strong)]">Total</dt>
            <dd className="text-right font-semibold text-[var(--ink-strong)]">
              {formatPriceWithUnit(Number(o.total_mdl))}
            </dd>
          </dl>
        </div>
      </section>
    </div>
  );
}
