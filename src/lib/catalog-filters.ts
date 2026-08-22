import type { Season } from "./types";

/**
 * Filtrele stau în cale, nu în query: `/catalog-anvelope/latime_205/sezon_iarna`.
 * Sunt 190 de rute indexate de ani de zile pe site-ul vechi și se păstrează
 * identic — vezi ARCHITECTURE.md §3.1. Segmentele sunt aceleași în ambele limbi;
 * doar prefixul categoriei diferă (`/catalog-anvelope` vs `/ru/katalog-shin`).
 */
export type ParsedFilters = {
  width?: number;
  aspect?: number;
  diameter?: string;
  season?: Season;
  brand?: string;
  onlyAvailable?: boolean;
  unknown: string[];
};

const SEASON_SEGMENT: Record<string, Season> = {
  vara: "vara", iarna: "iarna", "all-season": "all_season", all_season: "all_season",
};

export function parseFilterSegments(segments: string[] = []): ParsedFilters {
  const out: ParsedFilters = { unknown: [] };
  for (const raw of segments) {
    const seg = decodeURIComponent(raw).toLowerCase();
    if (seg === "nalichie") { out.onlyAvailable = true; continue; }
    const [key, ...rest] = seg.split("_");
    const value = rest.join("_");
    if (!value) { out.unknown.push(seg); continue; }
    switch (key) {
      case "latime": out.width = Number(value); break;
      case "inaltime": out.aspect = Number(value); break;
      case "diametru": out.diameter = value.toUpperCase(); break;
      case "sezon": out.season = SEASON_SEGMENT[value]; break;
      case "marca": out.brand = value; break;
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
  return out;
}

export const activeFilterCount = (f: ParsedFilters): number =>
  [f.width, f.aspect, f.diameter, f.season, f.brand, f.onlyAvailable].filter(Boolean).length;
