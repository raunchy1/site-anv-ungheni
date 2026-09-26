import { INDEXNOW_KEY } from "@/lib/seo/indexnow";

/**
 * Fișierul-cheie IndexNow. Bing și Yandex îl citesc ca să verifice că cererea
 * „reindexează adresele astea" vine chiar de la proprietarul domeniului.
 * Cheia e publică prin construcție; vezi `src/lib/seo/indexnow.ts`.
 */
export const dynamic = "force-static";

export function GET() {
  return new Response(INDEXNOW_KEY, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
