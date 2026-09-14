"use client";

import { useState, useTransition } from "react";
import { setReviewApproval } from "./actions";

export function ReviewActions({ id, isApproved }: { id: number; isApproved: boolean }) {
  const [approved, setApproved] = useState(isApproved);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  function setApproval(next: boolean) {
    const prev = approved;
    setApproved(next);
    setMessage(null);
    startTransition(async () => {
      const res = await setReviewApproval(id, next);
      if (res.ok) {
        setMessage({ tone: "ok", text: next ? "Aprobată." : "Respinsă." });
      } else {
        setApproved(prev);
        setMessage({ tone: "err", text: res.error });
      }
    });
  }

  return (
    <div className="flex flex-col gap-[var(--sp-1)]">
      <div className="flex flex-wrap items-center gap-[var(--sp-2)]">
        <span
          className={`whitespace-nowrap rounded-[var(--radius-xs)] border px-[var(--sp-2)] py-[2px] text-100 font-medium uppercase tracking-wide ${
            approved
              ? "border-[var(--ok)] text-[var(--ok)]"
              : "border-[var(--line-strong)] text-[var(--ink-muted)]"
          }`}
        >
          {approved ? "Aprobată" : "În așteptare"}
        </span>
        {!approved ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => setApproval(true)}
            className="h-8 rounded-[var(--radius-xs)] bg-[var(--accent)] px-[var(--sp-3)] text-200 font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            Aprobă
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => setApproval(false)}
            className="h-8 rounded-[var(--radius-xs)] border border-[var(--line-strong)] px-[var(--sp-3)] text-200 font-medium text-[var(--ink-strong)] hover:bg-[var(--surface-2)] disabled:opacity-50"
          >
            Respinge
          </button>
        )}
      </div>
      {message ? (
        <span className={`text-100 ${message.tone === "ok" ? "text-[var(--ok)]" : "text-[var(--warn)]"}`}>
          {message.text}
        </span>
      ) : null}
    </div>
  );
}
