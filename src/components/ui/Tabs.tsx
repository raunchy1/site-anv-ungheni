"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type TabItem = { id: string; label: string; content: ReactNode; count?: number };

/**
 * Indicatorul de tab activ e a doua utilizare permisa a rosului: o linie de
 * 2px sub eticheta, niciodata un fundal plin. O pastila rosie in spatele
 * textului ar consuma de zece ori mai multa suprafata pentru acelasi semnal.
 *
 * Tastatura: sageti stanga/dreapta, Home, End. Tabindex rotitor —
 * un singur tab e in ordinea de tabulare, ca in specificatia ARIA.
 */
export function Tabs({
  items,
  className,
  label,
}: {
  items: readonly TabItem[];
  className?: string;
  label: string;
}) {
  const base = useId();
  const [active, setActive] = useState(items[0]?.id ?? "");
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const move = (dir: 1 | -1 | "home" | "end") => {
    const i = items.findIndex((t) => t.id === active);
    const next =
      dir === "home"
        ? 0
        : dir === "end"
          ? items.length - 1
          : (i + dir + items.length) % items.length;
    const id = items[next].id;
    setActive(id);
    refs.current[id]?.focus();
  };

  return (
    <div className={cn("min-w-0", className)}>
      <div
        role="tablist"
        aria-label={label}
        className="scroll-x flex gap-[var(--sp-6)] border-b border-[var(--line-strong)]"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") { e.preventDefault(); move(1); }
          else if (e.key === "ArrowLeft") { e.preventDefault(); move(-1); }
          else if (e.key === "Home") { e.preventDefault(); move("home"); }
          else if (e.key === "End") { e.preventDefault(); move("end"); }
        }}
      >
        {items.map((tItem) => {
          const on = tItem.id === active;
          return (
            <button
              key={tItem.id}
              ref={(el) => {
                refs.current[tItem.id] = el;
              }}
              role="tab"
              id={`${base}-tab-${tItem.id}`}
              aria-selected={on}
              aria-controls={`${base}-panel-${tItem.id}`}
              tabIndex={on ? 0 : -1}
              onClick={() => setActive(tItem.id)}
              className={cn(
                "relative -mb-px flex min-h-11 shrink-0 items-center gap-[var(--sp-2)] whitespace-nowrap",
                "border-b-2 pb-[var(--sp-2)] text-300 font-semibold",
                "transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)]",
                on
                  ? "border-[var(--accent)] text-[var(--ink-strong)]"
                  : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink-strong)]",
              )}
            >
              {tItem.label}
              {typeof tItem.count === "number" ? (
                <span className="num text-200 font-normal text-[var(--ink-faint)]">
                  {tItem.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {items.map((tItem) => (
        <div
          key={tItem.id}
          role="tabpanel"
          id={`${base}-panel-${tItem.id}`}
          aria-labelledby={`${base}-tab-${tItem.id}`}
          hidden={tItem.id !== active}
          tabIndex={0}
          className="pt-[var(--sp-5)] outline-none"
        >
          {tItem.content}
        </div>
      ))}
    </div>
  );
}
