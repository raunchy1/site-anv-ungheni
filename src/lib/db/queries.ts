import { cache } from "react";
import { db, imageUrl } from "@/lib/supabase/server";
import type {
  Brand, FacetOption, Locale, Product, Season, SeasonBreakdown, Service, Settings, SizeFacets, StockStatus,
} from "@/lib/types";

const PRODUCT_COLS = `
  id, legacy_product_id, slug_ro, slug_ru, category, brand_id, brand_name, model,
  size_system, width, aspect, overall_diameter_in, section_width_in, diameter, size_raw,
  load_index, speed_index, season, is_xl, is_runflat, is_commercial,
  price_mdl, stock_status, title_ro, title_ru, description_ro, description_ru,
  meta_title_ro, meta_title_ru, meta_desc_ro, meta_desc_ru,
  product_images ( storage_path, alt_ro, alt_ru ),
  brands ( slug_ro, slug_ru, name, logo_url )
`;

type BrandRef = { slug_ro: string; slug_ru: string | null; name: string; logo_url: string | null };

type Row = Product & {
  product_images?: { storage_path: string; alt_ro: string | null; alt_ru: string | null }[];
  /** PostgREST tipează relația încorporată ca listă chiar și când e unu-la-unu. */
  brands?: BrandRef | BrandRef[] | null;
};

const one = (b: Row["brands"]): BrandRef | null => (Array.isArray(b) ? (b[0] ?? null) : (b ?? null));

const withImage = (r: Row): Product => {
  const brand = one(r.brands);
  return {
    ...r,
    image_url: imageUrl(r.product_images?.[0]?.storage_path),
    // `logo_url` ține URL-ul public complet, nu o cale de Storage: logo-urile se
    // încarcă o singură dată, manual, iar bucket-ul lor nu e cel al produselor.
    brand_logo_url: brand?.logo_url ?? null,
    brand_slug: brand?.slug_ro ?? null,
  };
};

export const getSettings = cache(async (): Promise<Settings> => {
  const { data, error } = await db.from("settings").select("*").single();
  if (error) throw new Error(`settings: ${error.message}`);
  return data as Settings;
});

export const getProductBySlug = cache(async (slug: string, locale: Locale): Promise<Product | null> => {
  const col = locale === "ru" ? "slug_ru" : "slug_ro";
  const { data } = await db.from("products").select(PRODUCT_COLS).eq(col, slug).maybeSingle();
  // fallback: produsele fără slug RU se servesc sub slug-ul RO
  if (!data && locale === "ru") {
    const { data: ro } = await db.from("products").select(PRODUCT_COLS).eq("slug_ro", slug).maybeSingle();
    return ro ? withImage(ro as unknown as Row) : null;
  }
  return data ? withImage(data as unknown as Row) : null;
});

export const getBrandBySlug = cache(async (slug: string, locale: Locale): Promise<Brand | null> => {
  const col = locale === "ru" ? "slug_ru" : "slug_ro";
  const { data } = await db.from("brands").select("*").eq(col, slug).maybeSingle();
  if (!data && locale === "ru") {
    const { data: ro } = await db.from("brands").select("*").eq("slug_ro", slug).maybeSingle();
    return (ro as Brand) ?? null;
  }
  return (data as Brand) ?? null;
});

export const getServiceBySlug = cache(async (slug: string, locale: Locale): Promise<Service | null> => {
  const col = locale === "ru" ? "slug_ru" : "slug_ro";
  const { data } = await db.from("services").select("*").eq(col, slug).maybeSingle();
  if (!data && locale === "ru") {
    const { data: ro } = await db.from("services").select("*").eq("slug_ro", slug).maybeSingle();
    return (ro as Service) ?? null;
  }
  return (data as Service) ?? null;
});

export const getServices = cache(async (): Promise<Service[]> => {
  const { data } = await db.from("services").select("*").eq("is_active", true).order("sort_order");
  return (data as Service[]) ?? [];
});

export const getBrands = cache(async (): Promise<Brand[]> => {
  const { data } = await db.from("brands").select("*").order("name");
  return (data as Brand[]) ?? [];
});

/* ------------------------------------------------------------------ catalog */

export type CatalogFilters = {
  width?: number;
  aspect?: number;
  diameter?: string;
  season?: Season;
  brand?: string;
  includeUnavailable?: boolean;
  sort?: "default" | "price_asc" | "price_desc" | "name";
  page?: number;
  perPage?: number;
};

