"use client";

import { useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { IconChevronDown, IconClose, IconSearch } from "@/components/icons";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { formatCount } from "@/lib/format";

export type ComboOption = { value: string; label: string; count?: number };

/**
 * Combobox pentru cele 134 de marci. Pattern-ul ARIA 1.2 combobox + listbox.
 *
 * Starea care conteaza aici e „o singura litera”: cu 134 de marci, `M`
 * intoarce 21 de rezultate — util. Cu 15.010 titluri de produs, `M` intoarce
 * o treime din catalog — inutil. De aceea pragul e configurabil (`minChars`)
 * si mesajul „mai scrie o litera” e o stare proiectata, nu o lista goala.
 */
export function Combobox({
  label,
  options,
  locale,
  placeholder,
  minChars = 1,
  className,
  onSelect,
}: {
  label: string;
  options: readonly ComboOption[];
  locale: Locale;
  placeholder?: string;
  minChars?: number;
  className?: string;
  onSelect?: (value: string) => void;
}) {
  const d = t(locale);
  const listId = useId();
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const norm = (s: string) =>
    s.toLocaleLowerCase("ro").normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const belowThreshold = query.trim().length > 0 && query.trim().length < minChars;

  const matches = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return options.slice(0, 8);
    if (q.length < minChars) return [];
    return options.filter((o) => norm(o.label).includes(q)).slice(0, 10);
  }, [query, options, minChars]);

  const commit = (o: ComboOption) => {
    setQuery(o.label);
    setOpen(false);
    onSelect?.(o.value);
  };

  return (
    <div className={cn("relative flex flex-col gap-[var(--sp-2)]", className)}>
      <label htmlFor={inputId} className="label">
        {label}
      </label>

      <div
        className={cn(
          "flex h-11 items-center gap-[var(--sp-2)] rounded-[var(--radius-sm)] border border-[var(--field-line)]",
          "bg-[var(--field-bg)] px-[var(--sp-3)]",
          "transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)] hover:border-[var(--field-line-hover)]",
          "focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--accent)]",
        )}
      >
        <IconSearch size={17} className="shrink-0 text-[var(--ink-muted)]" />
        <input
          id={inputId}
          ref={inputRef}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && matches[active] ? `${listId}-${active}` : undefined}
          value={query}
          placeholder={placeholder ?? d.searchPlaceholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((i) => Math.min(i + 1, matches.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && open && matches[active]) {
              e.preventDefault();
              commit(matches[active]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-300 text-[var(--ink-strong)] outline-none placeholder:text-[var(--ink-faint)]"
        />
        {query ? (
          <button
            type="button"
            aria-label={d.reset}
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="shrink-0 text-[var(--ink-muted)] transition-colors duration-[var(--dur-1)] hover:text-[var(--ink-strong)]"
          >
            <IconClose size={16} />
          </button>
        ) : (
          <IconChevronDown size={17} className="shrink-0 text-[var(--ink-muted)]" />
        )}
      </div>

      {open ? (
        <div
          className={cn(
            "absolute left-0 right-0 top-[calc(100%+var(--sp-1))] z-30 max-h-72 overflow-y-auto",
            "rounded-[var(--radius-sm)] border border-[var(--line-strong)] bg-[var(--surface)] shadow-[var(--shadow-2)]",
          )}
        >
          {belowThreshold ? (
            <p className="px-[var(--sp-3)] py-[var(--sp-4)] text-200 text-[var(--ink-muted)]">
              {d.typeMore}
            </p>
          ) : matches.length === 0 ? (
            <p className="px-[var(--sp-3)] py-[var(--sp-4)] text-200 text-[var(--ink-muted)]">
              {d.noResultsTitle}
            </p>
          ) : (
            <ul id={listId} role="listbox" aria-label={label}>
              {matches.map((o, i) => (
                <li
                  key={o.value}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    commit(o);
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-center justify-between gap-[var(--sp-3)]",
                    "border-b border-[var(--line)] px-[var(--sp-3)] text-300 last:border-b-0",
                    i === active
                      ? "bg-[var(--surface-2)] text-[var(--ink-strong)]"
                      : "text-[var(--ink)]",
                  )}
                >
                  <span className="truncate">{o.label}</span>
                  {typeof o.count === "number" ? (
                    <span className="num shrink-0 text-200 text-[var(--ink-muted)]">
                      {formatCount(o.count)}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
