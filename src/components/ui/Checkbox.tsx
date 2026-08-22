"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { useId } from "react";
import { cn } from "@/lib/cn";
import { IconCheck } from "@/components/icons";

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: ReactNode;
  /** Contorul din dreapta: „(6 944)”. Aliniat la dreapta, in cifre tabulare. */
  count?: string;
};

/**
 * Casuta e patrata cu raza 2px si bifa e din setul propriu de iconite, nu
 * din desenul sistemului. Zona de atingere e tot randul: 44px inaltime chiar
 * daca patratul are 18. Pe un filtru cu 134 de branduri, tinte de 18px ar fi
 * inutilizabile cu degetul.
 */
export function Checkbox({ label, count, className, id, ...rest }: CheckboxProps) {
  const auto = useId();
  const boxId = id ?? auto;
  return (
    <div className={cn("flex items-center", className)}>
      <input id={boxId} type="checkbox" className="peer sr-only-abs" {...rest} />
      <label
        htmlFor={boxId}
        className={cn(
          "flex min-h-11 w-full cursor-pointer select-none items-center gap-[var(--sp-3)]",
          "rounded-[var(--radius-xs)] px-[var(--sp-1)] text-300 text-[var(--ink)]",
          "transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)] hover:text-[var(--ink-strong)]",
          "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--accent)]",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-40",
          // Bifat: negru, nu rosu. Un filtru cu 12 casute bifate ar face 12
          // pete rosii pe ecran si ar consuma tot bugetul de accent.
          "peer-checked:[&>span:first-child]:border-[var(--ink-strong)]",
          "peer-checked:[&>span:first-child]:bg-[var(--ink-strong)]",
          "peer-checked:[&>span:first-child]:text-[var(--ink-invert)]",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "grid size-[18px] shrink-0 place-items-center rounded-[var(--radius-xs)]",
            "border border-[var(--field-line-hover)] bg-[var(--field-bg)] text-transparent",
            "transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)]",
          )}
        >
          <IconCheck size={13} strokeWidth={2.25} />
        </span>
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {count ? (
          <span className="num shrink-0 text-200 text-[var(--ink-muted)]">
            {count}
          </span>
        ) : null}
      </label>
    </div>
  );
}