export type CatalogResult = {
  items: Product[];
  total: number;
  availableTotal: number;
  unavailableTotal: number;
  page: number;
  pages: number;
};

/** Filtrele active, ca perechi coloană/valoare — aplicate identic pe rânduri și pe contoare. */
function filterEntries(f: CatalogFilters): [string, string | number][] {
  const out: [string, string | number][] = [];
  if (f.width) out.push(["width", f.width]);
  if (f.aspect) out.push(["aspect", f.aspect]);
  if (f.diameter) out.push(["diameter", f.diameter]);
  if (f.season) out.push(["season", f.season]);
  if (f.brand) out.push(["brand_name", f.brand]);
  return out;
}

const AVAILABLE: StockStatus[] = ["in_stock", "supplier"];

export async function getCatalog(f: CatalogFilters): Promise<CatalogResult> {
  const page = Math.max(1, f.page ?? 1);
  const perPage = f.perPage ?? 30;

  // contoarele se cer separat de rânduri: filtrul implicit ascunde indisponibilele,
  // dar utilizatorul trebuie să vadă câte sunt înainte să activeze comutatorul
  const base = () => {
    let q = db.from("products").select("*", { count: "exact", head: true }).eq("is_active", true).eq("category", "anvelope");
    for (const [col, val] of filterEntries(f)) q = q.eq(col, val);
    return q;
  };
  const [{ count: availableTotal }, { count: unavailableTotal }] = await Promise.all([
    base().in("stock_status", AVAILABLE),
    base().eq("stock_status", "out_of_stock"),
  ]);

  let q = db.from("products").select(PRODUCT_COLS).eq("is_active", true).eq("category", "anvelope");
  for (const [col, val] of filterEntries(f)) q = q.eq(col, val);
  if (!f.includeUnavailable) q = q.in("stock_status", AVAILABLE);

  switch (f.sort) {
    case "price_asc": q = q.order("price_mdl", { ascending: true, nullsFirst: false }).order("id"); break;
    case "price_desc": q = q.order("price_mdl", { ascending: false, nullsFirst: false }).order("id"); break;
    case "name": q = q.order("title_ro").order("id"); break;
    default: q = q.order("stock_status").order("price_mdl", { ascending: true, nullsFirst: false }).order("id");
  }

  const total = (f.includeUnavailable ? (availableTotal ?? 0) + (unavailableTotal ?? 0) : availableTotal) ?? 0;
  const { data } = await q.range((page - 1) * perPage, page * perPage - 1);

  return {
    items: ((data as unknown as Row[]) ?? []).map(withImage),
    total,
    availableTotal: availableTotal ?? 0,
    unavailableTotal: unavailableTotal ?? 0,
    page,
    pages: Math.max(1, Math.ceil(total / perPage)),
  };
}

/* ------------------------------------------------------- selectorul de dimensiune */

export type SizeOption = { value: string; available: number; unavailable: number };

/**
 * Opțiunile pentru selectorul de dimensiune, cu numărători dependente:
 * după ce alegi 205, înălțimile arată doar ce există efectiv cu 205.
 * Citite din vederea materializată, nu prin COUNT(*) pe 15.010 rânduri.
 */
export const getSizeOptions = cache(async (
  level: "width" | "aspect" | "diameter",
  picked: { width?: number; aspect?: number } = {},
): Promise<SizeOption[]> => {
  let q = db.from("products").select(`${level}, stock_status`).eq("is_active", true).eq("category", "anvelope").not(level, "is", null);
  if (picked.width) q = q.eq("width", picked.width);
  if (picked.aspect) q = q.eq("aspect", picked.aspect);
  const { data } = await q.limit(20000);

  const map = new Map<string, SizeOption>();
  for (const r of (data as Record<string, unknown>[]) ?? []) {
    const value = String(r[level]);
    const o = map.get(value) ?? { value, available: 0, unavailable: 0 };
    if (r.stock_status === "out_of_stock") o.unavailable++; else o.available++;
    map.set(value, o);
  }
  return [...map.values()].sort((a, b) => {
    const na = Number(a.value.replace(/\D/g, "")), nb = Number(b.value.replace(/\D/g, ""));
    return Number.isNaN(na) || Number.isNaN(nb) ? a.value.localeCompare(b.value) : na - nb;
  });
});

/* ------------------------------------------------------------- alternative */

