/**
 * Forma unei adrese de catalog, așa cum o construiește serverul și o consumă
 * `Link`-ul și router-ul lui next-intl.
 *
 * Există ca tip separat pentru că trece granița server → client: componentele
 * de control (sortare, comutatorul de indisponibile) primesc adresele gata
 * făcute, în loc să reconstruiască URL-ul din bucăți în browser. Un singur loc
 * unde se decide cum arată o adresă de catalog.
 */
export type CatalogHref =
  | { pathname: "/catalog" }
  | { pathname: "/catalog/[...filtre]"; params: { filtre: string[] } };
