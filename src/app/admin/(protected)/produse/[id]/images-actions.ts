"use server";

import crypto from "node:crypto";
import { updateTag } from "next/cache";
import sharp from "sharp";
import { adminDb } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/supabase/auth";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "produse";
/** Același plafon ca tools/images/slabeste-originalele.mjs — originalul nu e afișat mai lat de ~1080 pe site. */
const MAX_EDGE = 1600;
const JPEG_QUALITY = 82;

export type ImageActionResult = { ok: true; message: string } | { ok: false; error: string };

export type ProductImageRow = {
  id: number;
  product_id: number;
  storage_path: string;
  original_path: string;
  content_hash: string | null;
  width: number | null;
  height: number | null;
  alt_ro: string | null;
  alt_ru: string | null;
  sort_order: number;
};

function sha1(buf: Buffer): string {
  return crypto.createHash("sha1").update(buf).digest("hex");
}

async function productSlugs(db: ReturnType<typeof adminDb>, productId: number) {
  const { data } = await db.from("products").select("slug_ro, slug_ru").eq("id", productId).single();
  return data as { slug_ro: string; slug_ru: string | null } | null;
}

function revalidateProduct(slugs: { slug_ro: string; slug_ru: string | null }, catalog = false) {
  updateTag(`produs:${slugs.slug_ro}`);
  if (slugs.slug_ru) updateTag(`produs:${slugs.slug_ru}`);
  if (catalog) updateTag("catalog");
}

async function firstImageId(db: ReturnType<typeof adminDb>, productId: number): Promise<number | null> {
  const { data } = await db
    .from("product_images")
    .select("id")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

async function nextSortOrder(db: ReturnType<typeof adminDb>, productId: number): Promise<number> {
  const { data } = await db
    .from("product_images")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? data.sort_order + 1 : 0;
}

/**
 * Redimensionează la max 1600 pe latura lungă, JPEG mozjpeg — convenție
 * aliniată cu slabeste-originalele.mjs. Hash-ul e pe buffer-ul rezultat
 * (ca la sync, unde hash-ul e pe octetii urcați, deja 900×900 de la CDN).
 */
async function processUpload(file: File): Promise<{
  buf: Buffer;
  hash: string;
  width: number | null;
  height: number | null;
  originalName: string;
}> {
  const input = Buffer.from(await file.arrayBuffer());
  if (input.length < 100) throw new Error("Fișier prea mic.");

  const out = await sharp(input)
    .rotate()
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });

  const hash = sha1(out.data);
  return {
    buf: out.data,
    hash,
    width: out.info.width ?? null,
    height: out.info.height ?? null,
    originalName: file.name || "upload.jpg",
  };
}

