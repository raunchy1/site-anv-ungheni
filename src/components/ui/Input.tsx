"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { useId } from "react";
import { cn } from "@/lib/cn";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label: string;
  /** Ascunde eticheta vizual, o pastreaza pentru AT. Doar in bare de cautare. */
  labelHidden?: boolean;
  hint?: string;
  error?: string;
  iconStart?: ReactNode;
  actionEnd?: ReactNode;
};

/**
 * Eticheta e deasupra campului, mereu vizibila. Fara placeholder-ca-eticheta:
 * la 15.010 produse, utilizatorul se intoarce in acelasi camp de zeci de ori,
 * iar eticheta care dispare la focus il obliga sa-si aminteasca ce completa.
 *
 * Inaltimea e 44px, egala cu minimul de atingere, pe toate breakpoint-urile.
 * Un camp de 36px pe desktop si 44 pe mobil ar cere doua grile.
 */
export function Input({
  label,
  labelHidden = false,
  hint,
  error,
  iconStart,
  actionEnd,
  className,
  id,
  ...rest
}: InputProps) {
  const auto = useId();
  const inputId = id ?? auto;
  const hintId = `${inputId}-hint`;
  const errId = `${inputId}-err`;

  return (
    <div className={cn("flex flex-col gap-[var(--sp-2)]", className)}>
      <label
        htmlFor={inputId}
        className={cn("label", labelHidden && "sr-only-abs")}
      >
        {label}
      </label>

      <div
        className={cn(
          "flex h-11 items-center gap-[var(--sp-2)] rounded-[var(--radius-sm)] border bg-[var(--field-bg)]",
          "px-[var(--sp-3)] transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)]",
          "focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--accent)]",
          error
            ? "border-[var(--warn)]"
            : "border-[var(--field-line)] hover:border-[var(--field-line-hover)]",
        )}
      >
        {iconStart ? (
          <span className="shrink-0 text-[var(--ink-muted)]">{iconStart}</span>
        ) : null}
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errId : hint ? hintId : undefined}
          className={cn(
            "min-w-0 flex-1 bg-transparent text-300 text-[var(--ink-strong)]",
            "outline-none placeholder:text-[var(--ink-faint)]",
          )}
          {...rest}
        />
        {actionEnd ? <span className="shrink-0">{actionEnd}</span> : null}
      </div>

      {error ? (
        <p id={errId} className="text-200 text-[var(--warn)]">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-200 text-[var(--ink-muted)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