/** Aceeași dimensiune exactă, disponibile, cele mai ieftine întâi. */
export async function getAlternatives(p: Product, limit = 6): Promise<Product[]> {
  if (!p.width || !p.diameter) return [];
  let q = db.from("products").select(PRODUCT_COLS)
    .eq("is_active", true).eq("width", p.width).eq("diameter", p.diameter)
    .in("stock_status", AVAILABLE).neq("id", p.id)
    .order("price_mdl", { ascending: true, nullsFirst: false }).limit(limit);
  if (p.aspect) q = q.eq("aspect", p.aspect);
  const { data } = await q;
  return ((data as unknown as Row[]) ?? []).map(withImage);
}

/** Fără potriviri exacte: același diametru, ±10 la lățime, ±5 la înălțime. */
export async function getNearAlternatives(p: Product, limit = 6): Promise<Product[]> {
  if (!p.width || !p.diameter) return [];
  let q = db.from("products").select(PRODUCT_COLS)
    .eq("is_active", true).eq("diameter", p.diameter)
    .gte("width", p.width - 10).lte("width", p.width + 10)
    .in("stock_status", AVAILABLE).neq("id", p.id)
    .order("price_mdl", { ascending: true, nullsFirst: false }).limit(limit);
  if (p.aspect) q = q.gte("aspect", p.aspect - 5).lte("aspect", p.aspect + 5);
  const { data } = await q;
  return ((data as unknown as Row[]) ?? []).map(withImage);
}

/** Recomandările curatoriate de sistemul vechi. */
export async function getRelated(productId: number, limit = 6): Promise<Product[]> {
  const { data: rel } = await db.from("product_related").select("related_product_id").eq("product_id", productId).order("sort_order").limit(limit);
  const ids = (rel ?? []).map((r) => (r as { related_product_id: number }).related_product_id);
  if (!ids.length) return [];
  const { data } = await db.from("products").select(PRODUCT_COLS).in("id", ids).eq("is_active", true);
  return ((data as unknown as Row[]) ?? []).map(withImage);
}

/** Produse disponibile pentru vitrina de pe homepage. */
export async function getShowcase(limit = 8): Promise<Product[]> {
  const { data } = await db.from("products").select(PRODUCT_COLS)
    .eq("is_active", true).eq("category", "anvelope").in("stock_status", AVAILABLE)
    .not("price_mdl", "is", null).order("price_mdl", { ascending: true }).limit(limit);
  return ((data as unknown as Row[]) ?? []).map(withImage);
}

export type LegalPage = {
  id: number; slug_ro: string; slug_ru: string | null;
  title_ro: string; title_ru: string | null;
  body_ro: string | null; body_ru: string | null;
  meta_desc_ro: string | null; meta_desc_ru: string | null;
};

export const getLegalPageBySlug = cache(async (slug: string, locale: Locale): Promise<LegalPage | null> => {
  const col = locale === "ru" ? "slug_ru" : "slug_ro";
  const { data } = await db.from("legal_pages").select("*").or(`${col}.eq.${slug},slug_ro.eq.${slug}`).maybeSingle();
  return (data as LegalPage) ?? null;
});

/* ------------------------------------------------------- resolver de rădăcină */

export type RootMatch =
  | { type: "legal"; slug: string }
  | { type: "service"; slug: string }
  | { type: "brand"; slug: string }
  | { type: "product"; slug: string }
  | null;

/**
 * Produsele, brandurile și serviciile stau toate pe rădăcină.
 * Ordinea de rezolvare e fixă: serviciu -> brand -> produs -> 404.
 */
export const resolveRootSlug = cache(async (slug: string, locale: Locale): Promise<RootMatch> => {
  const col = locale === "ru" ? "slug_ru" : "slug_ro";
  const [legal, svc, brand, product] = await Promise.all([
    db.from("legal_pages").select("id").or(`${col}.eq.${slug},slug_ro.eq.${slug}`).limit(1),
    db.from("services").select("id").or(`${col}.eq.${slug},slug_ro.eq.${slug}`).limit(1),
    db.from("brands").select("id").or(`${col}.eq.${slug},slug_ro.eq.${slug}`).limit(1),
    db.from("products").select("id").or(`${col}.eq.${slug},slug_ro.eq.${slug}`).limit(1),
  ]);
  if (legal.data?.length) return { type: "legal", slug };
  if (svc.data?.length) return { type: "service", slug };
  if (brand.data?.length) return { type: "brand", slug };
  if (product.data?.length) return { type: "product", slug };
  return null;
});