export async function uploadProductImages(productId: number, formData: FormData): Promise<ImageActionResult> {
  await requireAdminUser();
  const db = adminDb();

  const slugs = await productSlugs(db, productId);
  if (!slugs) return { ok: false, error: "Produsul nu a fost găsit." };

  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { ok: false, error: "Nicio imagine selectată." };

  const thumbBefore = await firstImageId(db, productId);
  let sort = await nextSortOrder(db, productId);
  let uploaded = 0;
  const errors: string[] = [];
  const seenInBatch = new Set<string>();

  for (const file of files) {
    try {
      const { buf, hash, width, height, originalName } = await processUpload(file);
      if (seenInBatch.has(hash)) continue;
      seenInBatch.add(hash);

      const storagePath = `${BUCKET}/${hash}.jpg`;

      // Dedup pe produs: unique (product_id, storage_path)
      const { data: existing } = await db
        .from("product_images")
        .select("id")
        .eq("product_id", productId)
        .eq("storage_path", storagePath)
        .maybeSingle();
      if (existing) {
        errors.push(`${originalName}: deja pe acest produs`);
        continue;
      }

      const { error: upErr } = await db.storage.from(BUCKET).upload(`${hash}.jpg`, buf, {
        contentType: "image/jpeg",
        upsert: false,
      });
      // „already exists” nu e eroare: altă SKU sau un upload anterior a pus fișierul.
      if (upErr && !/exists/i.test(upErr.message)) {
        throw new Error(`upload: ${upErr.message}`);
      }

      const { error: insErr } = await db.from("product_images").insert({
        product_id: productId,
        storage_path: storagePath,
        original_path: `admin-upload/${originalName}`,
        content_hash: hash,
        width,
        height,
        alt_ro: null,
        alt_ru: null,
        sort_order: sort,
      });
      if (insErr) throw new Error(insErr.message);

      sort += 1;
      uploaded += 1;
    } catch (e) {
      errors.push(`${file.name}: ${e instanceof Error ? e.message : "eroare"}`);
    }
  }

  if (uploaded === 0) {
    return { ok: false, error: errors.length ? errors.join("; ") : "Nicio imagine urcată." };
  }

  const thumbAfter = await firstImageId(db, productId);
  revalidateProduct(slugs, thumbBefore !== thumbAfter);
  const msg =
    errors.length > 0
      ? `Urcate ${uploaded}. Atenții: ${errors.join("; ")}`
      : `Urcate ${uploaded} ${uploaded === 1 ? "imagine" : "imagini"}.`;
  return { ok: true, message: msg };
}

export async function deleteProductImage(imageId: number): Promise<ImageActionResult> {
  await requireAdminUser();
  const db = adminDb();

  const { data: row, error } = await db
    .from("product_images")
    .select("id, product_id, storage_path, sort_order")
    .eq("id", imageId)
    .single();
  if (error || !row) return { ok: false, error: "Imaginea nu a fost găsită." };

  const slugs = await productSlugs(db, row.product_id);
  if (!slugs) return { ok: false, error: "Produsul nu a fost găsit." };

  const thumbBefore = await firstImageId(db, row.product_id);

  const { error: delErr } = await db.from("product_images").delete().eq("id", imageId);
  if (delErr) return { ok: false, error: "Nu s-a putut șterge rândul." };

  // Storage doar dacă nimeni altcineva nu mai referă aceeași cale (§2.4).
  const { count } = await db
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("storage_path", row.storage_path);
  if ((count ?? 0) === 0) {
    const file = row.storage_path.startsWith(`${BUCKET}/`)
      ? row.storage_path.slice(BUCKET.length + 1)
      : row.storage_path;
    await db.storage.from(BUCKET).remove([file]);
  }

  const thumbAfter = await firstImageId(db, row.product_id);
  revalidateProduct(slugs, thumbBefore !== thumbAfter);
  return { ok: true, message: "Imagine ștearsă." };
}

export async function reorderProductImages(
  productId: number,
  orderedIds: number[],
): Promise<ImageActionResult> {
  await requireAdminUser();
  const db = adminDb();

  const slugs = await productSlugs(db, productId);
  if (!slugs) return { ok: false, error: "Produsul nu a fost găsit." };

  const thumbBefore = await firstImageId(db, productId);

  // Verifică că toate id-urile aparțin produsului.
  const { data: rows } = await db.from("product_images").select("id").eq("product_id", productId);
  const owned = new Set((rows ?? []).map((r) => r.id as number));
  if (orderedIds.length !== owned.size || orderedIds.some((id) => !owned.has(id))) {
    return { ok: false, error: "Lista de ordine nu se potrivește cu imaginile produsului." };
  }

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await db.from("product_images").update({ sort_order: i }).eq("id", orderedIds[i]);
    if (error) return { ok: false, error: "Nu s-a putut reordona." };
  }

  const thumbAfter = await firstImageId(db, productId);
  revalidateProduct(slugs, thumbBefore !== thumbAfter);
  return { ok: true, message: "Ordine salvată." };
}

