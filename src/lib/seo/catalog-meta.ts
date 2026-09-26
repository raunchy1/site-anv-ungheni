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
 * Titlul paginii, în ordinea în care se caută: sezonul ÎNAINTEA dimensiunii
 * („anvelope de iarnă 205/55 R16"), apoi prețul de pornire și Moldova.
 *
 * De ce așa. Pe 27 septembrie 2026, la „anvelope 205/55 R16 iarna Moldova
 * pret", primele rezultate aveau toate titlul construit pe tiparul ăsta —
 * sezon, dimensiune, „preț", țara sau Chișinăul. Titlul nostru era doar
 * „Anvelope 205/55 R16 de iarnă": nu spunea nici prețul, nici unde livrăm.
 *
 * Prețul intră doar dacă îl avem: e prețul minim al selecției, aceeași cifră pe
 * care o scrie `CatalogIntro` pe pagină. Google taie titlul pe la 60 de
 * caractere; partea importantă e la început, iar șablonul din layout adaugă
 * numele site-ului la coadă, unde tăietura nu strică nimic.
 */
export function titluCatalogSeo(
  f: ParsedFilters, numeMarca: string | undefined, locale: Locale, implicit: string, pretMin?: number | null,
): string {
  const ru = locale === "ru";
  const eticheta = etichetaFiltru({ ...f, season: undefined }, numeMarca, locale);
  const sezon = f.season ? (ru ? SEZON[f.season].ru : SEZON[f.season].ro) : null;
  if (!eticheta && !sezon) return implicit;

  const cap = ru
    ? [sezon ? `${sezon[0].toUpperCase()}${sezon.slice(1)} шины` : "Шины", eticheta].filter(Boolean).join(" ")
    : ["Anvelope", sezon, eticheta].filter(Boolean).join(" ");
  const pret = pretMin != null ? pretFormat(pretMin) : null;

  return ru
    ? `${cap} — ${pret ? `цена от ${pret} MDL, ` : "цены, "}доставка по Молдове`
    : `${cap} — ${pret ? `preț de la ${pret} MDL, ` : "prețuri, "}livrare în Moldova`;
}

/** 1290 -> „1.290" / „1 290". Fără dependența de `format.ts`, care trage Supabase. */
function pretFormat(n: number) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Descrierea. Diferită pe fiecare selecție, pentru că numește selecția — și
 * pentru că, fără ea, toate rutele de filtru arată la fel în rezultate.
 */
export function descriereCatalogSeo(
  f: ParsedFilters, numeMarca: string | undefined, locale: Locale, pretMin?: number | null,
): string {
  const ru = locale === "ru";
  const eticheta = etichetaFiltru(f, numeMarca, locale);

  if (!eticheta) {
    return ru
      ? "Каталог шин: летние, зимние и всесезонные, все размеры. Цены в MDL, наличие онлайн, доставка по всей Молдове за 1–3 дня: Кишинёв, Бельцы, Кагул, Унгены и все районы."
      : "Catalog de anvelope: vară, iarnă și all season, toate dimensiunile. Prețuri în MDL, disponibilitate în timp real, livrare în toată Moldova în 1–3 zile: Chișinău, Bălți, Cahul, Ungheni și toate raioanele.";
  }

  const dim = dimensiuneCompleta(f);
  const ce = ru ? `Шины ${eticheta}` : `Anvelope ${eticheta}`;
  const pret = pretMin != null ? pretFormat(pretMin) : null;

  return ru
    ? `${ce} в наличии${pret ? ` от ${pret} MDL за штуку` : ""}: цены, характеристики и реальное наличие. Доставка по всей Молдове за 1–3 дня — Кишинёв, Бельцы, Кагул и все районы; шиномонтаж в Унгенах.${dim ? ` Все бренды в размере ${dim}.` : ""}`
    : `${ce} în stoc${pret ? ` de la ${pret} MDL bucata` : ""}: prețuri, specificații și disponibilitate reală. Livrare în toată Moldova în 1–3 zile — Chișinău, Bălți, Cahul și toate raioanele; montaj în Ungheni.${dim ? ` Toate mărcile pe dimensiunea ${dim}.` : ""}`;
}
