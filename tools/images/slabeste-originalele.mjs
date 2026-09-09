/**
 * SLĂBEȘTE ORIGINALELE DIN `produse`.
 *
 * DE CE. Bucket-ul avea 817 MB în 3.865 de fișiere, pe un plan Supabase Free cu
 * 1 GB — 82% ocupat, deci următorul import de produse noi ar fi lovit plafonul.
 * 751 de fișiere de peste 300 KB țineau 509 MB din total, iar cel mai mare avea
 * 21 MB. Sunt fotografii moștenite de la migrarea site-ului vechi; ce vine azi
 * prin sincronizare e deja cerut la 900×900 de la sursă (vezi
 * `tools/sync/pandashop/images.mjs`).
 *
 * DE CE E SIGUR SĂ LE RESCRIEM. Nimic de pe site nu afișează o fotografie mai
 * lată de 1080 px: `next.config.ts` are `deviceSizes` până la 1080, iar
 * originalul nici măcar nu ajunge la browser — `src/lib/image-loader.ts` trimite
 * fiecare cerere prin `render/image`, care redimensionează la sursă. Originalul
 * e, practic, doar arhiva din care Supabase taie variantele.
 *
 * CE NU SE STRICĂ. Numele fișierului e SHA-1-ul conținutului, iar `content_hash`
 * ține același SHA-1. După recomprimare, fișierul nu-și mai respectă numele —
 * și e în regulă: hash-ul e folosit exclusiv ca DEDUPLICARE A SURSEI, adică se
 * compară SHA-1-ul unei poze proaspăt descărcate de la furnizor cu mulțimea de
 * hash-uri cunoscute (`import.mjs`, `backfill.mjs`, `repair-images.mjs`).
 * Nimeni nu recalculează hash-ul fișierelor din bucket. `storage_path` rămâne
 * neatins, deci site-ul cere exact aceleași adrese.
 *
 * `product_images.width/height` se actualizează pentru corectitudine, deși
 * site-ul nu le citește: `queries.ts` cere doar `storage_path, alt_ro, alt_ru`.
 *
 * SE PĂSTREAZĂ O COPIE. Înainte de prima rescriere, originalul se salvează în
 * `--backup` (implicit `data/originale-inainte-de-slabire/`). Operația devine
 * astfel reversibilă, ceea ce o simplă rescriere în bucket nu e.
 *
 * Rulare:
 *   node --env-file=.env.local tools/images/slabeste-originalele.mjs            # raport, nu scrie nimic
 *   node --env-file=.env.local tools/images/slabeste-originalele.mjs --apply    # scrie
 *   ... --prag 300000 --latime-max 1600 --calitate 82 --limita 50
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? 'produse';

const arg = (nume, implicit) => {
  const i = process.argv.indexOf(`--${nume}`);
  return i === -1 ? implicit : process.argv[i + 1];
};
const APLICA = process.argv.includes('--apply');
/* Sub prag, recomprimarea ar câștiga zeci de kiloocteți pentru un drum dus-întors
   prin rețea. Peste, câștigul e de ordinul sutelor de KB până la megaocteți. */
const PRAG = Number(arg('prag', 300_000));
const LATIME_MAX = Number(arg('latime-max', 1600));
const CALITATE = Number(arg('calitate', 82));
const LIMITA = Number(arg('limita', Infinity));
const BACKUP = arg('backup', 'data/originale-inainte-de-slabire');

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false } },
);

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;

/** Toate obiectele din bucket, paginate — `list` întoarce maximum 1.000 odată. */
async function toateObiectele() {
  const out = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db.storage.from(BUCKET).list('', {
      limit: 1000, offset, sortBy: { column: 'name', order: 'asc' },
    });
    if (error) throw new Error(`list: ${error.message}`);
    if (!data?.length) break;
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out;
}