export async function updateProductImageAlt(
  imageId: number,
  altRo: string | null,
  altRu: string | null,
): Promise<ImageActionResult> {
  await requireAdminUser();
  const db = adminDb();

  const { data: row, error } = await db
    .from("product_images")
    .select("id, product_id")
    .eq("id", imageId)
    .single();
  if (error || !row) return { ok: false, error: "Imaginea nu a fost găsită." };

  const slugs = await productSlugs(db, row.product_id);
  if (!slugs) return { ok: false, error: "Produsul nu a fost găsit." };

  const { error: upErr } = await db
    .from("product_images")
    .update({
      alt_ro: altRo?.trim() || null,
      alt_ru: altRu?.trim() || null,
    })
    .eq("id", imageId);
  if (upErr) return { ok: false, error: "Nu s-a putut salva textul alternativ." };

  // Alt text e pe pagina de produs, nu pe listări — fără catalog.
  revalidateProduct(slugs, false);
  return { ok: true, message: "Alt text salvat." };
}

/**
 * Aplică poza (storage_path) la toate produsele cu același brand_id + model.
 * Adaugă la finalul galeriei fraților; nu șterge pozele existente.
 * Convenția catalogului: o fotografie per model, reutilizată la toate măsurile (§2.4).
 */
export async function applyImageToModel(imageId: number): Promise<ImageActionResult> {
  await requireAdminUser();
  const db = adminDb();

  const { data: img, error } = await db
    .from("product_images")
    .select("id, product_id, storage_path, original_path, content_hash, width, height, alt_ro, alt_ru")
    .eq("id", imageId)
    .single();
  if (error || !img) return { ok: false, error: "Imaginea nu a fost găsită." };

  const { data: product } = await db
    .from("products")
    .select("id, brand_id, model, slug_ro, slug_ru")
    .eq("id", img.product_id)
    .single();
  if (!product) return { ok: false, error: "Produsul nu a fost găsit." };
  if (product.brand_id == null || !product.model?.trim()) {
    return { ok: false, error: "Produsul nu are marcă și model — nu pot găsi frații." };
  }

  const { data: siblings } = await db
    .from("products")
    .select("id, slug_ro, slug_ru")
    .eq("brand_id", product.brand_id)
    .eq("model", product.model)
    .neq("id", product.id);

  if (!siblings?.length) {
    return { ok: true, message: "Nu există alte produse cu același model." };
  }

  let applied = 0;
  let skipped = 0;
  let catalogNeeded = false;

  for (const sib of siblings) {
    const { data: already } = await db
      .from("product_images")
      .select("id")
      .eq("product_id", sib.id)
      .eq("storage_path", img.storage_path)
      .maybeSingle();
    if (already) {
      skipped += 1;
      continue;
    }

    const hadImages = (await firstImageId(db, sib.id)) != null;
    const sort = await nextSortOrder(db, sib.id);
    const { error: insErr } = await db.from("product_images").insert({
      product_id: sib.id,
      storage_path: img.storage_path,
      original_path: img.original_path,
      content_hash: img.content_hash,
      width: img.width,
      height: img.height,
      alt_ro: img.alt_ro,
      alt_ru: img.alt_ru,
      sort_order: sort,
    });
    if (insErr) continue;

    applied += 1;
    // Thumbnail se schimbă doar dacă fratele n-avea nicio poză (noua e prima).
    if (!hadImages) catalogNeeded = true;
    revalidateProduct({ slug_ro: sib.slug_ro, slug_ru: sib.slug_ru }, false);
  }

  if (catalogNeeded) updateTag("catalog");
  // Produsul curent neschimbat ca listă de imagini, dar revalidăm oricum fișa.
  revalidateProduct({ slug_ro: product.slug_ro, slug_ru: product.slug_ru }, false);

  return {
    ok: true,
    message: `Aplicat la ${applied} produse` + (skipped ? ` (${skipped} aveau deja poza)` : "") + ".",
  };
}
