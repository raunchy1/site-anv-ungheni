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

const PERMISE = new Set(['pandashop_seen', 'sync_quarantine', 'import_runs']);

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
