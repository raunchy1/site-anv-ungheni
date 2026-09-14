"use client";

import { useState, useTransition } from "react";
import { updateOrderStatus, type OrderStatus } from "./actions";

const OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "nou", label: "Nouă" },
  { value: "confirmat", label: "Confirmată" },
  { value: "in_livrare", label: "În livrare" },
  { value: "finalizat", label: "Finalizată" },
  { value: "anulat", label: "Anulată" },
];

export function OrderStatusSelect({ id, status }: { id: number; status: OrderStatus }) {
  const [value, setValue] = useState(status);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  function onChange(next: OrderStatus) {
    const prev = value;
    setValue(next);
    setMessage(null);
    startTransition(async () => {
      const res = await updateOrderStatus(id, next);
      if (res.ok) {
        setMessage({ tone: "ok", text: "Salvat." });
      } else {
        setValue(prev);
        setMessage({ tone: "err", text: res.error });
      }
    });
  }

  return (
    <div className="flex flex-col gap-[var(--sp-1)]">
      <select
        value={value}
        disabled={pending}
        onChange={(e) => onChange(e.target.value as OrderStatus)}
        className="h-9 rounded-[var(--radius-sm)] border border-[var(--field-line)] bg-[var(--field-bg)] px-[var(--sp-2)] text-200 outline-none focus:border-[var(--accent)] disabled:opacity-60"
        aria-label="Stare comandă"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {message ? (
        <span className={`text-100 ${message.tone === "ok" ? "text-[var(--ok)]" : "text-[var(--warn)]"}`}>
          {message.text}
        </span>
      ) : null}
    </div>
  );
}
