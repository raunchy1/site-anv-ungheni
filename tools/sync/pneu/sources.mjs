/**
 * Scrierea în `product_sources` — tabelul din migrarea 0030.
 *
 * DE CE UN MODUL SEPARAT, și nu `pandashop/db-write.mjs`. Lista albă de acolo
 * nu conține `product_sources`, iar fișierul rulează în producție în fiecare
 * noapte pentru pandashop. Regula 3 a planului spune limpede: nu se modifică pe
 * loc fișierele comune. Modulul ăsta are propria listă albă, cu exact un tabel
 * în ea, deci nu poate atinge nimic altceva — nici `products`, nici prețuri.
 *
 * (Locul curat pe termen lung e tot lista albă comună. Când se adaugă și a doua
 * sursă nouă, merită mutat acolo, o dată, cu ochii pe pandashop.)
 *
 * `cost_mdl` RĂMÂNE NULL. Coloana există și API-ul lor chiar ne-ar da ce plătesc
 * ei pe fiecare anvelopă — `primeCost`, public, fără autentificare. Nu e al
 * nostru și nu-l stocăm; dacă vreodată o să avem un preț de achiziție negociat
 * cu ei, acela e ce se scrie aici.
 */
const PERMISE = new Set(['product_sources']);

function conexiune() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('lipsesc NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY (rulează cu --env-file=.env.local)');
  return { url, key };
}

/**
 * Leagă produse de o sursă. Reluabil: cheia primară e (product_id, source), iar
 * un rând care există se actualizează — altfel o rulare întreruptă la jumătate
 * n-ar mai putea fi repornită fără să pice pe 23505.
 *
 * @param {{product_id:number, source:string, external_id:string, available:boolean}[]} randuri
 */
export async function scrieSurse(randuri, { chunk = 500 } = {}) {
  if (!PERMISE.has('product_sources')) throw new Error('tabel nepermis');
  if (randuri.length === 0) return 0;
  const { url, key } = conexiune();

  const acum = new Date().toISOString();
  let scrise = 0;
  for (let i = 0; i < randuri.length; i += chunk) {
    const lot = randuri.slice(i, i + chunk).map((r) => ({
      product_id: r.product_id,
      source: r.source,
      external_id: String(r.external_id),
      available: Boolean(r.available),
      cost_mdl: null,
      seen_at: acum,
    }));
    const res = await fetch(`${url}/rest/v1/product_sources?on_conflict=product_id,source`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(lot),
    });
    if (!res.ok) throw new Error(`product_sources: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
    scrise += lot.length;
  }
  return scrise;
}

/**
 * Ce produse are deja sursa asta legată. Se citește înainte de scriere ca să
 * știm ce e nou și ce doar se reconfirmă — nu ca să sărim scrierea, pentru că
 * `available` și `seen_at` se schimbă de la o rulare la alta.
 */
export async function citesteSursa(sursa) {
  const { url, key } = conexiune();
  const out = new Map();
  for (let from = 0; ; from += 1000) {
    const res = await fetch(
      `${url}/rest/v1/product_sources?select=product_id,external_id,available&source=eq.${encodeURIComponent(sursa)}`,
      { headers: { apikey: key, Authorization: `Bearer ${key}`, Range: `${from}-${from + 999}`, 'Range-Unit': 'items' } },
    );
    if (!res.ok) throw new Error(`product_sources: HTTP ${res.status} ${await res.text()}`);
    const randuri = await res.json();
    for (const r of randuri) out.set(String(r.external_id), r);
    if (randuri.length < 1000) return out;
  }
}
