/**
 * Blocajul de execuție și pulsul, peste funcțiile din migrarea 0016.
 *
 * Lacătul e un rând cu termen de expirare, nu `pg_advisory_lock`: peste
 * PostgREST fiecare cerere e altă sesiune, deci un lacăt de sesiune ar cădea
 * imediat. Cu expirare, o rulare care moare fără să elibereze nu blochează
 * sistemul pe veci — se deblochează singură după 20 de minute.
 */
function conexiune() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('lipsesc variabilele Supabase');
  return { url, key };
}

async function rpc(fn, args = {}) {
  const { url, key } = conexiune();
  const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`${fn}: HTTP ${res.status} ${await res.text()}`);
  /* `sync_lock_release` întoarce void, deci corpul e gol — `res.json()` ar arunca
     „Unexpected end of JSON input" fix pe calea de eliberare a lacătului, adică
     exact acolo unde o excepție lasă sistemul blocat 20 de minute. */
  const corp = await res.text();
  return corp ? JSON.parse(corp) : null;
}

export const iaLacatul = (cine, minute = 20) => rpc('sync_lock_acquire', { p_by: cine, p_minutes: minute });
export const elibereazaLacatul = () => rpc('sync_lock_release');
export const ultimaReusita = () => rpc('sync_last_success');

/** De câte ore n-a mai reușit nicio rulare. `Infinity` dacă n-a reușit niciodată. */
export async function oreDeTacere() {
  const t = await ultimaReusita();
  if (!t) return Infinity;
  return (Date.now() - new Date(t).getTime()) / 3_600_000;
}
