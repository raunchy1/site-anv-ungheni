"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  uploadProductImages,
  deleteProductImage,
  reorderProductImages,
  updateProductImageAlt,
  applyImageToModel,
  type ProductImageRow,
} from "./images-actions";

type Props = {
  productId: number;
  images: ProductImageRow[];
  imageUrls: Record<number, string | null>;
  canApplyToModel: boolean;
};

export function ImagesPanel({ productId, images: initial, imageUrls, canApplyToModel }: Props) {
  const router = useRouter();
  const [images, setImages] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [dragOver, setDragOver] = useState(false);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // După un drag-reorder local, așteptăm confirmarea serverului înainte de a
  // resincroniza din props — altfel refresh-ul poate readuce ordinea veche.
  const skipNextSync = useRef(false);

  const initialKey = initial.map((i) => `${i.id}:${i.sort_order}:${i.alt_ro ?? ""}:${i.alt_ru ?? ""}`).join("|");
  useEffect(() => {
    if (skipNextSync.current) {
      skipNextSync.current = false;
      return;
    }
    setImages(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync pe conținutul venind de la server
  }, [initialKey]);

  const refresh = useCallback(() => router.refresh(), [router]);

  const run = useCallback(
    (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>, onOk?: () => void) => {
      startTransition(async () => {
        const res = await fn();
        if (res.ok) {
          setMsg({ ok: true, text: ("message" in res && res.message) || "OK" });
          onOk?.();
          refresh();
        } else {
          setMsg({ ok: false, text: ("error" in res && res.error) || "Eroare" });
        }
      });
    },
    [refresh],
  );

  function onFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const fd = new FormData();
    Array.from(fileList).forEach((f) => fd.append("files", f));
    run(() => uploadProductImages(productId, fd), () => {
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    onFiles(e.dataTransfer.files);
  }

  function persistOrder(next: ProductImageRow[]) {
    setImages(next);
    skipNextSync.current = true;
    run(() => reorderProductImages(productId, next.map((i) => i.id)));
  }

  function move(id: number, dir: -1 | 1) {
    const idx = images.findIndex((i) => i.id === id);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= images.length) return;
    const next = [...images];
    const [item] = next.splice(idx, 1);
    next.splice(j, 0, item);
    persistOrder(next);
  }

  function onDragOverItem(e: React.DragEvent, overId: number) {
    e.preventDefault();
    if (draggingId == null || draggingId === overId) return;
    const from = images.findIndex((i) => i.id === draggingId);
    const to = images.findIndex((i) => i.id === overId);
    if (from < 0 || to < 0) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setImages(next);
  }

  function onDragEnd() {
    if (draggingId == null) return;
    setDraggingId(null);
    persistOrder(images);
  }

  return (
    <section className="rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--surface)] p-[var(--sp-4)]">
      <h2 className="text-300 font-semibold text-[var(--ink-strong)]">Imagini</h2>
      <p className="mt-[var(--sp-1)] text-200 text-[var(--ink-muted)]">
        O fotografie poate servi mai multe măsuri ale aceluiași model. La ștergere, fișierul din
        Storage rămâne dacă alt produs îl mai folosește.
      </p>

      {msg ? (
        <p
          role="alert"
          className={`mt-[var(--sp-2)] text-300 ${msg.ok ? "text-[var(--ok)]" : "text-[var(--warn)]"}`}
        >
          {msg.text}
        </p>
      ) : null}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`mt-[var(--sp-3)] flex flex-col items-center justify-center gap-[var(--sp-2)] rounded-[var(--radius-sm)] border-2 border-dashed px-[var(--sp-4)] py-[var(--sp-6)] ${
          dragOver ? "border-[var(--accent)] bg-[var(--surface-2)]" : "border-[var(--field-line)]"
        }`}
      >
        <p className="text-300 text-[var(--ink-strong)]">Trage imaginile aici sau</p>
        <button
          type="button"
          disabled={pending}
          onClick={() => fileRef.current?.click()}
          className="h-9 rounded-[var(--radius-xs)] border border-[var(--line-strong)] px-[var(--sp-3)] text-200 font-medium text-[var(--ink-strong)] hover:bg-[var(--surface-2)] disabled:opacity-50"
        >
          {pending ? "Se procesează…" : "Alege fișiere"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
        <p className="text-100 text-[var(--ink-muted)]">
          JPEG / PNG / WebP · mai multe odată · max ~1600px pe latură
        </p>
      </div>

      {images.length === 0 ? (
        <p className="mt-[var(--sp-3)] text-300 text-[var(--ink-muted)]">Nicio imagine pe acest produs.</p>
      ) : (
        <ul className="mt-[var(--sp-4)] flex flex-col gap-[var(--sp-3)]">
          {images.map((img, index) => (
            <li
              key={img.id}
              draggable
              onDragStart={() => setDraggingId(img.id)}
              onDragOver={(e) => onDragOverItem(e, img.id)}
              onDragEnd={onDragEnd}
              className={`flex flex-col gap-[var(--sp-3)] rounded-[var(--radius-sm)] border border-[var(--line-strong)] bg-[var(--surface-2)] p-[var(--sp-3)] sm:flex-row ${
                draggingId === img.id ? "opacity-60" : ""
              }`}
            >
              <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-[var(--radius-xs)] bg-[var(--field-bg)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrls[img.id] ?? ""}
                  alt={img.alt_ro ?? ""}
                  className="h-full w-full object-contain"
                />
                {index === 0 ? (
                  <span className="absolute left-1 top-1 rounded bg-[var(--accent)] px-1.5 text-100 font-medium text-[var(--on-accent)]">
                    thumbnail
                  </span>
                ) : null}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-[var(--sp-2)]">
                <p className="truncate text-100 text-[var(--ink-muted)]" title={img.storage_path}>
                  {img.storage_path}
                  {img.width && img.height ? ` · ${img.width}×${img.height}` : ""}
                </p>
                <AltEditor
                  key={`${img.id}-${img.alt_ro ?? ""}-${img.alt_ru ?? ""}`}
                  imageId={img.id}
                  altRo={img.alt_ro}
                  altRu={img.alt_ru}
                  disabled={pending}
                  onSave={(altRo, altRu) => run(() => updateProductImageAlt(img.id, altRo, altRu))}
                />
                <div className="flex flex-wrap gap-[var(--sp-2)]">
                  <button
                    type="button"
                    disabled={pending || index === 0}
                    onClick={() => move(img.id, -1)}
                    className="h-8 rounded-[var(--radius-xs)] border border-[var(--line-strong)] px-[var(--sp-2)] text-100 font-medium disabled:opacity-40"
                  >
                    ↑ Sus
                  </button>
                  <button
                    type="button"
                    disabled={pending || index === images.length - 1}
                    onClick={() => move(img.id, 1)}
                    className="h-8 rounded-[var(--radius-xs)] border border-[var(--line-strong)] px-[var(--sp-2)] text-100 font-medium disabled:opacity-40"
                  >
                    ↓ Jos
                  </button>
                  {canApplyToModel ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        if (
                          !confirm(
                            "Aplică această poză la toate produsele cu aceeași marcă și model? Pozele existente ale fraților nu se șterg.",
                          )
                        ) {
                          return;
                        }
                        run(() => applyImageToModel(img.id));
                      }}
                      className="h-8 rounded-[var(--radius-xs)] border border-[var(--line-strong)] px-[var(--sp-2)] text-100 font-medium hover:bg-[var(--surface)] disabled:opacity-40"
                    >
                      Aplică la tot modelul
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (!confirm("Ștergi referința imaginii de pe acest produs?")) return;
                      run(() => deleteProductImage(img.id));
                    }}
                    className="h-8 rounded-[var(--radius-xs)] border border-[var(--warn)] px-[var(--sp-2)] text-100 font-medium text-[var(--warn)] disabled:opacity-40"
                  >
                    Șterge
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AltEditor({
  imageId,
  altRo,
  altRu,
  disabled,
  onSave,
}: {
  imageId: number;
  altRo: string | null;
  altRu: string | null;
  disabled: boolean;
  onSave: (altRo: string | null, altRu: string | null) => void;
}) {
  const [ro, setRo] = useState(altRo ?? "");
  const [ru, setRu] = useState(altRu ?? "");
  const dirty = ro !== (altRo ?? "") || ru !== (altRu ?? "");

  return (
    <div className="grid grid-cols-1 gap-[var(--sp-2)] sm:grid-cols-[1fr_1fr_auto]">
      <input
        aria-label={`alt RO ${imageId}`}
        placeholder="alt_ro"
        value={ro}
        onChange={(e) => setRo(e.target.value)}
        className="h-9 rounded-[var(--radius-sm)] border border-[var(--field-line)] bg-[var(--field-bg)] px-[var(--sp-2)] text-200 outline-none focus:border-[var(--accent)]"
      />
      <input
        aria-label={`alt RU ${imageId}`}
        placeholder="alt_ru"
        value={ru}
        onChange={(e) => setRu(e.target.value)}
        className="h-9 rounded-[var(--radius-sm)] border border-[var(--field-line)] bg-[var(--field-bg)] px-[var(--sp-2)] text-200 outline-none focus:border-[var(--accent)]"
      />
      <button
        type="button"
        disabled={disabled || !dirty}
        onClick={() => onSave(ro.trim() || null, ru.trim() || null)}
        className="h-9 rounded-[var(--radius-xs)] bg-[var(--accent)] px-[var(--sp-3)] text-200 font-semibold text-[var(--on-accent)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Salvează alt
      </button>
    </div>
  );
}
