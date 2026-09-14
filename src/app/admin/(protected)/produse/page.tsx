import type { Metadata } from "next";
import Link from "next/link";
import { adminDb, imageUrl } from "@/lib/supabase/server";
import { formatCount } from "@/lib/format";
import type { Season, StockStatus } from "@/lib/types";
import { QuickEditRow } from "./QuickEditRow";

export const metadata: Metadata = { title: "Produse" };

const PAGE_SIZE = 30;

const SEASON_LABEL: Record<Season, string> = { vara: "Vară", iarna: "Iarnă", all_season: "All Season" };
const STOCK_LABEL: Record<StockStatus, string> = {
  in_stock: "În stoc · atelier",
  supplier: "La furnizor",
  out_of_stock: "Indisponibil",
};

type SearchParams = {
  q?: string;
  marca?: string;
  sezon?: string;
  marime?: string;
  stoc?: string;
  fixat?: string;
  pagina?: string;
};

type ProductImage = { storage_path: string; sort_order: number };

type ProductRow = {
  id: number;
  slug_ro: string;
  slug_ru: string | null;
  title_ro: string;
  brand_name: string | null;
  model: string | null;
  size_raw: string | null;
  width: number | null;
  aspect: number | null;
  diameter: string | null;
  season: Season | null;
  price_mdl: number | null;
  source_price_mdl: number | null;
  price_locked: boolean;
  price_source: string;
  stock_status: StockStatus;
  is_active: boolean;
  product_images: ProductImage[];
};

function formatSize(p: Pick<ProductRow, "size_raw" | "width" | "aspect" | "diameter">): string {
  if (p.size_raw) return p.size_raw;
  if (p.width && p.aspect && p.diameter) return `${p.width}/${p.aspect} ${p.diameter}`;
  return "—";
}

function thumbnail(images: ProductImage[]): string | null {
  if (!images.length) return null;
  const first = [...images].sort((a, b) => a.sort_order - b.sort_order)[0];
  return imageUrl(first.storage_path);
}

/** Scapă `%` și `,` — primul rupe `ilike`, al doilea desparte condițiile din `.or()`. */
function safeTerm(v: string): string {
  return v.replace(/[%,]/g, "").trim();
}

function pageHref(sp: SearchParams, page: number): string {
  const params = new URLSearchParams();
  if (sp.q) params.set("q", sp.q);
  if (sp.marca) params.set("marca", sp.marca);
  if (sp.sezon) params.set("sezon", sp.sezon);
  if (sp.marime) params.set("marime", sp.marime);
  if (sp.stoc) params.set("stoc", sp.stoc);
  if (sp.fixat) params.set("fixat", sp.fixat);
  if (page > 1) params.set("pagina", String(page));
  const qs = params.toString();
  return qs ? `/admin/produse?${qs}` : "/admin/produse";
}

const fieldClass =
  "h-10 w-full rounded-[var(--radius-sm)] border border-[var(--field-line)] bg-[var(--field-bg)] px-[var(--sp-3)] text-300 outline-none focus:border-[var(--accent)] md:w-auto";
const labelClass = "text-100 font-medium uppercase tracking-wide text-[var(--ink-muted)]";

