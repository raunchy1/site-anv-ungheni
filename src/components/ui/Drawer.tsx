"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconClose } from "@/components/icons";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

/**
 * Acelasi `<dialog>` ca la Modal, alta ancorare: lipit de o margine.
 * Pe mobil intra de jos (`bottom`) — degetul e jos, iar un panou de filtre
 * care intra din dreapta cere o traversare a ecranului ca sa ajungi la el.
 * Pe desktop intra din dreapta si lasa catalogul vizibil.
 *
 * Bara de actiuni e lipita jos si contine contorul de rezultate: filtrele nu
 * se aplica „la inchidere”, se vad cat le potrivesti.
 */
export function Drawer({
  open,
  onClose,
  title,
  side = "right",
  footer,
  locale,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: "right" | "bottom";
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
      aria-labelledby="drawer-title"
      data-side={side}
      className={cn(
        "drawer-surface fixed max-h-full border-[var(--line-strong)] bg-[var(--surface)] p-0 text-[var(--ink)] shadow-[var(--shadow-3)]",
        side === "right"
          ? "inset-y-0 right-0 left-auto m-0 h-full w-[min(26rem,100vw)] border-l"
          : "inset-x-0 bottom-0 top-auto m-0 w-full rounded-t-[var(--radius-md)] border-t",
        className,
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-[var(--sp-4)] border-b border-[var(--line)] px-[var(--sp-5)] py-[var(--sp-4)]">
          <h2
            id="drawer-title"
            className="text-500 font-semibold tracking-[var(--tr-title)] text-[var(--ink-strong)]"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={d.close}
            className="-mr-[var(--sp-2)] grid size-11 shrink-0 place-items-center rounded-[var(--radius-xs)] text-[var(--ink-muted)] transition-colors duration-[var(--dur-1)] hover:bg-[var(--surface-2)] hover:text-[var(--ink-strong)]"
          >
            <IconClose size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-[var(--sp-5)] py-[var(--sp-4)]">
          {children}
        </div>

        {footer ? (
          <div className="border-t border-[var(--line)] bg-[var(--bg-sunken)] px-[var(--sp-5)] py-[var(--sp-4)]">
            {footer}
          </div>
        ) : null}
      </div>
    </dialog>
  );
}
