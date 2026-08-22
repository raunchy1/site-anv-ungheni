"use client";

import type { SelectHTMLAttributes } from "react";
import { useId } from "react";
import { cn } from "@/lib/cn";
import { IconChevronDown } from "@/components/icons";

export type SelectOption = { value: string; label: string; disabled?: boolean };

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  labelHidden?: boolean;
  options: readonly SelectOption[];
  placeholder?: string;
  hint?: string;
};

/**
 * `<select>` nativ, nu un meniu construit de la zero. Pe mobil — 70% din
 * trafic — selectorul nativ deschide roata sistemului, care e mai rapida si
 * mai familiara decat orice listbox rescris. Stilizam doar rama si chevronul.
 */
export function Select({
  label,
  labelHidden = false,
  options,
  placeholder,
  hint,
  className,
  id,
  ...rest
}: SelectProps) {
  const auto = useId();
  const selectId = id ?? auto;
  return (
    <div className={cn("flex flex-col gap-[var(--sp-2)]", className)}>
      <label htmlFor={selectId} className={cn("label", labelHidden && "sr-only-abs")}>
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          className={cn(
            "h-11 w-full appearance-none rounded-[var(--radius-sm)] border border-[var(--field-line)]",
            "bg-[var(--field-bg)] pl-[var(--sp-3)] pr-[var(--sp-10)]",
            "text-300 text-[var(--ink-strong)]",
            "transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)]",
            "hover:border-[var(--field-line-hover)]",
            "disabled:cursor-not-allowed disabled:text-[var(--ink-faint)] disabled:opacity-60",
          )}
          {...rest}
        >
          {placeholder ? (
            <option value="">{placeholder}</option>
          ) : null}
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
        <IconChevronDown
          size={18}
          className="pointer-events-none absolute right-[var(--sp-3)] top-1/2 -translate-y-1/2 text-[var(--ink-muted)]"
        />
      </div>
      {hint ? (
        <p className="text-200 text-[var(--ink-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}
