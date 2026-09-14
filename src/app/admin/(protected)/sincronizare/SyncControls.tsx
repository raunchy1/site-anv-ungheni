"use client";

import { useState, useTransition } from "react";
import { resolveQuarantine, runSyncDryRun, type QuarantineResolution } from "./actions";

export function DryRunButtons() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [detail, setDetail] = useState<string | null>(null);

  function run(mode: "new" | "refresh") {
    setMessage(null);
    setDetail(null);
    startTransition(async () => {
      const res = await runSyncDryRun(mode);
      if (res.ok) {
        setMessage({ tone: "ok", text: res.message ?? "OK" });
        if (res.body) setDetail(JSON.stringify(res.body, null, 2));
      } else {
        setMessage({ tone: "err", text: res.error });
      }
    });
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--surface)] p-[var(--sp-4)]">
      <h2 className="text-300 font-semibold text-[var(--ink-strong)]">Rulare de probă (dry-run)</h2>
      <p className="mt-[var(--sp-1)] text-200 text-[var(--ink-muted)]">
        Apelează <code className="text-[var(--ink)]">/api/cron/sync?dry=1</code> pe server cu CRON_SECRET — nu scrie
        nimic în catalog. Poate dura câteva minute.
      </p>
      <div className="mt-[var(--sp-3)] flex flex-wrap gap-[var(--sp-2)]">
        <button
          type="button"
          disabled={pending}
          onClick={() => run("new")}
          className="h-10 rounded-[var(--radius-xs)] bg-[var(--accent)] px-[var(--sp-4)] text-300 font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {pending ? "Rulează…" : "Dry-run produse noi"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run("refresh")}
          className="h-10 rounded-[var(--radius-xs)] border border-[var(--line-strong)] px-[var(--sp-4)] text-300 font-medium text-[var(--ink-strong)] hover:bg-[var(--surface-2)] disabled:opacity-50"
        >
          Dry-run refresh preț/stoc
        </button>
      </div>
      {message ? (
        <p className={`mt-[var(--sp-3)] text-300 ${message.tone === "ok" ? "text-[var(--ok)]" : "text-[var(--warn)]"}`}>
          {message.text}
        </p>
      ) : null}
      {detail ? (
        <pre className="mt-[var(--sp-2)] max-h-64 overflow-auto rounded-[var(--radius-sm)] bg-[var(--bg-sunken)] p-[var(--sp-3)] text-100 text-[var(--ink)]">
          {detail}
        </pre>
      ) : null}
    </div>
  );
}

export function QuarantineActions({ id }: { id: number }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [done, setDone] = useState(false);

  function resolve(resolution: QuarantineResolution) {
    setMessage(null);
    startTransition(async () => {
      const res = await resolveQuarantine(id, resolution);
      if (res.ok) {
        setDone(true);
        setMessage({ tone: "ok", text: res.message ?? "OK" });
      } else {
        setMessage({ tone: "err", text: res.error });
      }
    });
  }

  if (done) {
    return <span className="text-200 text-[var(--ok)]">{message?.text ?? "Rezolvat"}</span>;
  }

  return (
    <div className="flex flex-col gap-[var(--sp-1)]">
      <div className="flex flex-wrap gap-[var(--sp-1)]">
        {(
          [
            ["approved", "Aprobă"],
            ["rejected", "Respinge"],
            ["ignored", "Ignoră"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            disabled={pending}
            onClick={() => resolve(value)}
            className="h-8 rounded-[var(--radius-xs)] border border-[var(--line-strong)] px-[var(--sp-2)] text-100 font-medium text-[var(--ink-strong)] hover:bg-[var(--surface-2)] disabled:opacity-50"
          >
            {label}
          </button>
        ))}
      </div>
      {message ? (
        <span className={`text-100 ${message.tone === "ok" ? "text-[var(--ok)]" : "text-[var(--warn)]"}`}>
          {message.text}
        </span>
      ) : null}
    </div>
  );
}
