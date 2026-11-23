import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

/**
 * Invalidează cache-ul unor produse după o modificare de preț făcută direct în
 * baza de date (nu prin panoul de admin, care îşi face singur `updateTag`).
 *
 *   `?slug=<slug_ro>&slug=<slug_ru>...` — câte un tag `produs:<slug>` pe slug.
 *
 * Aceleaşi tag-uri ca în `src/app/api/cron/sync/route.ts`; `expire: 0` din
 * acelaşi motiv ca acolo. Închisă fără `CRON_SECRET`, ca ruta de sincronizare.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "neautorizat" }, { status: 401 });
  }

  const slugs = new URL(request.url).searchParams.getAll("slug").filter(Boolean);
  if (slugs.length === 0 || slugs.length > 50) {
    return NextResponse.json({ error: "slug lipsă sau prea multe (max 50)" }, { status: 400 });
  }

  for (const slug of slugs) revalidateTag(`produs:${slug}`, { expire: 0 });
  revalidateTag("catalog", { expire: 0 });

  return NextResponse.json({ ok: true, revalidate: slugs });
}
