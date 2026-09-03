"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ProductImage } from "@/components/ui/ProductImage";
import { IconChevronLeft, IconChevronRight, IconClose } from "@/components/icons";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export type GalleryImage = { url: string; alt: string | null; alt_ru: string | null };

/**
 * Fotografia de pe fisa produsului, cu marire la click.
 *
 * De ce un `<dialog>` nativ si nu un div cu `position: fixed`: blocarea
 * focusului, `Escape`, inertizarea paginii din spate si oprirea scrollului sunt
 * comportamente pe care browserul le face corect, inclusiv cu cititor de ecran.
 * Un lightbox facut de mana le rateaza pe toate patru.
 *
 * Fotografia mare NU e a doua descarcare: e acelasi fisier din Storage, cerut de
 * `next/image` la o latime mai mare. Pe conexiunea unui telefon din Ungheni,
 * asta conteaza mai mult decat orice animatie.
 *
 * Produsele vechi au o singura poza — atunci nu exista nici banda de miniaturi,
 * nici sagetile, doar marirea. Cele importate din pandashop au pana la patru.
 */
export function ProductGallery({
  images,
  alt,
  locale,
}: {
  images: GalleryImage[];
  alt: string;
  locale: Locale;
}) {
  const d = t(locale);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const atingere = useRef<{ x: number; y: number } | null>(null);

  const total = images.length;
  const multe = total > 1;
  const eticheta = (i: number) =>
    images[i]?.[locale === "ru" ? "alt_ru" : "alt"] || alt;

  const mergiLa = useCallback(
    (n: number) => setIndex(total ? ((n % total) + total) % total : 0),
    [total],
  );

  /* `showModal()` nu se poate apela la randare — dialogul e in DOM de la
     inceput, iar starea deschis/inchis se sincronizeaza aici. */
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  /* Sagetile de la tastatura, doar cat timp e deschis. Escape il trateaza
     browserul singur, prin `onCancel`. */
  useEffect(() => {
    if (!open || !multe) return;
    const laTasta = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") { e.preventDefault(); mergiLa(index + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); mergiLa(index - 1); }
    };
    window.addEventListener("keydown", laTasta);
    return () => window.removeEventListener("keydown", laTasta);
  }, [open, multe, index, mergiLa]);

  if (total === 0) {
    return <ProductImage src={null} alt={alt} locale={locale} priority sizes="(min-width: 1024px) 380px, 92vw" />;
  }

  return (
    <div>
      {/* Butonul e fotografia insasi: pe telefon nimeni nu cauta o lupa mica
          intr-un colt, atinge poza. Lupa ramane ca semn vizibil ca se poate. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={d.zoom}
        className="group relative block w-full cursor-zoom-in rounded-[var(--radius-xs)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      >
        <ProductImage
          src={images[index].url}
          alt={eticheta(index)}
          locale={locale}
          priority
          sizes="(min-width: 1024px) 380px, 92vw"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-[var(--sp-3)] right-[var(--sp-3)] grid size-9 place-items-center rounded-[var(--radius-xs)] border border-[var(--line)] bg-[var(--surface)]/90 text-[var(--ink-muted)] shadow-[var(--shadow-1)] transition-colors duration-[var(--dur-1)] group-hover:text-[var(--ink-strong)]"
        >
          <IconZoom />
        </span>
      </button>

      {multe ? (
        <div className="mt-[var(--sp-3)] flex flex-wrap gap-[var(--sp-2)]">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={d.imageOf.replace("{n}", String(i + 1)).replace("{total}", String(total))}
              aria-current={i === index}
              className={
                "relative size-16 overflow-hidden rounded-[var(--radius-xs)] border bg-[var(--img-plate)] transition-colors duration-[var(--dur-1)] " +
                (i === index
                  ? "border-[var(--accent)]"
                  : "border-[var(--line)] hover:border-[var(--line-strong)]")
              }
            >
              <Image src={img.url} alt="" fill sizes="64px" className="object-contain p-[8%] [mix-blend-mode:var(--img-blend)]" />
            </button>
          ))}
        </div>
      ) : null}

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        aria-label={eticheta(index)}
        /* Click pe fundal inchide. `<dialog>` primeste evenimentul si pe
           `::backdrop`, deci se verifica daca tinta e chiar dialogul. */
        onClick={(e) => { if (e.target === dialogRef.current) setOpen(false); }}
        onTouchStart={(e) => {
          const p = e.touches[0];
          atingere.current = { x: p.clientX, y: p.clientY };
        }}
        onTouchEnd={(e) => {
          const start = atingere.current;
          atingere.current = null;
          if (!start || !multe) return;
          const p = e.changedTouches[0];
          const dx = p.clientX - start.x;
          /* Un gest vertical e scroll sau inchidere, nu schimbare de poza. */
          if (Math.abs(dx) < 48 || Math.abs(p.clientY - start.y) > Math.abs(dx)) return;
          mergiLa(index + (dx < 0 ? 1 : -1));
        }}
        /* Dialogul E ecranul: latime si inaltime pline, fara margine si fara
           fundal propriu. Varianta cu `max-w` + `m-auto` lasa continutul de
           760px sa iasa din viewport pe telefon, cu butonul de inchidere afara. */
        /* Intunecarea sta pe dialogul insusi, nu doar pe `::backdrop`: dialogul
           acopera oricum tot ecranul, iar asa nu depinde de cum picteaza fiecare
           browser stratul de deasupra. `::backdrop` ramane ca al doilea strat. */
        className="fixed inset-0 m-0 h-[100dvh] max-h-none w-screen max-w-none border-0 bg-[var(--overlay)] p-0 text-[var(--ink)] backdrop:bg-[var(--overlay)]"
      >
        {/* Continutul se monteaza doar cat e deschis: fotografia mare nu se
            descarca pentru cineva care nu apasa niciodata pe poza, iar cand o
            apasa se incarca imediat, nu lenes — e singurul lucru de pe ecran. */}
        {open ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-[var(--sp-3)] p-[var(--sp-4)]">
            {/* Cat de mare poate fi. Pe telefon fisa arata deja poza pe toata
                latimea, deci un lightbox cu marja ar da aceeasi dimensiune si
                omul ar simti ca n-a facut nimic: aici marja interioara scade de
                la 10% la 2%, iar anvelopa creste cu ~20% fata de pagina. */}
            <div className="relative w-full max-w-[min(96vw,86vh,760px)] overflow-hidden rounded-[var(--radius-md)] bg-[var(--img-plate)]">
              <div className="relative aspect-square w-full">
                <Image
                  key={images[index].url}
                  src={images[index].url}
                  alt={eticheta(index)}
                  fill
                  loading="eager"
                  sizes="(min-width: 900px) 760px, 96vw"
                  className="object-contain p-[2%] [mix-blend-mode:var(--img-blend)]"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={d.close}
              className="absolute right-[var(--sp-4)] top-[var(--sp-4)] grid size-11 place-items-center rounded-[var(--radius-xs)] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-strong)] shadow-[var(--shadow-2)]"
            >
              <IconClose size={18} />
            </button>

            {multe ? (
              <>
                <button
                  type="button"
                  onClick={() => mergiLa(index - 1)}
                  aria-label={d.previous}
                  className="absolute left-[var(--sp-3)] top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-[var(--radius-xs)] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-strong)] shadow-[var(--shadow-2)]"
                >
                  <IconChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => mergiLa(index + 1)}
                  aria-label={d.next}
                  className="absolute right-[var(--sp-3)] top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-[var(--radius-xs)] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-strong)] shadow-[var(--shadow-2)]"
                >
                  <IconChevronRight size={18} />
                </button>
                <p className="text-200 tabular-nums text-[var(--surface)] [text-shadow:0_1px_2px_rgb(0_0_0/.5)]">
                  {index + 1} / {total}
                </p>
              </>
            ) : null}
          </div>
        ) : null}
      </dialog>
    </div>
  );
}

/** Lupa cu plus. Nu exista in setul de pictograme; e folosita doar aici. */
function IconZoom() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="M11 8v6M8 11h6M20 20l-3.6-3.6" />
    </svg>
  );
}
