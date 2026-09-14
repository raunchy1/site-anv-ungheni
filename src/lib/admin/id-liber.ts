/**
 * Copie tipizată a algoritmului din `tools/sync/pneuexpert/import.mjs` → `idLiber`.
 * Nu importăm fișierul sync: trage dependențe de pipeline (fs, db, snapshot).
 * Algoritmul e pur și trebuie să rămână identic — spațiul de ID-uri negative e comun.
 *
 * `legacy_product_id` e int NOT NULL UNIQUE (moștenire OpenCart). Produsele fără
 * ID OpenCart primesc valori negative derivate dintr-un text-sămânță.
 */
export function idLiber(text: string, folosite: Set<number>): number {
  let h = 0;
  for (const c of String(text)) h = (h * 31 + c.charCodeAt(0)) % 2_000_000_000;
  let v = -Math.abs(h || 1);
  while (folosite.has(v)) v = v === -2_000_000_000 ? -1 : v - 1;
  folosite.add(v);
  return v;
}
