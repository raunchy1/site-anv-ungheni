import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * O stare goala are trei parti si nici una in plus: ce s-a intamplat,
 * de ce, ce poti face acum. Fara ilustratie, fara scuze, fara semne de exclamare.
 * Iconita e mica si gri — daca ar fi mare si colorata, ar sarbatori esecul.
 */
export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
  tone = "neutral",
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
  /** `problem` marcheaza o eroare tehnica; schimba doar culoarea iconitei. */
  tone?: "neutral" | "problem";
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-[var(--sp-3)] border border-dashed border-[var(--line-strong)]",
        "rounded-[var(--radius-sm)] px-[var(--sp-6)] py-[var(--sp-10)]",
        className,
      )}
      role={tone === "problem" ? "alert" : undefined}
    >
      {icon ? (
        <span
          className={cn(
            tone === "problem" ? "text-[var(--warn)]" : "text-[var(--ink-faint)]",
          )}
        >
          {icon}
        </span>
      ) : null}
      <h3 className="text-500 font-semibold tracking-[var(--tr-title)] text-[var(--ink-strong)]">
        {title}
      </h3>
      {body ? (
        <p className="measure text-300 leading-normal text-[var(--ink-muted)]">
          {body}
        </p>
      ) : null}
      {action ? <div className="mt-[var(--sp-1)]">{action}</div> : null}
    </div>
  );
}
