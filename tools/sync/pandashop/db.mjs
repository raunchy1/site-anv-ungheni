/**
 * Citirea catalogului nostru, prin REST-ul Supabase.
 *
 * DOAR CITIRE. Fișierul ăsta n-are nicio funcție de scriere, intenționat:
 * rularea de la Gate 1 nu trebuie să poată atinge producția nici din greșeală.
 */
const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL_BASE || !KEY) {
  throw new Error('lipsesc NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY (rulează cu --env-file=.env.local)');
}

async function page(table, select, from, to, extra = '') {
  const res = await fetch(`${URL_BASE}/rest/v1/${table}?select=${select}${extra}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Range: `${from}-${to}`, 'Range-Unit': 'items' },
  });
  if (!res.ok) throw new Error(`${table}: HTTP ${res.status} ${await res.text()}`);
  return res.json();
}

/** Toate rândurile, în felii de 1000 (limita implicită PostgREST). */
export async function readAll(table, select, extra = '') {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const rows = await page(table, select, from, from + 999, extra);
    out.push(...rows);
    if (rows.length < 1000) return out;
  }
}

export const readProducts = () => readAll(
  'products',
  'id,legacy_product_id,slug_ro,brand_id,brand_name,model,width,aspect,diameter,size_raw,load_index,speed_index,season,is_xl,is_runflat,price_mdl,price_locked,stock_status,title_ro,category,is_active',
);

export const readBrands = () => readAll('brands', 'id,name,slug_ro,is_active');
