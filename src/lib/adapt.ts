import type { Product as UiProduct } from "@/lib/sample-products";
import type { Product as DbProduct } from "@/lib/types";

/**
 * Componentele de UI au fost scrise pe forma din `sample-products` (camelCase),
 * baza vorbește snake_case. Un singur adaptor, aici, în loc de două convenții
 * amestecate prin pagini.
 */
export function toUiProduct(p: DbProduct): UiProduct {
  return {
    slug: p.slug_ro,
    slugRu: p.slug_ru ?? p.slug_ro,
    legacyId: p.legacy_product_id,
    brand: p.brand_name,
    brandLogo: p.brand_logo_url ?? null,
    brandSlug: p.brand_slug ?? null,
    title: p.title_ro,
    titleRu: p.title_ru ?? p.title_ro,
    price: p.price_mdl == null ? null : Number(p.price_mdl),
    stock: p.stock_status,
    season: p.season,
    sizeSystem: p.size_system,
    width: p.width,
    aspect: p.aspect,
    diameter: p.diameter,
    sizeRaw: p.size_raw,
    loadIndex: p.load_index,
    speedIndex: p.speed_index,
    image: p.image_url ?? null,
    isXl: p.is_xl,
    isRunflat: p.is_runflat,
    isCommercial: p.is_commercial,
  };
}
