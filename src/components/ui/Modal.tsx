"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconClose } from "@/components/icons";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

/**
 * `<dialog>` nativ, cu `showModal()`. Blocarea focusului, `Escape`, inertizarea
 * restului paginii si stiva de dialoguri vin de la browser, gratis si corect.
 *
 * Deschiderea: 190ms, opacitate + 8px de translatie. Fara scale, fara blur pe
 * fundal. `::backdrop` e o culoare plata cu 44% opacitate — glassmorphism-ul
 * ar face ilizibil tabelul de specificatii din spate, care e tot continutul paginii.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  locale,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  footer?: ReactNode;
  locale: Locale;
  children?: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const d = t(locale);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      aria-labelledby="modal-title"
      className={cn(
        "dialog-surface m-auto w-[calc(100vw-var(--sp-8))] max-w-lg rounded-[var(--radius-md)]",
        "border border-[var(--line-strong)] bg-[var(--surface)] p-0 text-[var(--ink)] shadow-[var(--shadow-3)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-[var(--sp-4)] border-b border-[var(--line)] p-[var(--sp-5)]">
        <div className="min-w-0">
          <h2
            id="modal-title"
            className="text-500 font-semibold tracking-[var(--tr-title)] text-[var(--ink-strong)]"
          >
            {title}
          </h2>
          {description ? (
            <p className="measure mt-[var(--sp-2)] text-300 text-[var(--ink-muted)]">
              {description}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={d.close}
          className="-m-[var(--sp-2)] grid size-11 shrink-0 place-items-center rounded-[var(--radius-xs)] text-[var(--ink-muted)] transition-colors duration-[var(--dur-1)] hover:bg-[var(--surface-2)] hover:text-[var(--ink-strong)]"
        >
          <IconClose size={18} />
        </button>
      </div>

      {children ? <div className="p-[var(--sp-5)]">{children}</div> : null}

      {footer ? (
        <div className="flex flex-wrap justify-end gap-[var(--sp-2)] border-t border-[var(--line)] bg-[var(--bg-sunken)] p-[var(--sp-4)]">
          {footer}
        </div>
      ) : null}
    </dialog>
  );
}