/* ------------------------------------------- facete de sezon si de marca */

export type { FacetOption, SeasonBreakdown, SizeFacets } from "@/lib/types";

/**
 * Pașii 4 și 5 ai selectorului: sezonul și marca, numărate PE dimensiunea deja
 * aleasă. Nu se pot preîncărca în `size-tree.ts` — ar însemna 134 de mărci ×
 * 3 sezoane pentru fiecare dintre cele ~900 de dimensiuni, adică un fișier mai
 * mare decât catalogul. O dimensiune concretă are sub 400 de rânduri, deci
 * numărătoarea se face la cerere și se ține în cache o oră.
 *
 * `bySeason` există ca să nu mintă contorul: după ce alegi „iarnă", numărul de
 * lângă fiecare marcă trebuie să fie numărul de anvelope de iarnă ale mărcii,
 * nu totalul ei pe dimensiune.
 */
export const getSizeFacets = cache(async (
  picked: { width?: number; aspect?: number; diameter?: string } = {},
): Promise<SizeFacets> => {
  let q = db
    .from("products")
    .select("season, brand_id, brand_name, stock_status")
    .eq("is_active", true)
    .eq("category", "anvelope");
  if (picked.width) q = q.eq("width", picked.width);
  if (picked.aspect) q = q.eq("aspect", picked.aspect);
  if (picked.diameter) q = q.eq("diameter", picked.diameter);

  const [{ data }, brands] = await Promise.all([q.limit(20000), getBrands()]);
  const slugById = new Map(brands.map((b) => [b.id, b.slug_ro]));

  type Row = { season: Season | null; brand_id: number | null; brand_name: string | null; stock_status: StockStatus };
  const seasons = new Map<string, FacetOption>();
  const brandFacets = new Map<string, FacetOption>();

  for (const r of ((data as unknown as Row[]) ?? [])) {
    const available = r.stock_status !== "out_of_stock";
    // Sezonul necunoscut (5 produse, vezi TODO-CRISTIAN.md §1) nu devine opțiune:
    // n-ar filtra nimic util, doar ar adăuga un rând gol în selector.
    if (r.season) bump(seasons, r.season, r.season, r.season, available);
    if (r.brand_name) {
      const slug = (r.brand_id != null && slugById.get(r.brand_id)) || slugify(r.brand_name);
      bump(brandFacets, r.brand_name, slug, r.season, available);
    }
  }

  // Sezoanele in ordine fixa, ca sa nu-si schimbe locul de la o dimensiune la
  // alta. Marcile ALFABETIC, nu dupa contor: cine cauta „Michelin" il cauta
  // acolo unde ar fi intr-o lista, nu unde-l pune stocul de azi.
  const ORDER: Season[] = ["vara", "all_season", "iarna"];
  return {
    seasons: [...seasons.values()].sort(
      (a, b) => ORDER.indexOf(a.value as Season) - ORDER.indexOf(b.value as Season),
    ),
    brands: [...brandFacets.values()].sort((a, b) => a.value.localeCompare(b.value, "ro")),
  };
});

function bump(
  map: Map<string, FacetOption>,
  value: string,
  slug: string,
  season: Season | null,
  available: boolean,
) {
  const o = map.get(value) ?? { value, slug, available: 0, total: 0, bySeason: {} as SeasonBreakdown };
  o.total++;
  if (available) o.available++;
  if (season) {
    const cell = o.bySeason[season] ?? [0, 0];
    o.bySeason[season] = [cell[0] + (available ? 1 : 0), cell[1] + 1];
  }
  map.set(value, o);
}

/** Rezervă pentru produsele fără `brand_id` — aceeași regulă ca la seed. */
const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Contoarele celor trei plăci de sezon de pe pagina principală. */
export const getSeasonCounts = cache(async (): Promise<Record<Season, number>> => {
  const seasons: Season[] = ["vara", "iarna", "all_season"];
  const counts = await Promise.all(
    seasons.map((s) =>
      db.from("products").select("*", { count: "exact", head: true })
        .eq("is_active", true).eq("category", "anvelope").eq("season", s)
        .in("stock_status", AVAILABLE)
        .then(({ count }) => count ?? 0),
    ),
  );
  return Object.fromEntries(seasons.map((s, i) => [s, counts[i]])) as Record<Season, number>;
});
