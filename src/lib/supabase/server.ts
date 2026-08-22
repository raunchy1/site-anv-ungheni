import { createClient } from "@supabase/supabase-js";

/**
 * Client de citire pentru componentele server. Folosește cheia publică:
 * RLS permite `select` pe catalog, deci nu e nevoie de service role la randare.
 */
export const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } },
);

/** Doar pentru operații care trebuie să ocolească RLS. Niciodată importat în client. */
export function adminDb() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY lipsește");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false } });
}

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "produse";

/** `produse/<hash>.jpg` -> URL public complet. */
export function imageUrl(storagePath: string | null | undefined): string | null {
  if (!storagePath) return null;
  const file = storagePath.startsWith(`${BUCKET}/`) ? storagePath.slice(BUCKET.length + 1) : storagePath;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${file}`;
}
