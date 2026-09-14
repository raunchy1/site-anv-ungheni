/**
 * Metrici comerciale pentru panoul admin (Etapa 7).
 * Doar Server Components / Server Actions — folosește adminDb().
 * Fără cifre inventate: fiecare bloc întoarce date sau eroare explicită.
 */

import { adminDb } from "@/lib/supabase/server";

export type MetricError = { ok: false; error: string };
export type MetricOk<T> = { ok: true; data: T };
export type MetricResult<T> = MetricOk<T> | MetricError;

export type OrdersPeriod = {
  today: number;
  week: number;
  avgOrderValueMdl: number | null;
  /** Comenzi luate în calcul la AOV (excl. anulate). */
  avgSampleSize: number;
};

export type TopProduct = {
  productId: number | null;
  title: string;
  slug: string | null;
  qty: number;
  lines: number;
};

export type StockSummary = {
  count: number;
  valueMdl: number;
};

export type BrandMargin = {
  brand: string;
  products: number;
  /** Marja medie: (price − source) / price, 0–1. */
  avgMargin: number;
};

function startOfLocalDay(d = new Date()): string {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

/** Luni 00:00 locală — săptămâna comercială RO. */
function startOfLocalWeek(d = new Date()): string {
  const x = new Date(d);
  const day = x.getDay(); // 0 = duminică
  const diff = day === 0 ? 6 : day - 1;
  x.setDate(x.getDate() - diff);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

function errMsg(error: { message?: string } | null, fallback: string): string {
  return error?.message?.trim() || fallback;
}

export async function loadOrdersMetrics(): Promise<MetricResult<OrdersPeriod>> {
  const db = adminDb();
  const todayIso = startOfLocalDay();
  const weekIso = startOfLocalWeek();

  const [todayRes, weekRes, aovRes] = await Promise.all([
    db.from("orders").select("id", { count: "exact", head: true }).gte("created_at", todayIso),
    db.from("orders").select("id", { count: "exact", head: true }).gte("created_at", weekIso),
    // AOV: totaluri pe comenzi neanulate (eșantion rezonabil; panoul e pentru proprietar, nu BI).
    db
      .from("orders")
      .select("total_mdl")
      .neq("status", "anulat")
      .order("created_at", { ascending: false })
      .limit(5000),
  ]);

  if (todayRes.error) return { ok: false, error: errMsg(todayRes.error, "Eroare comenzi (azi)") };
  if (weekRes.error) return { ok: false, error: errMsg(weekRes.error, "Eroare comenzi (săptămână)") };
  if (aovRes.error) return { ok: false, error: errMsg(aovRes.error, "Eroare valoare medie comandă") };

  const totals = (aovRes.data ?? [])
    .map((r) => Number((r as { total_mdl: number }).total_mdl))
    .filter((n) => Number.isFinite(n));
  const avgOrderValueMdl =
    totals.length > 0 ? totals.reduce((a, b) => a + b, 0) / totals.length : null;

  return {
    ok: true,
    data: {
      today: todayRes.count ?? 0,
      week: weekRes.count ?? 0,
      avgOrderValueMdl,
      avgSampleSize: totals.length,
    },
  };
}

export async function loadTopOrderedProducts(limit = 10): Promise<MetricResult<TopProduct[]>> {
  const db = adminDb();
  const { data, error } = await db
    .from("order_items")
    .select("product_id, title_snapshot, slug_snapshot, qty")
    .limit(10000);

  if (error) return { ok: false, error: errMsg(error, "Eroare articole comandă") };

  type Agg = { productId: number | null; title: string; slug: string | null; qty: number; lines: number };
  const map = new Map<string, Agg>();

  for (const row of data ?? []) {
    const r = row as {
      product_id: number | null;
      title_snapshot: string;
      slug_snapshot: string | null;
      qty: number;
    };
    const key = r.product_id != null ? `id:${r.product_id}` : `slug:${r.slug_snapshot ?? r.title_snapshot}`;
    const cur = map.get(key);
    if (cur) {
      cur.qty += Number(r.qty) || 0;
      cur.lines += 1;
    } else {
      map.set(key, {
        productId: r.product_id,
        title: r.title_snapshot,
        slug: r.slug_snapshot,
        qty: Number(r.qty) || 0,
        lines: 1,
      });
    }
  }

  const ranked = [...map.values()].sort((a, b) => b.qty - a.qty || b.lines - a.lines).slice(0, limit);
  return { ok: true, data: ranked };
}

export async function loadInStockSummary(): Promise<MetricResult<StockSummary>> {
  const db = adminDb();

  const countRes = await db
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("stock_status", "in_stock");

  if (countRes.error) return { ok: false, error: errMsg(countRes.error, "Eroare număr in_stock") };

  // Stocul propriu e mic (zeci de SKU) — putem însuma price_mdl pe serverul aplicației.
  const { data, error } = await db
    .from("products")
    .select("price_mdl")
    .eq("stock_status", "in_stock")
    .limit(2000);

  if (error) return { ok: false, error: errMsg(error, "Eroare valoare stoc") };

  const valueMdl = (data ?? []).reduce((sum, row) => {
    const p = Number((row as { price_mdl: number | null }).price_mdl);
    return sum + (Number.isFinite(p) ? p : 0);
  }, 0);

  return {
    ok: true,
    data: { count: countRes.count ?? 0, valueMdl },
  };
}

export async function loadProductsWithoutImages(): Promise<MetricResult<number>> {
  const db = adminDb();

  const [totalRes, withImgRes] = await Promise.all([
    db.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
    // !inner = doar produsele care au cel puțin o imagine
    db
      .from("products")
      .select("id, product_images!inner(id)", { count: "exact", head: true })
      .eq("is_active", true),
  ]);

  if (totalRes.error) return { ok: false, error: errMsg(totalRes.error, "Eroare număr produse") };
  if (withImgRes.error) return { ok: false, error: errMsg(withImgRes.error, "Eroare produse cu imagine") };

  const total = totalRes.count ?? 0;
  const withImg = withImgRes.count ?? 0;
  return { ok: true, data: Math.max(0, total - withImg) };
}

export async function loadActiveWithoutPrice(): Promise<MetricResult<number>> {
  const db = adminDb();
  const { count, error } = await db
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .is("price_mdl", null);

  if (error) return { ok: false, error: errMsg(error, "Eroare produse fără preț") };
  return { ok: true, data: count ?? 0 };
}

/**
 * Marja medie pe marcă: (price_mdl − source_price_mdl) / price_mdl
 * doar unde ambele prețuri există și price_mdl > 0.
 * Paginem până epuizăm (sau plafon de siguranță).
 */
export async function loadBrandMargins(topN = 15): Promise<MetricResult<BrandMargin[]>> {
  const db = adminDb();
  const pageSize = 1000;
  const maxPages = 25; // plafon ~25k rânduri

  type Acc = { sumMargin: number; n: number };
  const byBrand = new Map<string, Acc>();

  for (let page = 0; page < maxPages; page++) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    const { data, error } = await db
      .from("products")
      .select("brand_name, price_mdl, source_price_mdl")
      .eq("is_active", true)
      .not("price_mdl", "is", null)
      .not("source_price_mdl", "is", null)
      .gt("price_mdl", 0)
      .not("brand_name", "is", null)
      .range(from, to);

    if (error) return { ok: false, error: errMsg(error, "Eroare marjă pe marcă") };

    const rows = data ?? [];
    for (const row of rows) {
      const r = row as {
        brand_name: string | null;
        price_mdl: number;
        source_price_mdl: number;
      };
      const brand = (r.brand_name ?? "").trim();
      if (!brand) continue;
      const price = Number(r.price_mdl);
      const source = Number(r.source_price_mdl);
      if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(source)) continue;
      const margin = (price - source) / price;
      const cur = byBrand.get(brand) ?? { sumMargin: 0, n: 0 };
      cur.sumMargin += margin;
      cur.n += 1;
      byBrand.set(brand, cur);
    }

    if (rows.length < pageSize) break;
  }

  const ranked = [...byBrand.entries()]
    .map(([brand, { sumMargin, n }]) => ({
      brand,
      products: n,
      avgMargin: sumMargin / n,
    }))
    .sort((a, b) => b.products - a.products)
    .slice(0, topN);

  return { ok: true, data: ranked };
}

export type AnalizaBundle = {
  orders: MetricResult<OrdersPeriod>;
  topProducts: MetricResult<TopProduct[]>;
  inStock: MetricResult<StockSummary>;
  withoutImages: MetricResult<number>;
  withoutPrice: MetricResult<number>;
  brandMargins: MetricResult<BrandMargin[]>;
};

export async function loadAnalizaMetrics(): Promise<AnalizaBundle> {
  const [orders, topProducts, inStock, withoutImages, withoutPrice, brandMargins] = await Promise.all([
    loadOrdersMetrics(),
    loadTopOrderedProducts(10),
    loadInStockSummary(),
    loadProductsWithoutImages(),
    loadActiveWithoutPrice(),
    loadBrandMargins(15),
  ]);
  return { orders, topProducts, inStock, withoutImages, withoutPrice, brandMargins };
}
