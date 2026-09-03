export type Locale = "ro" | "ru";
export type Season = "vara" | "iarna" | "all_season";
export type StockStatus = "in_stock" | "supplier" | "out_of_stock";
export type SizeSystem = "metric" | "imperial";

export type Product = {
  id: number;
  legacy_product_id: number;
  slug_ro: string;
  slug_ru: string | null;
  category: "anvelope" | "tpms";
  brand_id: number | null;
  brand_name: string | null;
  model: string | null;
  size_system: SizeSystem | null;
  width: number | null;
  aspect: number | null;
  overall_diameter_in: number | null;
  section_width_in: number | null;
  diameter: string | null;
  size_raw: string | null;
  load_index: string | null;
  speed_index: string | null;
  season: Season | null;
  is_xl: boolean;
  is_runflat: boolean;
  is_commercial: boolean;
  price_mdl: number | null;
  stock_status: StockStatus;
  title_ro: string;
  title_ru: string | null;
  description_ro: string | null;
  description_ru: string | null;
  meta_title_ro: string | null;
  meta_title_ru: string | null;
  meta_desc_ro: string | null;
  meta_desc_ru: string | null;
  image_url?: string | null;
  /**
   * Toate fotografiile produsului, in ordinea din `product_images`. Prima e
   * aceeasi cu `image_url`. Produsele vechi au exact una; cele importate din
   * pandashop au pana la patru.
   */
  images?: { url: string; alt: string | null; alt_ru: string | null }[];
  /** Completate din `brands` la citire, nu coloane pe `products`. */
  brand_logo_url?: string | null;
  brand_logo_on_dark?: boolean;
  brand_logo_ratio?: number | null;
  brand_slug?: string | null;
  brand_slug_ru?: string | null;
};

/** [disponibile, total] pe sezon, ca să se poată încrucișa sezonul cu marca. */
export type SeasonBreakdown = Partial<Record<Season, [number, number]>>;

/** O opțiune din pasul 4 sau 5 al selectorului, cu contoarele ei reale. */
export type FacetOption = {
  value: string;
  /** Slug-ul de rută pentru mărci; pentru sezoane, valoarea enum. */
  slug: string;
  available: number;
  total: number;
  bySeason: SeasonBreakdown;
};

export type SizeFacets = { seasons: FacetOption[]; brands: FacetOption[] };

export type Brand = {
  id: number;
  slug_ro: string;
  slug_ru: string | null;
  name: string;
  /** URL public complet către logo, sau NULL cât timp nu a fost încărcat. */
  logo_url: string | null;
  /** Logo desenat în alb: se randează pe placă închisă. */
  logo_on_dark: boolean;
  /** Lățime/înălțime a fișierului, pentru lățimea benzii. */
  logo_ratio: number | null;
  product_count: number;
  meta_title_ro: string | null;
  meta_title_ru: string | null;
  meta_desc_ro: string | null;
  meta_desc_ru: string | null;
};

export type Service = {
  id: number;
  slug_ro: string;
  slug_ru: string | null;
  title_ro: string;
  title_ru: string | null;
  body_ro: string | null;
  body_ru: string | null;
  image_url: string | null;
  price_from_mdl: number | null;
  meta_title_ro: string | null;
  meta_title_ru: string | null;
  meta_desc_ro: string | null;
  meta_desc_ru: string | null;
};

export type Settings = {
  phone_display: string;
  phone_e164: string;
  email: string;
  address: string;
  city: string;
  opening_hours: { mon_sat: string; sun: string | null; note?: string };
  maps_url: string;
  lat: number;
  lng: number;
  warranty_years: number;
  credit_badge_ro: string | null;
  credit_badge_ru: string | null;
};

/** Titlul, slug-ul și meta-urile în limba cerută, cu RO ca rezervă. */
export const t = {
  title: (p: Pick<Product, "title_ro" | "title_ru">, l: Locale) => (l === "ru" ? p.title_ru || p.title_ro : p.title_ro),
  slug: (p: Pick<Product, "slug_ro" | "slug_ru">, l: Locale) => (l === "ru" ? p.slug_ru || p.slug_ro : p.slug_ro),
  metaTitle: (p: Pick<Product, "meta_title_ro" | "meta_title_ru">, l: Locale) =>
    (l === "ru" ? p.meta_title_ru || p.meta_title_ro : p.meta_title_ro) ?? null,
  metaDesc: (p: Pick<Product, "meta_desc_ro" | "meta_desc_ru">, l: Locale) =>
    (l === "ru" ? p.meta_desc_ru || p.meta_desc_ro : p.meta_desc_ro) ?? null,
};
