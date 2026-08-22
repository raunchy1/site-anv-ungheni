"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconAlert, IconCheck, IconClose, IconInfo } from "@/components/icons";

export type ToastTone = "info" | "success" | "problem";

/**
 * Toast-ul confirma o actiune deja intamplata. Nu are buton primar, nu are
 * culoare de fundal si nu are contor de timp vizibil — cronometrul care se
 * scurge cere atentie exact cand utilizatorul e ocupat cu altceva.
 *
 * Iconita poarta tot semnalul cromatic. `role=status` pentru info/succes,
 * `role=alert` pentru problema: diferenta decide daca cititorul de ecran
 * intrerupe sau asteapta.
 */
export function Toast({
  tone = "info",
  title,
  body,
  action,
  onDismiss,
  className,
}: {
  tone?: ToastTone;
  title: string;
  body?: string;
  action?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  const Icon = tone === "success" ? IconCheck : tone === "problem" ? IconAlert : IconInfo;
  const iconColor =
    tone === "success"
      ? "text-[var(--ok)]"
      : tone === "problem"
        ? "text-[var(--warn)]"
        : "text-[var(--ink-muted)]";

  return (
    <div
      role={tone === "problem" ? "alert" : "status"}
      aria-live={tone === "problem" ? "assertive" : "polite"}
      className={cn(
        "flex w-full max-w-md items-start gap-[var(--sp-3)] rounded-[var(--radius-sm)]",
        "border border-[var(--line-strong)] bg-[var(--surface)] p-[var(--sp-4)] shadow-[var(--shadow-2)]",
        className,
      )}
    >
      <span className={cn("mt-[2px] shrink-0", iconColor)}>
        <Icon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-300 font-semibold text-[var(--ink-strong)]">
          {title}
        </p>
        {body ? (
          <p className="mt-[var(--sp-1)] text-200 text-[var(--ink-muted)]">{body}</p>
        ) : null}
        {action ? <div className="mt-[var(--sp-3)]">{action}</div> : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="✕"
          className="-m-[var(--sp-1)] grid size-8 shrink-0 place-items-center rounded-[var(--radius-xs)] text-[var(--ink-muted)] transition-colors duration-[var(--dur-1)] hover:bg-[var(--surface-2)] hover:text-[var(--ink-strong)]"
        >
          <IconClose size={15} />
        </button>
      ) : null}
    </div>
  );
}
