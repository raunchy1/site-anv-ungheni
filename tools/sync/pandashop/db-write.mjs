/**
 * Scrierea. Separată de `db.mjs`, care rămâne strict de citire.
 *
 * TABELELE PERMISE SUNT O LISTĂ ALBĂ, verificată la fiecare apel. `products` nu e
 * în ea și nu va fi până la Gate B: până atunci, o greșeală de tastare într-un
 * nume de tabel nu poate ajunge în catalog, pentru că funcția refuză înainte să
 * atingă rețeaua. Nu e paranoia — e singurul lucru care stă între un script de
 * sincronizare și 15.008 produse pe care nu vrem să le atingem.
 */
/* Citite la apel, nu la încărcarea modulului: altfel orice fișier care importă
   modulul ăsta — inclusiv testele, care n-au nevoie de bază — moare la `import`. */
function conexiune() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('lipsesc NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY (rulează cu --env-file=.env.local)');
  return { url, key };
}

/*
 * `products` și `product_images` au intrat în listă la Gate B, când importul a
 * fost aprobat. Până atunci lipseau intenționat, ca o greșeală de tastare într-un
 * nume de tabel să nu poată ajunge în catalog. Scrierea în ele se face DOAR prin
 * `import.mjs`, care inserează rânduri noi; nu există în tot directorul ăsta
 * nicio operație de UPDATE sau DELETE pe produse existente.
 */
/*
 * `brands` a intrat la Gate D. Regula „un brand nu se creeaza automat" ramane in
 * picioare acolo unde conteaza — importul obisnuit trimite in carantina orice
 * brand necunoscut — dar recuperarea catalogului are nevoie sa poata crea marca
 * atunci cand omul o cere explicit (`backfill.mjs --branduri`) si dupa ce a vazut
 * lista tiparita. Fara asta, 22 de anvelope Comforser si Valleystone n-ar fi
 * putut intra niciodata in catalog, desi sunt marci reale.
 *
 * `update` ramane interzis si pe `brands`: se pot adauga marci, nu redenumi.
 */
const PERMISE = new Set(['pandashop_seen', 'sync_quarantine', 'import_runs', 'products', 'product_images', 'brands']);

function verifica(table) {
  if (!PERMISE.has(table)) {
    throw new Error(`scrierea în „${table}" nu e permisă din modulul ăsta (permise: ${[...PERMISE].join(', ')})`);
  }
}

/** Inserare în loturi. `onConflict` face operația reluabilă fără duplicate. */
export async function insert(table, rows, { onConflict = null, chunk = 500 } = {}) {
  verifica(table);
  const { url: URL_BASE, key: KEY } = conexiune();
  let scrise = 0;
  for (let i = 0; i < rows.length; i += chunk) {
    const lot = rows.slice(i, i + chunk);
    const q = onConflict ? `?on_conflict=${onConflict}` : '';
    const res = await fetch(`${URL_BASE}/rest/v1/${table}${q}`, {
      method: 'POST',
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        'Content-Type': 'application/json',
        Prefer: onConflict ? 'resolution=ignore-duplicates,return=minimal' : 'return=minimal',
      },
      body: JSON.stringify(lot),
    });
    if (!res.ok) throw new Error(`${table}: HTTP ${res.status} ${await res.text()}`);
    scrise += lot.length;
  }
  return scrise;
}

/** Actualizare țintită, pe o singură cheie. Folosită doar pe `pandashop_seen`. */
export async function update(table, match, patch) {
  verifica(table);
  if (table === 'products' || table === 'product_images' || table === 'brands') {
    throw new Error(`update pe „${table}" nu e permis: sincronizarea adaugă, nu modifică`);
  }
  const { url, key } = conexiune();
  const q = Object.entries(match).map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`).join('&');
  const res = await fetch(`${url}/rest/v1/${table}?${q}`, {
    method: 'PATCH',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`${table}: HTTP ${res.status} ${await res.text()}`);
}

/** Inserare care întoarce rândurile create — ne trebuie `id`-ul produsului nou. */
export async function insertReturning(table, rows) {
  verifica(table);
  const { url, key } = conexiune();
  const res = await fetch(`${url}/rest/v1/${table}`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`${table}: HTTP ${res.status} ${await res.text()}`);
  return res.json();
}
