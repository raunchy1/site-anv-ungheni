"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { IconFilter, IconClose } from "@/components/icons";

/**
 * Filtrele, randate O SINGURĂ DATĂ.
 *
 * Înainte exista un `<aside class="hidden lg:block">` pentru desktop și un
 * `<dialog>` pentru mobil, fiecare cu propria copie a filtrelor. Cu 264 de
 * mărci în listă, a doua copie costa ~150 kB de HTML pe care jumătate din
 * vizitatori nu-i vedeau niciodată — și încă o dată pe atât în payload-ul RSC.
 * Aceleași noduri, plătite de două ori, la fiecare clic pe un filtru.
 *
 * Acum e un singur bloc: bară laterală pe desktop, foaie de jos pe telefon.
 * `<dialog>` nu se mai poate folosi (nu poate fi și element static de pagină),
 * deci comportamentul lui e refăcut explicit — `role="dialog"`, Escape,
 * clic pe fundal, focus pe butonul de închidere la deschidere și blocarea
 * derulării în spate. Sub `lg` nimic din astea nu se aplică: e o coloană.
 */
export function FiltersShell({
  label,
  resultsLabel,
  closeLabel,
  children,
}: {
  label: string;
  resultsLabel: string;
  closeLabel: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <div className="mb-[var(--sp-4)] lg:hidden">
        <Button
          variant="secondary"
          size="md"
          onClick={() => setOpen(true)}
          iconStart={<IconFilter size={16} />}
          className="w-full"
          aria-expanded={open}
        >
          {label}
        </Button>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-40 bg-[var(--overlay)] lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      <aside
        {...(open ? { role: "dialog", "aria-modal": true, "aria-label": label } : {})}
        className={cn(
          // desktop: coloană obișnuită, mereu vizibilă
          "lg:static lg:z-auto lg:block lg:max-h-none lg:overflow-visible lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none",
          open
            ? "fixed inset-x-0 bottom-0 top-[12vh] z-50 flex flex-col overflow-hidden rounded-t-[var(--radius-md)] border-t border-[var(--line-strong)] bg-[var(--surface)] shadow-[var(--shadow-3)]"
            : "hidden",
        )}
      >
        {open ? (
          <header className="flex items-center justify-between gap-[var(--sp-3)] border-b border-[var(--line)] px-[var(--sp-5)] py-[var(--sp-4)] lg:hidden">
            <h2 className="text-400 font-semibold text-[var(--ink-strong)]">{label}</h2>
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              className="icon-button"
              aria-label={closeLabel}
            >
              <IconClose size={18} />
            </button>
          </header>
        ) : null}

        <div className={cn(open && "flex-1 overflow-y-auto px-[var(--sp-5)] py-[var(--sp-5)] lg:p-0")}>
          {children}
        </div>

        {open ? (
          <div className="border-t border-[var(--line)] bg-[var(--surface)] px-[var(--sp-5)] py-[var(--sp-4)] lg:hidden">
            <p className="num mb-[var(--sp-3)] text-200 text-[var(--ink-muted)]" aria-live="polite">{resultsLabel}</p>
            <Button variant="primary" size="md" onClick={() => setOpen(false)} className="w-full">
              {closeLabel}
            </Button>
          </div>
        ) : null}
      </aside>
    </>
  );
}
