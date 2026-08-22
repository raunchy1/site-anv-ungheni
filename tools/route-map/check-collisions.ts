/**
 * Testul care pică la orice coliziune de rută.
 *
 * Produsele, brandurile, serviciile și paginile legale stau toate pe rădăcină.
 * Un import care ar introduce un produs cu slug-ul `contact` ar înlocui tăcut
 * pagina de contact. Rulează în CI: `pnpm check:routes`.
 */
import { createClient } from "@supabase/supabase-js";

const RESERVED = [
  "catalog-anvelope", "senzori-presiune-anvelope", "servicii", "contact", "cos", "checkout",
  "comanda", "favorite", "comparare", "admin", "api", "ru", "cont", "cautare", "design-system",
  "sitemap.xml", "robots.txt", "_next", "image", "opengraph-image", "icon", "favicon.ico",
];
const RESERVED_RU = [
  "katalog-shin", "datchiki-davleniya-v-shinah", "uslugi", "kontakty", "korzina",
  "oformlenie-zakaza", "zakaz", "izbrannoe", "sravnenie", "admin", "api", "poisk",
];

type Row = { slug_ro: string; slug_ru: string | null };

type Db = { from: (t: string) => { select: (c: string) => { range: (a: number, b: number) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }> } } };

async function all(db: Db, table: string): Promise<Row[]> {
  const out: Row[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from(table).select("slug_ro, slug_ru").range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    out.push(...((data ?? []) as unknown as Row[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("lipsesc variabilele Supabase din mediu");
  const db = createClient(url, key, { auth: { persistSession: false } }) as unknown as Db;

  const [products, brands, services, legal] = await Promise.all([
    all(db, "products"), all(db, "brands"), all(db, "services"), all(db, "legal_pages"),
  ]);

  const problems: string[] = [];

  for (const [lang, pick, reserved] of [
    ["RO", (r: Row) => r.slug_ro, RESERVED],
    ["RU", (r: Row) => r.slug_ru ?? r.slug_ro, RESERVED_RU],
  ] as const) {
    const seen = new Map<string, string>();
    // ordinea de rezolvare: legal -> serviciu -> brand -> produs
    for (const [kind, rows] of [["pagina legala", legal], ["serviciu", services], ["brand", brands], ["produs", products]] as const) {
      for (const r of rows) {
        const slug = pick(r);
        if (!slug) continue;
        if (reserved.includes(slug)) problems.push(`[${lang}] ${kind} „${slug}" ocupă o rută rezervată`);
        const prev = seen.get(slug);
        if (prev) problems.push(`[${lang}] „${slug}" e și ${prev}, și ${kind}`);
        else seen.set(slug, kind);
      }
    }
    console.log(`${lang}: ${seen.size} slug-uri unice pe rădăcină`);
  }

  if (problems.length) {
    console.error(`\n${problems.length} coliziuni:\n` + problems.map((p) => `  ${p}`).join("\n"));
    process.exit(1);
  }
  console.log("zero coliziuni de rutare");
}

main().catch((e) => { console.error(e.message); process.exit(1); });
