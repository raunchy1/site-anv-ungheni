import type { Season } from "./types";

/**
 * Filtrele stau în cale, nu în query: `/catalog-anvelope/latime_205/sezon_iarna`.
 * Sunt 190 de rute indexate de ani de zile pe site-ul vechi și se păstrează
 * identic — vezi ARCHITECTURE.md §3.1. Segmentele sunt aceleași în ambele limbi;
 * doar prefixul categoriei diferă (`/catalog-anvelope` vs `/ru/katalog-shin`).
 */
export type CatalogSort = "price_asc" | "price_desc" | "name";

export type ParsedFilters = {
  width?: number;
  aspect?: number;
  diameter?: string;
  season?: Season;
  brand?: string;
  onlyAvailable?: boolean;
  /**
   * Sortarea, pagina și „arată și indisponibilele" stau tot în cale, nu în
   * query. Nu e cosmetică: cât timp catalogul citea `?pagina`, Next îl trata ca
   * rută dinamică — fără cache la margine, cu un drum până la bază la fiecare
   * clic. În cale, fiecare combinație e o rută normală, pre-randată la prima
   * cerere și servită din CDN după aceea.
   */
  sort?: CatalogSort;
  page?: number;
  includeUnavailable?: boolean;
  unknown: string[];
};

/** Numele din URL pentru sortare. Latinești, ca restul segmentelor. */
const SORT_SEGMENT: Record<string, CatalogSort> = {
  "pret-asc": "price_asc", "pret-desc": "price_desc", nume: "name",
};
const SORT_TO_SEGMENT: Record<CatalogSort, string> = {
  price_asc: "pret-asc", price_desc: "pret-desc", name: "nume",
};

const SEASON_SEGMENT: Record<string, Season> = {
  vara: "vara", iarna: "iarna", "all-season": "all_season", all_season: "all_season",
};

export function parseFilterSegments(segments: string[] = []): ParsedFilters {
  const out: ParsedFilters = { unknown: [] };
  for (const raw of segments) {
    const seg = decodeURIComponent(raw).toLowerCase();
    if (seg === "nalichie") { out.onlyAvailable = true; continue; }
    if (seg === "indisponibile") { out.includeUnavailable = true; continue; }
    const [key, ...rest] = seg.split("_");
    const value = rest.join("_");
    if (!value) { out.unknown.push(seg); continue; }
    switch (key) {
      case "latime": out.width = Number(value); break;
      case "inaltime": out.aspect = Number(value); break;
      case "diametru": out.diameter = value.toUpperCase(); break;
      case "sezon": out.season = SEASON_SEGMENT[value]; break;
      case "marca": out.brand = value; break;
      case "sortare": {
        const v = SORT_SEGMENT[value];
        if (v) out.sort = v; else out.unknown.push(seg);
        break;
      }
      case "pagina": {
        const n = Number(value);
        /* Pagina 1 nu are segment: ar da doua URL-uri pentru acelasi continut.
           `pagina_1` nu e insa o greseala, ci o adresa veche — se ignora aici si
           se rescrie in canonic de catre ruta, care redirectioneaza 308. */
        if (Number.isInteger(n) && n > 1) out.page = n;
        else if (n !== 1) out.unknown.push(seg);
        break;
      }
      default: out.unknown.push(seg);
    }
  }
  if (out.width != null && Number.isNaN(out.width)) delete out.width;
  if (out.aspect != null && Number.isNaN(out.aspect)) delete out.aspect;
  return out;
}

/** Segmentele canonice, în ordine fixă, ca aceeași selecție să dea mereu același URL. */
export function buildFilterSegments(f: Omit<ParsedFilters, "unknown">): string[] {
  const out: string[] = [];
  if (f.width) out.push(`latime_${f.width}`);
  if (f.aspect) out.push(`inaltime_${f.aspect}`);
  if (f.diameter) out.push(`diametru_${f.diameter.toLowerCase()}`);
  if (f.season) out.push(`sezon_${f.season === "all_season" ? "all-season" : f.season}`);
  if (f.brand) out.push(`marca_${f.brand}`);
  if (f.onlyAvailable) out.push("nalichie");
  if (f.includeUnavailable) out.push("indisponibile");
  if (f.sort) out.push(`sortare_${SORT_TO_SEGMENT[f.sort]}`);
  if (f.page && f.page > 1) out.push(`pagina_${f.page}`);
  return out;
}

/**
 * Segmentele fără sortare și fără pagină: adresa canonică a unei selecții.
 * O listă sortată după preț e aceeași marfă în altă ordine, nu o pagină nouă.
 */
export function canonicalSegments(f: Omit<ParsedFilters, "unknown">): string[] {
  return buildFilterSegments({ ...f, sort: undefined, page: undefined, includeUnavailable: undefined });
}

export const activeFilterCount = (f: ParsedFilters): number =>
  [f.width, f.aspect, f.diameter, f.season, f.brand, f.onlyAvailable].filter(Boolean).length;

/**
 * Segmentele primite sunt EXACT forma canonica?
 *
 * `/catalog-anvelope/inaltime_55/latime_205` arata aceeasi marfa ca
 * `/catalog-anvelope/latime_205/inaltime_55`, iar `pagina_1` o arata inca o
 * data. Fiecare varianta era o randare noua si o intrare noua in cache; pentru
 * un robot, un catalog de cateva sute de rute devenea unul de cateva mii.
 * Ruta compara ce a primit cu ce ar fi construit ea si, daca difera,
 * redirectioneaza definitiv spre forma unica.
 */
export function isCanonicalPath(segments: string[], f: ParsedFilters): boolean {
  const canonical = buildFilterSegments(f);
  return (
    segments.length === canonical.length &&
    segments.every((s, i) => decodeURIComponent(s).toLowerCase() === canonical[i])
  );
}
