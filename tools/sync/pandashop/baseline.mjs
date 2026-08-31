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
import { tyreUrls } from './sitemap.mjs';

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
  const inStoc = ids.length;
  console.log(`\n  ${inStoc} în stoc (ei declară ${declarat})`);

  /* Întrerupătorul se judecă AICI, pe enumerarea listării, nu pe totalul de mai
     jos: sitemap-ul adaugă mii de ID-uri și ar masca o listare ciuntită. */
  if (inStoc === 0) throw new Error('enumerarea a întors 0 produse — nu se scrie nimic');
  if (declarat && inStoc < declarat * 0.9) {
    throw new Error(`enumerare incompletă: ${inStoc} din ${declarat} declarate — nu se scrie nimic`);
  }

  /*
   * ȘI CELE FĂRĂ STOC. Fără pasul ăsta fotografia e incompletă și mecanismul e
   * greșit din temelie: listarea categoriei arată doar ce au ei pe stoc ACUM,
   * deci un produs care revine în stoc peste o lună apare ca „nou" deși există
   * la ei de ani de zile — și, dacă îl avem deja, se ciocnește de slug și ajunge
   * în carantină. S-a văzut exact așa: prima rulare completă pe producție a
   * găsit 48 de „produse noi", din care 39 erau ale noastre.
   *
   * „Nou" înseamnă „ID care n-a existat niciodată la ei", nu „ID care nu e în
   * stoc azi". Sitemap-ul lor separă explicit cele două stări.
   */
  console.log('· adaug ID-urile din sitemap (inclusiv fără stoc)…');
  const ID_NUMERIC = /-(\d{6,10})\/$/;
  const ID_UUID = /\/([0-9a-f]{8}-[0-9a-f-]{20,})\/$/i;
  for (const kind of ['outofstock', 'instock']) {
    const urls = await tyreUrls({
      kind, stateDir: config.paths.state, refresh: process.argv.includes('--refresh-sitemap'),
      onFile: (i, n, gasite) => process.stdout.write(`  ${kind}: fișierul ${i}/${n}, ${gasite} anvelope\r`),
    });
    let extrase = 0;
    for (const u of urls) {
      const id = u.url.match(ID_NUMERIC)?.[1] ?? u.url.match(ID_UUID)?.[1] ?? null;
      if (id) { ids.push(id); extrase++; }
    }
    console.log(`\n  ${kind}: ${urls.length} anvelope, ${extrase} cu ID extras`);
  }
  console.log(`  total: ${new Set(ids).size} ID-uri distincte`);

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
