#!/usr/bin/env node
/**
 * GATE A — FOTOGRAFIA INIȚIALĂ.
 *
 * Enumeră toate ID-urile de anvelope de la pandashop și le scrie în
 * `pandashop_seen` cu `baseline = true`. NU importă niciunul: sunt trecut.
 * De mâine, „produs nou" înseamnă „ID care nu e în tabelul ăsta" — o comparație
 * de mulțimi, fără nicio potrivire aproximativă.
 *
 * NU SCRIE ÎN `products`. Modulul de scriere are o listă albă de tabele în care
 * `products` nici nu figurează, deci n-ar putea nici dacă i s-ar cere.
 *
 *   node --env-file=.env.local tools/sync/pandashop/baseline.mjs           # dry-run
 *   node --env-file=.env.local tools/sync/pandashop/baseline.mjs --apply
 */
import { config } from './config.mjs';
import { createHttp } from './http.mjs';
import { createHtmlSource } from './html-source.mjs';
import { createFeedSource } from './feed-source.mjs';
import { readAll } from './db.mjs';
import { insert } from './db-write.mjs';

const aplica = process.argv.includes('--apply');

async function numaraProduse() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/products?select=id`, {
    headers: {
      apikey: process.env.SUPABASE_SECRET_KEY, Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
      Prefer: 'count=exact', Range: '0-0',
    },
  });
  return Number(res.headers.get('content-range')?.split('/')[1] ?? NaN);
}

async function main() {
  const t0 = Date.now();

  /* Numărul de produse, înainte și după. E dovada, nu promisiunea. */
  const inainte = await numaraProduse();
  console.log(`· produse în catalog înainte: ${inainte}`);

  const deja = await readAll('pandashop_seen', 'pandashop_id');
  const cunoscute = new Set(deja.map((r) => r.pandashop_id));
  console.log(`· în pandashop_seen deja: ${cunoscute.size}`);

  console.log('· enumăr catalogul lor de anvelope…');
  const http = createHttp({ ...config.http });
  const source = config.source === 'feed' ? createFeedSource() : createHtmlSource(http);

  const ids = [];
  let declarat = null;
  for await (const ref of source.listProducts({
    onPage: (page, refs, meta) => {
      declarat = meta.total ?? declarat;
      if (page % 20 === 0) process.stdout.write(`  pagina ${page}, ${ids.length} ID-uri\r`);
    },
  })) {
    ids.push(ref.id);
  }
  console.log(`\n  ${ids.length} ID-uri (ei declară ${declarat})`);

  /* Întrerupătorul, chiar și aici: o enumerare goală înseamnă că s-a schimbat
     structura lor, iar o fotografie goală ar declara tot catalogul lor „nou"
     la următoarea rulare. */
  if (ids.length === 0) throw new Error('enumerarea a întors 0 produse — nu se scrie nimic');
  if (declarat && ids.length < declarat * 0.9) {
    throw new Error(`enumerare incompletă: ${ids.length} din ${declarat} declarate — nu se scrie nimic`);
  }

  const noi = ids.filter((id) => !cunoscute.has(id));
  const unice = [...new Set(noi)];

  console.log(`\n${aplica ? 'APLIC' : 'DRY-RUN — nu se scrie nimic'}`);
  console.log(`  de scris în pandashop_seen: ${unice.length}`);
  console.log(`  de scris în products:       0  (prin construcție)`);
  console.log(`  exemple: ${unice.slice(0, 3).join(', ')}`);
  console.log(`  formate: ${unice.filter((x) => /^\d+$/.test(x)).length} numerice, ${unice.filter((x) => !/^\d+$/.test(x)).length} non-numerice (UUID)`);

  if (!aplica) { console.log('\nNimic scris. Adaugă --apply.'); return; }

  const scrise = await insert('pandashop_seen', unice.map((id) => ({
    pandashop_id: id, baseline: true, imported: false, status: 'skipped', last_checked_at: new Date().toISOString(),
  })), { onConflict: 'pandashop_id' });

  const total = (await readAll('pandashop_seen', 'pandashop_id')).length;
  const dupa = await numaraProduse();

  console.log(`\n  scrise: ${scrise}`);
  console.log(`  total în pandashop_seen: ${total}`);
  console.log(`  produse în catalog după: ${dupa}  ${dupa === inainte ? '— neschimbat ✓' : '— S-A SCHIMBAT!'}`);
  if (dupa !== inainte) throw new Error('numărul de produse s-a schimbat; investighează imediat');
  console.log(`\ngata în ${Math.round((Date.now() - t0) / 1000)}s`);
}

main().catch((e) => { console.error('\nA EȘUAT:', e.message); process.exit(1); });
