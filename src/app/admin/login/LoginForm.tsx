"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="mt-[var(--sp-8)] flex flex-col gap-[var(--sp-5)]">
      <div className="flex flex-col gap-[var(--sp-2)]">
        <label htmlFor="email" className="text-200 font-medium text-[var(--ink-muted)]">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="text"
          required
          autoComplete="username"
          placeholder="admin"
          className="h-11 rounded-[var(--radius-sm)] border border-[var(--field-line)] bg-[var(--field-bg)] px-[var(--sp-3)] text-300 text-[var(--ink-strong)] outline-none focus:border-[var(--accent)]"
        />
      </div>

      <div className="flex flex-col gap-[var(--sp-2)]">
        <label htmlFor="password" className="text-200 font-medium text-[var(--ink-muted)]">
          Parolă
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="h-11 rounded-[var(--radius-sm)] border border-[var(--field-line)] bg-[var(--field-bg)] px-[var(--sp-3)] text-300 text-[var(--ink-strong)] outline-none focus:border-[var(--accent)]"
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-200 text-[var(--warn)]">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-[var(--radius-xs)] bg-[var(--accent)] text-300 font-semibold text-[var(--on-accent)] transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Se conectează…" : "Intră în cont"}
      </button>
    </form>
  );
}
