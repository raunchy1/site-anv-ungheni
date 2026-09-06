/**
 * TITLURILE ȘI DESCRIERILE PAGINILOR DE CATALOG.
 *
 * Problema pe care o rezolvă fișierul ăsta, măsurată pe site-ul viu: toate cele
 * câteva sute de rute de filtru aveau exact aceeași `<meta name="description">`
 * — cea a paginii principale. Pentru un motor de căutare, câteva sute de pagini
 * cu aceeași descriere sunt câteva sute de pagini fără descriere: își alege
 * singur o propoziție din pagină, de obicei una din bara de filtre.
 *
 * Regula după care sunt scrise: descrierea conține ce caută omul (dimensiunea
 * sau marca), ce vrea să afle înainte de clic (preț, disponibilitate) și ce ne
 * deosebește (livrare în toată Moldova, montaj în Ungheni). Nicio afirmație
 * care nu e deja pe site.
 */
import type { ParsedFilters } from "@/lib/catalog-filters";
import type { Locale } from "@/lib/types";

const SEZON: Record<string, { ro: string; ru: string }> = {
  vara: { ro: "de vară", ru: "летние" },
  iarna: { ro: "de iarnă", ru: "зимние" },
  all_season: { ro: "all season", ru: "всесезонные" },
};

/** Dimensiunea completă, dacă e completă. „205/55 R16". */
export function dimensiuneCompleta(f: ParsedFilters): string | null {
  return f.width && f.aspect && f.diameter ? `${f.width}/${f.aspect} ${f.diameter}` : null;
}

/**
 * Eticheta selecției, în limba paginii: „205/55 R16", „Michelin", „de iarnă",
 * „R16", „205/55 R16 de iarnă". `null` la catalogul nefiltrat.
 */
export function etichetaFiltru(f: ParsedFilters, numeMarca: string | undefined, locale: Locale): string | null {
  const ru = locale === "ru";
  const parti: string[] = [];

  const dim = dimensiuneCompleta(f);
  if (dim) parti.push(dim);
  else if (f.width && f.aspect) parti.push(`${f.width}/${f.aspect}`);
  else if (f.width) parti.push(ru ? `шириной ${f.width}` : `cu lățimea ${f.width}`);
  else if (f.diameter) parti.push(f.diameter);

  if (numeMarca) parti.unshift(numeMarca);
  if (f.season) parti.push(ru ? SEZON[f.season].ru : SEZON[f.season].ro);

  return parti.length ? parti.join(" ") : null;
}

/**
 * Titlul paginii. Scurt: șablonul din layout îi adaugă „· anvelope-ungheni.md",
 * iar Google taie pe la 60 de caractere, cu tot cu numele site-ului.
 */
export function titluCatalogSeo(f: ParsedFilters, numeMarca: string | undefined, locale: Locale, implicit: string): string {
  const eticheta = etichetaFiltru(f, numeMarca, locale);
  if (!eticheta) return implicit;
  return locale === "ru" ? `Шины ${eticheta}` : `Anvelope ${eticheta}`;
}

/**
 * Descrierea. Diferită pe fiecare selecție, pentru că numește selecția — și
 * pentru că, fără ea, toate rutele de filtru arată la fel în rezultate.
 */
export function descriereCatalogSeo(f: ParsedFilters, numeMarca: string | undefined, locale: Locale): string {
  const ru = locale === "ru";
  const eticheta = etichetaFiltru(f, numeMarca, locale);

  if (!eticheta) {
    return ru
      ? "Каталог шин: летние, зимние и всесезонные, все размеры. Цены в MDL, наличие онлайн, доставка по всей Молдове за 1–3 дня, шиномонтаж в Унгенах."
      : "Catalog de anvelope: vară, iarnă și all season, toate dimensiunile. Prețuri în MDL, disponibilitate în timp real, livrare în toată Moldova în 1–3 zile, montaj în Ungheni.";
  }

  const dim = dimensiuneCompleta(f);
  const ce = ru ? `Шины ${eticheta}` : `Anvelope ${eticheta}`;

  return ru
    ? `${ce} в наличии: цены в MDL, характеристики и наличие на складе. Доставка по всей Молдове за 1–3 дня, шиномонтаж и балансировка в мастерской в Унгенах.${dim ? ` Все бренды в размере ${dim}.` : ""}`
    : `${ce} în stoc: prețuri în MDL, specificații și disponibilitate reală. Livrare în toată Moldova în 1–3 zile, montaj și echilibrare în atelierul din Ungheni.${dim ? ` Toate mărcile pe dimensiunea ${dim}.` : ""}`;
}