export default async function ProdusePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.pagina) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const db = adminDb();

  let query = db
    .from("products")
    .select(
      `id, slug_ro, slug_ru, title_ro, brand_name, model, size_raw, width, aspect, diameter, season,
       price_mdl, source_price_mdl, price_locked, price_source, stock_status, is_active,
       product_images ( storage_path, sort_order )`,
      { count: "exact" },
    )
    .order("id", { ascending: true })
    .range(from, to);

  const q = sp.q ? safeTerm(sp.q) : "";
  if (q) query = query.or(`title_ro.ilike.%${q}%,brand_name.ilike.%${q}%,model.ilike.%${q}%`);
  if (sp.marca) query = query.eq("brand_name", sp.marca);
  if (sp.sezon) query = query.eq("season", sp.sezon);
  if (sp.marime) query = query.ilike("size_raw", `%${safeTerm(sp.marime)}%`);
  if (sp.stoc) query = query.eq("stock_status", sp.stoc);
  if (sp.fixat === "1") query = query.eq("price_locked", true);

  const [{ data, count, error }, { data: brands }] = await Promise.all([
    query,
    db.from("brands").select("name").eq("is_active", true).order("name"),
  ]);

  const products = (data ?? []) as unknown as ProductRow[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const hasFilters = Boolean(q || sp.marca || sp.sezon || sp.marime || sp.stoc || sp.fixat);

  const filterFields = (
    <>
      <div className="flex w-full flex-col gap-[var(--sp-1)] md:w-auto">
        <label htmlFor="q" className={labelClass}>
          Căutare
        </label>
        <input
          id="q"
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="titlu, marcă, model…"
          className={`${fieldClass} md:w-56`}
        />
      </div>

      <div className="flex w-full flex-col gap-[var(--sp-1)] md:w-auto">
        <label htmlFor="marca" className={labelClass}>
          Marcă
        </label>
        <select
          id="marca"
          name="marca"
          defaultValue={sp.marca ?? ""}
          className={`${fieldClass} md:w-40`}
        >
          <option value="">Toate</option>
          {(brands ?? []).map((b: { name: string }) => (
            <option key={b.name} value={b.name}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex w-full flex-col gap-[var(--sp-1)] md:w-auto">
        <label htmlFor="sezon" className={labelClass}>
          Sezon
        </label>
        <select
          id="sezon"
          name="sezon"
          defaultValue={sp.sezon ?? ""}
          className={`${fieldClass} md:w-36`}
        >
          <option value="">Toate</option>
          <option value="vara">Vară</option>
          <option value="iarna">Iarnă</option>
          <option value="all_season">All Season</option>
        </select>
      </div>

      <div className="flex w-full flex-col gap-[var(--sp-1)] md:w-auto">
        <label htmlFor="marime" className={labelClass}>
          Măsură
        </label>
        <input
          id="marime"
          name="marime"
          defaultValue={sp.marime ?? ""}
          placeholder="205/55 R16…"
          className={`${fieldClass} md:w-36`}
        />
      </div>

      <div className="flex w-full flex-col gap-[var(--sp-1)] md:w-auto">
        <label htmlFor="stoc" className={labelClass}>
          Stoc
        </label>
        <select
          id="stoc"
          name="stoc"
          defaultValue={sp.stoc ?? ""}
          className={`${fieldClass} md:w-44`}
        >
          <option value="">Toate</option>
          <option value="in_stock">În stoc · atelier</option>
          <option value="supplier">La furnizor</option>
          <option value="out_of_stock">Indisponibil</option>
        </select>
      </div>

      <label className="flex h-10 items-center gap-[var(--sp-2)] text-300 text-[var(--ink-strong)]">
        <input type="checkbox" name="fixat" value="1" defaultChecked={sp.fixat === "1"} className="h-4 w-4" />
        Doar preț fixat manual
      </label>

      <div className="flex w-full flex-wrap items-center gap-[var(--sp-3)] md:w-auto">
        <button
          type="submit"
          className="h-10 flex-1 rounded-[var(--radius-xs)] bg-[var(--accent)] px-[var(--sp-5)] text-300 font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)] md:flex-none"
        >
          Filtrează
        </button>
        {hasFilters ? (
          <Link href="/admin/produse" className="h-10 px-[var(--sp-2)] text-300 text-[var(--ink-muted)] underline">
            Resetează
          </Link>
        ) : null}
      </div>
    </>
  );

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-[var(--sp-3)]">
        <h1 className="text-500 font-semibold text-[var(--ink-strong)]">Produse</h1>
        <div className="flex flex-wrap items-center gap-[var(--sp-3)]">
          <p className="text-200 text-[var(--ink-muted)]">{formatCount(count ?? 0)} produse găsite</p>
          <Link
            href="/admin/produse/nou"
            className="inline-flex h-10 items-center rounded-[var(--radius-xs)] bg-[var(--accent)] px-[var(--sp-4)] text-300 font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)]"
          >
            Produs nou
          </Link>
        </div>
      </div>

      {/* Mobil: filtre colapsabile; md+: mereu vizibile (summary ascuns) */}
      <details
        className="mt-[var(--sp-4)] rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--surface)] open:pb-0"
        open
      >
        <summary className="cursor-pointer list-none px-[var(--sp-4)] py-[var(--sp-3)] text-300 font-semibold text-[var(--ink-strong)] marker:content-none md:hidden [&::-webkit-details-marker]:hidden">
          Filtre{hasFilters ? " · active" : ""}
        </summary>
        <form
          method="get"
          className="flex flex-col gap-[var(--sp-3)] px-[var(--sp-4)] pb-[var(--sp-4)] md:flex-row md:flex-wrap md:items-end md:pt-[var(--sp-4)]"
        >
          {filterFields}
        </form>
      </details>

      {error ? (
        <p className="mt-[var(--sp-4)] text-300 text-[var(--warn)]">Eroare la citirea produselor: {error.message}</p>
      ) : (
        <>
          {/* Carduri pe mobil */}
          <div className="mt-[var(--sp-4)] flex flex-col gap-[var(--sp-3)] md:hidden">
            {products.map((p) => {
              const thumb = thumbnail(p.product_images ?? []);
              return (
                <article
                  key={p.id}
                  className="rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--surface)] p-[var(--sp-4)]"
                >
                  <div className="flex gap-[var(--sp-3)]">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumb}
                        alt=""
                        width={56}
                        height={56}
                        className="h-14 w-14 shrink-0 rounded-[var(--radius-sm)] object-contain"
                      />
                    ) : (
                      <div className="h-14 w-14 shrink-0 rounded-[var(--radius-sm)] bg-[var(--surface-2)]" />
                    )}
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/produse/${p.id}`}
                        className="block text-300 font-medium text-[var(--ink-strong)] underline-offset-2 hover:text-[var(--accent)] hover:underline"
                        title={p.title_ro}
                      >
                        {p.title_ro}
                      </Link>
                      {!p.is_active ? (
                        <span className="text-100 font-medium uppercase tracking-wide text-[var(--warn)]">Inactiv</span>
                      ) : null}
                      <p className="mt-[var(--sp-1)] text-200 text-[var(--ink-muted)]">
                        <span className="font-mono text-[var(--ink)]">{formatSize(p)}</span>
                        {p.season ? ` · ${SEASON_LABEL[p.season]}` : ""}
                      </p>
                    </div>
                  </div>
                  <QuickEditRow
                    id={p.id}
                    priceMdl={p.price_mdl}
                    sourcePriceMdl={p.source_price_mdl}
                    priceLocked={p.price_locked}
                    stockStatus={p.stock_status}
                    variant="card"
                  />
                </article>
              );
            })}
            {!products.length ? (
              <p className="rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--surface)] px-[var(--sp-4)] py-[var(--sp-6)] text-center text-300 text-[var(--ink-muted)]">
                Niciun produs nu corespunde filtrelor.
              </p>
            ) : null}
          </div>

          {/* Tabel pe md+ */}
          <div className="mt-[var(--sp-4)] hidden overflow-x-auto rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--surface)] md:block">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[var(--line-strong)] bg-[var(--bg-sunken)] text-left">
                  {["", "Titlu", "Măsură", "Sezon", "Preț", "Preț furnizor", "Marjă", "Stoc", "Lacăt preț"].map((h) => (
                    <th
                      key={h || "thumb"}
                      className="whitespace-nowrap px-[var(--sp-3)] py-[var(--sp-2)] text-100 font-semibold uppercase tracking-wide text-[var(--ink-muted)]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const thumb = thumbnail(p.product_images ?? []);
                  return (
                    <tr key={p.id} className="border-b border-[var(--line)] last:border-b-0">
                      <td className="px-[var(--sp-3)] py-[var(--sp-2)]">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb}
                            alt=""
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-[var(--radius-sm)] object-contain"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-[var(--radius-sm)] bg-[var(--surface-2)]" />
                        )}
                      </td>
                      <td className="max-w-[280px] px-[var(--sp-3)] py-[var(--sp-2)] text-300 text-[var(--ink-strong)]">
                        <Link
                          href={`/admin/produse/${p.id}`}
                          className="block truncate underline-offset-2 hover:text-[var(--accent)] hover:underline"
                          title={p.title_ro}
                        >
                          {p.title_ro}
                        </Link>
                        {!p.is_active ? (
                          <span className="text-100 font-medium uppercase tracking-wide text-[var(--warn)]">Inactiv</span>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-[var(--sp-3)] py-[var(--sp-2)] text-300 font-mono text-[var(--ink)]">
                        {formatSize(p)}
                      </td>
                      <td className="whitespace-nowrap px-[var(--sp-3)] py-[var(--sp-2)] text-300 text-[var(--ink)]">
                        {p.season ? SEASON_LABEL[p.season] : "—"}
                      </td>
                      <QuickEditRow
                        id={p.id}
                        priceMdl={p.price_mdl}
                        sourcePriceMdl={p.source_price_mdl}
                        priceLocked={p.price_locked}
                        stockStatus={p.stock_status}
                      />
                    </tr>
                  );
                })}
                {!products.length ? (
                  <tr>
                    <td colSpan={9} className="px-[var(--sp-4)] py-[var(--sp-6)] text-center text-300 text-[var(--ink-muted)]">
                      Niciun produs nu corespunde filtrelor.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="mt-[var(--sp-4)] flex flex-wrap items-center justify-between gap-[var(--sp-2)]">
        <p className="text-200 text-[var(--ink-muted)]">
          Pagina {page} din {totalPages}
        </p>
        <div className="flex items-center gap-[var(--sp-2)]">
          {page > 1 ? (
            <Link
              href={pageHref(sp, page - 1)}
              className="inline-flex h-9 items-center rounded-[var(--radius-xs)] border border-[var(--line-strong)] px-[var(--sp-3)] text-200 font-medium text-[var(--ink-strong)] hover:bg-[var(--surface-2)]"
            >
              ← Anterior
            </Link>
          ) : null}
          {page < totalPages ? (
            <Link
              href={pageHref(sp, page + 1)}
              className="inline-flex h-9 items-center rounded-[var(--radius-xs)] border border-[var(--line-strong)] px-[var(--sp-3)] text-200 font-medium text-[var(--ink-strong)] hover:bg-[var(--surface-2)]"
            >
              Următor →
            </Link>
          ) : null}
        </div>
      </div>

      <p className="mt-[var(--sp-1)] text-100 text-[var(--ink-muted)]">
        {STOCK_LABEL.in_stock} = marfă fizic în atelier · {STOCK_LABEL.supplier} = adusă în 1–3 zile.
      </p>
    </div>
  );
}
