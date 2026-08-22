import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "text";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Iconita inaintea etichetei. Optica: iconita si text pe aceeasi linie de baza. */
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
  /** Ocupa toata latimea. Pe mobil, actiunea primara e mereu full-width. */
  block?: boolean;
};

/**
 * REGULA CELOR 5%: `primary` e singurul buton rosu si apare O SINGURA DATA pe ecran.
 * Al doilea buton rosu pe acelasi ecran e un bug de design, nu o optiune.
 * Restul actiunilor sunt `secondary` (contur) sau `text`.
 *
 * Inaltimile: 36 / 44 / 52. `md` = 44 = minimul de atingere pe mobil.
 * `sm` se foloseste doar in bare de unelte pe desktop, niciodata ca actiune principala.
 */
const base =
  "relative inline-flex select-none items-center justify-center gap-[var(--sp-2)] " +
  "whitespace-nowrap border font-semibold " +
  "transition-[background-color,border-color,color] duration-[var(--dur-1)] ease-[var(--ease-out)] " +
  "disabled:cursor-not-allowed disabled:opacity-40";

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-[var(--accent)] text-[var(--on-accent)] " +
    "hover:bg-[var(--accent-hover)] active:bg-[var(--accent-hover)]",
  secondary:
    "border-[var(--line-strong)] bg-[var(--surface)] text-[var(--ink-strong)] " +
    "hover:border-[var(--ink-muted)] hover:bg-[var(--surface-2)]",
  text:
    "border-transparent bg-transparent px-0 text-[var(--ink-strong)] " +
    "underline decoration-[var(--line-strong)] decoration-1 underline-offset-[6px] " +
    "hover:decoration-[var(--ink-strong)]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 rounded-[var(--radius-xs)] px-[var(--sp-3)] text-200",
  md: "h-11 rounded-[var(--radius-xs)] px-[var(--sp-5)] text-300",
  lg: "h-13 rounded-[var(--radius-xs)] px-[var(--sp-6)] text-400",
};

export function Button({
  variant = "secondary",
  size = "md",
  iconStart,
  iconEnd,
  block = false,
  className,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        base,
        variants[variant],
        variant === "text" ? sizes[size].replace(/px-\S+/, "") : sizes[size],
        block && "w-full",
        className,
      )}
      {...rest}
    >
      {iconStart}
      <span className={cn(iconStart || iconEnd ? "" : "optical-left")}>{children}</span>
      {iconEnd}
    </button>
  );
}
