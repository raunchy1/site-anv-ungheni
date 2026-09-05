/**
 * Imaginile produselor noi.
 *
 * Convenția e cea din catalogul existent, nu una nouă: numele fișierului e
 * SHA-1-ul conținutului, calea e `produse/<sha1>.jpg`, iar `content_hash` ține
 * același SHA-1. De aici vine deduplicarea — aceeași fotografie servește mai
 * multe SKU-uri fără să fie urcată de două ori (15.000 de referințe stau azi pe
 * 1.749 de fișiere).
 *
 * REDIMENSIONAREA E LA SURSĂ. CDN-ul lor acceptă `w`/`h` în query și întoarce
 * exact 900×900, deci nu instalăm o bibliotecă de procesare imagini ca să facem
 * ce face deja serverul lor. `html-source.mjs` cere direct 900.
 *
 * O notă onestă despre deduplicare: SHA-1-ul se potrivește doar între imagini
 * identice octet cu octet. Fotografiile de la pandashop sunt recomprimate de
 * CDN-ul lor, deci NU se vor potrivi cu cele 1.749 venite de pe site-ul vechi,
 * chiar dacă e aceeași poză. Deduplicarea lucrează real între produsele noi
 * importate — acolo unde același model în mai multe dimensiuni are aceeași poză.
 */
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { UA } from './http.mjs';

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? 'produse';

let client = null;
const db = () => (client ??= createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false } },
));

const sha1 = (buf) => crypto.createHash('sha1').update(buf).digest('hex');

/** Dimensiunile unui JPEG, din antet. Fără bibliotecă: ne trebuie doar două numere. */
export function dimensiuniJpeg(buf) {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) { i++; continue; }
    const m = buf[i + 1];
    if (m >= 0xc0 && m <= 0xc3) return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    if (m === 0xd8 || m === 0xd9 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return { width: null, height: null };
}

async function descarca(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(45_000) });
  if (!res.ok) throw new Error(`imagine ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1024) throw new Error(`imagine prea mică (${buf.length} octeți)`);
  return buf;
}

/**
 * Aduce imaginile unui produs și le pregătește pentru `product_images`.
 * Nu scrie în bază — doar în storage, și doar ce nu e deja acolo.
 *
 * @param {{url: string, alt?: string}[]} imagini
 * @param {Set<string>} hashuriCunoscute  SHA-1-urile deja prezente în catalog
 * @param {{ dryRun?: boolean, max?: number }} opts
 */
export async function pregatesteImagini(imagini, hashuriCunoscute, { dryRun = true, max = 4, altRo = null, altRu = null } = {}) {
  const out = [];
  const erori = [];
  /*
   * ACELASI FISIER O SINGURA DATA PER PRODUS. Galeria lor repeta uneori aceeasi
   * fotografie sub doua URL-uri diferite, iar dupa descarcare amandoua dau
   * acelasi SHA-1, deci aceeasi `storage_path`. `product_images` are unic pe
   * (product_id, storage_path): lotul intreg pica cu 23505, produsul ramane
   * fara NICIO poza, si eroarea se vede doar in jurnal. S-a intamplat la 2 din
   * primele 910 importate pe 5 septembrie 2026.
   */
  const inAcestProdus = new Set();
  for (const im of imagini.slice(0, max)) {
    try {
      const buf = await descarca(im.url);
      const hash = sha1(buf);
      if (inAcestProdus.has(hash)) continue;
      inAcestProdus.add(hash);
      const cale = `${BUCKET}/${hash}.jpg`;
      const { width, height } = dimensiuniJpeg(buf);
      const refolosita = hashuriCunoscute.has(hash);

      if (!refolosita && !dryRun) {
        const { error } = await db().storage.from(BUCKET).upload(`${hash}.jpg`, buf, {
          contentType: 'image/jpeg', upsert: false,
        });
        /* „already exists" nu e o eroare: altcineva a urcat aceeași poză între timp. */
        if (error && !/exists/i.test(error.message)) throw new Error(`upload: ${error.message}`);
      }
      hashuriCunoscute.add(hash);

      out.push({
        storage_path: cale,
        original_path: im.url.replace(/^https?:\/\/[^/]+/, ''),
        content_hash: hash,
        width, height,
        /* Textul alternativ e titlul din catalog, în ambele limbi, ca la cele 15.000
           existente. NU `im.caption` de la ei: acela începe cu „Anvelopa", pe care
           titlurile noastre nu-l au, iar `alt_ru` ar rămâne gol. */
        alt_ro: altRo ?? im.alt ?? null,
        alt_ru: altRu ?? altRo ?? im.alt ?? null,
        /* Pozitia in galerie se numara dupa ce s-au sarit duplicatele, nu dupa
           indexul din lista lor: altfel raman gauri in `sort_order`. */
        sort_order: out.length,
        refolosita,
      });
    } catch (e) {
      erori.push(`${im.url}: ${e.message}`);
    }
  }
  return { imagini: out, erori };
}