async function main() {
  console.log(`bucket «${BUCKET}» · prag ${kb(PRAG)} · lățime max ${LATIME_MAX}px · calitate ${CALITATE}`);
  console.log(APLICA ? 'MOD: SCRIE' : 'MOD: doar raport (adaugă --apply ca să scrie)');

  const obiecte = await toateObiectele();
  const mari = obiecte
    .filter((o) => (o.metadata?.size ?? 0) > PRAG)
    .sort((a, b) => (b.metadata?.size ?? 0) - (a.metadata?.size ?? 0))
    .slice(0, LIMITA === Infinity ? undefined : LIMITA);

  const totalBucket = obiecte.reduce((s, o) => s + (o.metadata?.size ?? 0), 0);
  console.log(`· ${obiecte.length} fișiere, ${mb(totalBucket)} în total`);
  console.log(`· ${mari.length} peste prag, ${mb(mari.reduce((s, o) => s + (o.metadata?.size ?? 0), 0))}\n`);

  if (APLICA) fs.mkdirSync(BACKUP, { recursive: true });

  let inainte = 0, dupa = 0, atinse = 0, sarite = 0;
  const erori = [];

  for (const [i, obj] of mari.entries()) {
    const nume = obj.name;
    try {
      const { data, error } = await db.storage.from(BUCKET).download(nume);
      if (error) throw new Error(`download: ${error.message}`);
      const orig = Buffer.from(await data.arrayBuffer());

      const meta = await sharp(orig).metadata();
      const redim = meta.width > LATIME_MAX || meta.height > LATIME_MAX;

      const nou = await sharp(orig)
        .rotate()  // aplică orientarea EXIF înainte de a o arunca
        .resize({ width: LATIME_MAX, height: LATIME_MAX, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: CALITATE, mozjpeg: true })
        .toBuffer();

      inainte += orig.length;

      /* Dacă recomprimarea nu câștigă cel puțin 10%, fișierul rămâne cum e:
         un upload care economisește 3% e un drum prin rețea degeaba. */
      if (nou.length > orig.length * 0.9) {
        dupa += orig.length; sarite++;
        console.log(`  · ${nume.slice(0, 12)}… ${kb(orig.length)} ${meta.width}×${meta.height} — lăsat (câștig sub 10%)`);
        continue;
      }

      dupa += nou.length; atinse++;
      const semn = `${kb(orig.length)} → ${kb(nou.length)}  ${meta.width}×${meta.height}${redim ? ` → ${LATIME_MAX}px` : ''}`;

      if (!APLICA) {
        console.log(`  ${String(i + 1).padStart(4)} ${nume.slice(0, 12)}… ${semn}`);
        continue;
      }

      const caleBackup = path.join(BACKUP, nume);
      if (!fs.existsSync(caleBackup)) fs.writeFileSync(caleBackup, orig);

      const { error: eUp } = await db.storage.from(BUCKET).upload(nume, nou, {
        contentType: 'image/jpeg', cacheControl: '31536000', upsert: true,
      });
      if (eUp) throw new Error(`upload: ${eUp.message}`);

      /* Dimensiunile din `product_images` nu se citesc de pe site, dar o coloană
         care minte e o capcană pentru cine se uită mâine în ea. */
      const finala = await sharp(nou).metadata();
      const hash = nume.replace(/\.[a-z0-9]+$/i, '');
      await db.from('product_images')
        .update({ width: finala.width, height: finala.height })
        .eq('content_hash', hash);

      console.log(`  ${String(i + 1).padStart(4)} ${nume.slice(0, 12)}… ${semn}  ✓`);
    } catch (e) {
      erori.push(`${nume}: ${e.message}`);
      console.log(`  ${String(i + 1).padStart(4)} ${nume.slice(0, 12)}… EROARE ${e.message}`);
    }
  }

  const castig = inainte - dupa;
  console.log(`\n· procesate ${mari.length}, rescrise ${atinse}, lăsate ${sarite}, erori ${erori.length}`);
  console.log(`· ${mb(inainte)} → ${mb(dupa)}   (economie ${mb(castig)}, ${((castig / inainte) * 100).toFixed(0)}%)`);
  console.log(`· bucket: ${mb(totalBucket)} → ${mb(totalBucket - castig)}`);
  if (erori.length) console.log(`\nerori:\n  ${erori.slice(0, 10).join('\n  ')}`);
  if (!APLICA) console.log('\nnimic nu a fost scris. `--apply` face rescrierea, cu backup local.');
}

main().catch((e) => { console.error(e); process.exit(1); });
