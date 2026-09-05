"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * CONSIMȚĂMÂNTUL, cu categoriile pe care site-ul chiar le are.
 *
 * Nu există aici o categorie „analytics" și nici una „marketing", pentru că
 * site-ul nu încarcă niciun instrument de analiză și niciun pixel publicitar. Un
 * banner care ar cere voie pentru ele ar fi o minciună politicoasă — și, în
 * practică, e cel mai frecvent fel în care un banner de cookie devine nelegal:
 * declară altceva decât face pagina.
 *
 * Ce chiar există:
 *
 *   `necesare`  — `localStorage`, două chei: `au:cart` (coșul) și `au:size`
 *                 (ultima dimensiune căutată). Nu pleacă nicăieri de pe
 *                 dispozitiv, nu identifică pe nimeni, iar fără ele coșul nu
 *                 poate exista. Nu se pot refuza, deci nici nu se cer.
 *
 *   `harta`     — iframe-ul Google Maps de pe pagina de contact, de pe prima
 *                 pagină și de pe fișa de produs. E singurul lucru de pe site
 *                 care trimite date la un terț: încărcarea lui pune cookie-uri
 *                 Google și dezvăluie IP-ul vizitatorului. De asta e SINGURA
 *                 categorie care se cere, iar până la răspuns harta nu se
 *                 încarcă — nici măcar la derulare.
 *
 * Alegerea stă în `localStorage`, nu într-un cookie: e o preferință locală, iar
 * un cookie ar fi trimis la fiecare cerere fără să folosească nimănui.
 */

export type Categorii = { harta: boolean };

const IMPLICIT: Categorii = { harta: false };

/** Versiunea alegerii. Se urcă doar dacă apare o categorie nouă — atunci banner-ul reapare. */
const VERSIUNE = 1;
const CHEIE = "au:consim";

type Stocat = { v: number; alese: Categorii; la: string };

type Context = {
  /** `null` cât timp n-am citit încă `localStorage`, sau dacă omul n-a ales nimic. */
  alese: Categorii | null;
  /** false până la prima citire; blochează afișarea banner-ului la hidratare. */
  gata: boolean;
  accepta: (c?: Partial<Categorii>) => void;
  refuza: () => void;
  /** Redeschide alegerea — legat de „Setări cookie" din subsol. */
  redeschide: () => void;
  deschis: boolean;
};

const Ctx = createContext<Context | null>(null);

function citeste(): Categorii | null {
  try {
    const brut = localStorage.getItem(CHEIE);
    if (!brut) return null;
    const s = JSON.parse(brut) as Stocat;
    if (s?.v !== VERSIUNE || !s.alese) return null;
    return { ...IMPLICIT, ...s.alese };
  } catch {
    /* mod privat, stocare plină sau conținut stricat — ca și cum nimeni n-a ales */
    return null;
  }
}

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [alese, setAlese] = useState<Categorii | null>(null);
  const [gata, setGata] = useState(false);
  const [deschis, setDeschis] = useState(false);

  /* Citirea se face DUPĂ montare: pe server nu există `localStorage`, iar o
     citire la randare ar da altă marcare pe server față de client. Aceeași
     convenție ca la coș, inclusiv excepția de lint. */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAlese(citeste());
    setGata(true);
  }, []);

  /* Două file deschise pe același site au același răspuns. Cine retrage acordul
     într-una nu trebuie să găsească harta încărcată în cealaltă. */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === CHEIE) setAlese(citeste()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const scrie = useCallback((c: Categorii) => {
    setAlese(c);
    setDeschis(false);
    try {
      localStorage.setItem(CHEIE, JSON.stringify({ v: VERSIUNE, alese: c, la: new Date().toISOString() } satisfies Stocat));
    } catch {
      /* Alegerea se aplică oricum în sesiunea curentă; doar nu se ține minte. */
    }
  }, []);

  const valoare = useMemo<Context>(() => ({
    alese,
    gata,
    deschis,
    accepta: (c) => scrie({ ...IMPLICIT, harta: true, ...c }),
    refuza: () => scrie({ ...IMPLICIT }),
    redeschide: () => setDeschis(true),
  }), [alese, gata, deschis, scrie]);

  return <Ctx.Provider value={valoare}>{children}</Ctx.Provider>;
}

export function useConsent(): Context {
  const c = useContext(Ctx);
  if (!c) throw new Error("useConsent în afara lui ConsentProvider");
  return c;
}

/**
 * A dat omul voie pentru categoria asta?
 *
 * Implicit NU — inclusiv cât timp `localStorage` n-a fost încă citit. Un „da"
 * optimist la hidratare ar încărca harta pentru o fracțiune de secundă înainte
 * să aflăm că răspunsul e nu, iar cookie-urile Google ar fi deja puse.
 */
export function usePermis(categorie: keyof Categorii): boolean {
  const { alese } = useConsent();
  return alese?.[categorie] === true;
}
