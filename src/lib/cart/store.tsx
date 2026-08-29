"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * COȘUL. Trăiește în `localStorage`, nu în bază.
 *
 * Nu există conturi și nu vrem să existe: șoferul care caută 205/55 R16 nu-și
 * face cont ca să afle prețul. Un coș pe server ar cere sesiune, cookie și o
 * masă de curățat; unul în browser costă zero și supraviețuiește închiderii
 * paginii, care e tot ce trebuie.
 *
 * Ce se ține: identitatea produsului și cât a costat CÂND a fost adăugat.
 * Prețul salvat e doar pentru afișare — la plasarea comenzii totul se
 * recalculează pe server, din bază. Altfel oricine ar putea edita
 * `localStorage` și comanda patru anvelope cu un leu.
 */

export type CartItem = {
  id: number;
  slug: string;
  title: string;
  price: number;
  qty: number;
  image: string | null;
  size: string | null;
  brand: string | null;
};

const KEY = "au:cos";
/** Ridicat manual când forma unui articol se schimbă; coșurile vechi se ignoră. */
const VERSION = 1;

type Stored = { v: number; items: CartItem[] };

type CartApi = {
  items: CartItem[];
  count: number;
  subtotal: number;
  /** `gata` e false până la prima citire din `localStorage`, ca antetul să nu
      clipească cu „0" înainte să afle adevărul. */
  gata: boolean;
  adauga: (item: Omit<CartItem, "qty">, qty?: number) => void;
  seteazaCantitatea: (id: number, qty: number) => void;
  scoate: (id: number) => void;
  goleste: () => void;
};

const Ctx = createContext<CartApi | null>(null);

function citeste(): CartItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Stored;
    if (parsed?.v !== VERSION || !Array.isArray(parsed.items)) return [];
    return parsed.items.filter((i) => typeof i?.id === "number" && i.qty > 0);
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [gata, setGata] = useState(false);

  /* Citirea se face DUPĂ montare: pe server nu există `localStorage`, iar o
     randare inițială cu articole ar produce nepotrivire de hidratare. */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(citeste());
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGata(true);
  }, []);

  useEffect(() => {
    if (!gata) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ v: VERSION, items } satisfies Stored));
    } catch { /* mod privat sau cotă plină */ }
  }, [items, gata]);

  /* Două file deschise pe același site sunt același coș. Fără asta, cine adaugă
     într-o filă și plasează comanda din alta pierde jumătate din marfă. */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) setItems(citeste()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const adauga = useCallback((item: Omit<CartItem, "qty">, qty = 4) => {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.id === item.id);
      if (i === -1) return [...prev, { ...item, qty }];
      const next = [...prev];
      next[i] = { ...next[i], qty: next[i].qty + qty, price: item.price };
      return next;
    });
  }, []);

  const seteazaCantitatea = useCallback((id: number, qty: number) => {
    setItems((prev) =>
      qty <= 0 ? prev.filter((x) => x.id !== id) : prev.map((x) => (x.id === id ? { ...x, qty } : x)),
    );
  }, []);

  const scoate = useCallback((id: number) => setItems((prev) => prev.filter((x) => x.id !== id)), []);
  const goleste = useCallback(() => setItems([]), []);

  const value = useMemo<CartApi>(() => ({
    items,
    count: items.reduce((n, i) => n + i.qty, 0),
    subtotal: items.reduce((s, i) => s + i.price * i.qty, 0),
    gata,
    adauga,
    seteazaCantitatea,
    scoate,
    goleste,
  }), [items, gata, adauga, seteazaCantitatea, scoate, goleste]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart în afara CartProvider");
  return ctx;
}
