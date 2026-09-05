"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { IconPhone, IconCheck, IconArrowRight } from "@/components/icons";
import { WhatsAppButton } from "@/components/product/WhatsAppButton";
import { useCart } from "@/lib/cart/store";
import { formatPrice, telLink } from "@/lib/format";
import { cn } from "@/lib/cn";
import { plaseazaComanda, type ComandaInput, type RezultatComanda } from "@/lib/orders/plaseaza";
import { COST_LIVRARE } from "@/lib/orders/livrare";
import type { Locale } from "@/lib/types";

/**
 * PLASAREA COMENZII, într-un singur ecran.
 *
 * Nu sunt pași. Un magazin cu 8.000 de anvelope și trei metode de livrare n-are
 * ce împărți în trei ecrane: tot ce trebuie completat încape pe unul, iar
 * totalul rămâne vizibil lângă câmpuri, nu după ele.
 *
 * Ce se cere: nume, telefon, localitate. Restul e opțional. Fiecare câmp în plus
 * e un motiv de abandon, iar un atelier care oricum sună clientul ca să confirme
 * ora nu are nevoie de adresa exactă la formular când marfa se ridică din magazin
 * — de aceea adresa apare doar la livrare prin curier.
 *
 * VALIDAREA SE ÎNTÂMPLĂ DE DOUĂ ORI: aici, ca omul să vadă imediat ce lipsește,
 * și pe server, unde e singura care contează.
 */

type Livrare = ComandaInput["delivery"];
type Plata = ComandaInput["payment"];

export function CheckoutForm({ locale, phone, phoneE164, oras }: {
  locale: Locale;
  phone: string;
  phoneE164: string;
  /** Orașul atelierului: precompletat, pentru că majoritatea clienților sunt de acolo. */
  oras: string;
}) {
  const t = useTranslations();
  const { items, subtotal, gata, goleste } = useCart();

  const [livrare, setLivrare] = useState<Livrare>("ridicare_magazin");
  const [plata, setPlata] = useState<Plata>("numerar_magazin");
  const [montaj, setMontaj] = useState(false);
  const [trimite, setTrimite] = useState(false);
  const [eroare, setEroare] = useState<string | null>(null);
  const [erori, setErori] = useState<Record<string, string>>({});
  const [gataComanda, setGataComanda] = useState<Extract<RezultatComanda, { ok: true }> | null>(null);

  const cerereAdresa = livrare !== "ridicare_magazin";
  const costLivrare = COST_LIVRARE[livrare];
  const total = subtotal + costLivrare;

  /* Plata în numerar își schimbă locul o dată cu livrarea — în magazin sau la
     curier — dar transferul bancar rămâne ales dacă era ales. Corectura se face
     la schimbarea livrării, nu într-un efect: un efect care scrie stare pe baza
     altei stări randează pagina de două ori la fiecare atingere. */
  function alegeLivrarea(l: Livrare) {
    setLivrare(l);
    setPlata((p) =>
      p === "transfer_bancar" ? p : l === "ridicare_magazin" ? "numerar_magazin" : "numerar_livrare",
    );
  }

  /* Coșul se golește DUPĂ ce comanda a fost confirmată, nu înainte: dacă
     trimiterea cade, marfa trebuie să fie încă acolo. */
  useEffect(() => { if (gataComanda) goleste(); }, [gataComanda, goleste]);

  if (gataComanda) return <Confirmare rezultat={gataComanda} phone={phone} phoneE164={phoneE164} />;

  if (gata && items.length === 0) {
    return (
      <div className="mt-[var(--sp-6)] rounded-[var(--radius-md)] border border-dashed border-[var(--line-strong)] px-[var(--sp-6)] py-[var(--sp-10)]">
        <p className="text-500 font-semibold text-[var(--ink-strong)]">{t("cart.empty")}</p>
        <Link href="/catalog" className="nav-link mt-[var(--sp-4)] inline-flex items-center gap-[var(--sp-2)] text-300">
          {t("nav.catalog")}
          <IconArrowRight size={16} />
        </Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const val = (k: string) => String(f.get(k) ?? "").trim();

    const noi: Record<string, string> = {};
    if (val("name").length < 2) noi.name = t("checkout.required");
    if (!/^(\+?373|0)\s?\d{2}[\s-]?\d{3}[\s-]?\d{3}$/.test(val("phone"))) noi.phone = t("checkout.invalidPhone");
    if (val("email") && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val("email"))) noi.email = t("checkout.invalidEmail");
    if (val("city").length < 2) noi.city = t("checkout.required");
    if (cerereAdresa && val("address").length < 3) noi.address = t("checkout.required");
    setErori(noi);
    if (Object.keys(noi).length > 0) {
      document.getElementById(`camp-${Object.keys(noi)[0]}`)?.focus();
      return;
    }

    setTrimite(true);
    setEroare(null);
    try {
      const rez = await plaseazaComanda({
        customerName: val("name"),
        phone: val("phone"),
        email: val("email"),
        city: val("city"),
        address: val("address"),
        delivery: livrare,
        payment: plata,
        wantsMounting: montaj,
        note: val("note"),
        hp: val("hp"),
        locale,
        items: items.map((i) => ({ id: i.id, qty: i.qty })),
      });

      if (rez.ok) setGataComanda(rez);
      else if (rez.eroare === "prea_multe") setEroare(t("checkout.errorTooMany", { phone }));
      else if (rez.eroare === "produs_indisponibil") setEroare(t("checkout.errorProduct", { name: rez.camp ?? "" }));
      else setEroare(t("checkout.errorGeneric", { phone }));
    } catch {
      setEroare(t("checkout.errorGeneric", { phone }));
    } finally {
      setTrimite(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-[var(--sp-6)] grid gap-[var(--sp-8)] lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <div className="flex flex-col gap-[var(--sp-8)]">
        {/* ---------------------------------------------------------- date */}
        <section>
          <h2 className="label">{t("checkout.contactSection")}</h2>
          <div className="mt-[var(--sp-4)] grid gap-[var(--sp-4)] sm:grid-cols-2">
            <Input id="camp-name" name="name" label={t("checkout.name")} autoComplete="name" required error={erori.name} />
            <Input id="camp-phone" name="phone" type="tel" inputMode="tel" label={t("checkout.phone")} autoComplete="tel" placeholder={phone} required error={erori.phone} />
            <Input id="camp-email" name="email" type="email" label={t("checkout.email")} autoComplete="email" hint={t("checkout.emailHint")} error={erori.email} className="sm:col-span-2" />
          </div>
        </section>

        {/* ------------------------------------------------------- livrare */}
        <section>
          <h2 className="label">{t("checkout.deliverySection")}</h2>
          <div className="mt-[var(--sp-4)] flex flex-col gap-[var(--sp-2)]">
            <Optiune name="livrare" checked={livrare === "ridicare_magazin"} onChange={() => alegeLivrarea("ridicare_magazin")}
              titlu={t("checkout.deliveryPickup")} detaliu={t("checkout.deliveryPickupHint")} />
            <Optiune name="livrare" checked={livrare === "curier_ungheni"} onChange={() => alegeLivrarea("curier_ungheni")}
              titlu={t("checkout.deliveryUngheni")} detaliu={t("checkout.deliveryUngheniHint")} />
            <Optiune name="livrare" checked={livrare === "curier_moldova"} onChange={() => alegeLivrarea("curier_moldova")}
              titlu={t("checkout.deliveryMoldova")} detaliu={t("checkout.deliveryMoldovaHint")} />
          </div>

          <div className="mt-[var(--sp-4)] grid gap-[var(--sp-4)] sm:grid-cols-2">
            <Input id="camp-city" name="city" label={t("checkout.city")} autoComplete="address-level2" defaultValue={oras} required error={erori.city} />
            {/* Adresa apare doar când chiar e nevoie de ea. */}
            {cerereAdresa ? (
              <Input id="camp-address" name="address" label={t("checkout.address")} autoComplete="street-address" hint={t("checkout.addressHint")} required error={erori.address} />
            ) : null}
          </div>
        </section>

        {/* ---------------------------------------------------------- plată */}
        <section>
          <h2 className="label">{t("checkout.paymentSection")}</h2>
          <div className="mt-[var(--sp-4)] flex flex-col gap-[var(--sp-2)]">
            {cerereAdresa ? (
              <Optiune name="plata" checked={plata === "numerar_livrare"} onChange={() => setPlata("numerar_livrare")} titlu={t("checkout.paymentCash")} />
            ) : (
              <Optiune name="plata" checked={plata === "numerar_magazin"} onChange={() => setPlata("numerar_magazin")} titlu={t("checkout.paymentShop")} />
            )}
            <Optiune name="plata" checked={plata === "transfer_bancar"} onChange={() => setPlata("transfer_bancar")} titlu={t("checkout.paymentTransfer")} />
          </div>
        </section>

        {/* -------------------------------------------------------- montaj */}
        <section>
          <Checkbox
            checked={montaj}
            onChange={(e) => setMontaj(e.target.checked)}
            label={t("checkout.mounting")}
            className="[&_span:last-child]:overflow-visible [&_span:last-child]:whitespace-normal"
          />
          <p className="measure mt-[var(--sp-2)] pl-[var(--sp-7)] text-200 text-[var(--ink-muted)]">{t("checkout.mountingHint")}</p>
        </section>

        <Input name="note" label={t("checkout.note")} hint={t("checkout.noteHint")} />

        {/* Capcana pentru boți. `tabIndex={-1}` și `aria-hidden` o scot și din
            calea tastaturii, și din cea a cititoarelor de ecran. */}
        <div aria-hidden="true" className="sr-only-abs">
          <label htmlFor="hp">Nu completa</label>
          <input id="hp" name="hp" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
        </div>
      </div>

      {/* -------------------------------------------------------- rezumat */}
      <aside className="lg:sticky lg:top-[76px] rounded-[var(--radius-md)] border border-[var(--line)] p-[var(--sp-5)]">
        <h2 className="label">{t("checkout.summary")}</h2>

        <ul className="mt-[var(--sp-4)] flex flex-col gap-[var(--sp-3)] border-b border-[var(--line)] pb-[var(--sp-4)]">
          {items.map((i) => (
            <li key={i.id} className="flex items-baseline justify-between gap-[var(--sp-3)] text-200">
              <span className="min-w-0 text-[var(--ink)]">
                <span className="num font-medium text-[var(--ink-strong)]">{i.qty}×</span> {i.title}
              </span>
              <span className="num shrink-0 text-[var(--ink-strong)]">{formatPrice(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-[var(--sp-4)] flex flex-col gap-[var(--sp-2)] text-200">
          <div className="flex justify-between">
            <dt className="text-[var(--ink-muted)]">{t("cart.subtotal")}</dt>
            <dd className="num text-[var(--ink-strong)]">{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--ink-muted)]">{t("checkout.delivery")}</dt>
            <dd className={cn("num", costLivrare === 0 ? "text-[var(--ink-muted)]" : "text-[var(--ink-strong)]")}>
              {costLivrare === 0 ? t("checkout.free") : formatPrice(costLivrare)}
            </dd>
          </div>
        </dl>

        <div className="mt-[var(--sp-4)] flex items-baseline justify-between border-t-2 border-[var(--ink-strong)] pt-[var(--sp-3)]">
          <span className="text-300 font-semibold text-[var(--ink-strong)]">{t("checkout.total")}</span>
          <span className="num text-600 font-semibold text-[var(--ink-strong)]" aria-live="polite">
            {formatPrice(total)} <span className="text-100 uppercase tracking-[var(--tr-label)] text-[var(--ink-muted)]">MDL</span>
          </span>
        </div>

        {eroare ? (
          <p role="alert" className="mt-[var(--sp-4)] rounded-[var(--radius-sm)] border border-[var(--warn)] bg-[var(--surface-2)] px-[var(--sp-4)] py-[var(--sp-3)] text-200 text-[var(--ink-strong)]">
            {eroare}
          </p>
        ) : null}

        <Button type="submit" variant="primary" size="lg" className="mt-[var(--sp-5)] w-full" disabled={trimite || !gata || items.length === 0}>
          {trimite ? t("checkout.submitting") : t("checkout.submit")}
        </Button>

        {/* INFORMARE, nu bifă. Pentru livrarea unei comenzi temeiul e executarea
            contractului, nu consimțământul; o casetă obligatorie „sunt de acord"
            ar cere un acord care oricum nu poate fi refuzat, adică unul fals.
            Ce datorăm omului aici e să-i spunem ce luăm și de ce, înainte să dea
            clic — și un drum de o apăsare spre textul complet. */}
        <p className="measure mt-[var(--sp-3)] text-100 text-[var(--ink-muted)]">
          {t("checkout.privacy")}{" "}
          <Link
            href={{
              pathname: "/[slug]",
              params: { slug: locale === "ru" ? "politika-konfidencialnosti" : "politica-de-confidentialitate" },
            }}
            className="nav-link underline"
          >
            {t("checkout.privacyLink")}
          </Link>
        </p>
      </aside>
    </form>
  );
}

/** Un rând de radio cu titlu și explicație, cu toată suprafața apăsabilă. */
function Optiune({ name, checked, onChange, titlu, detaliu }: {
  name: string; checked: boolean; onChange: () => void; titlu: string; detaliu?: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-[var(--sp-3)] rounded-[var(--radius-sm)] border px-[var(--sp-4)] py-[var(--sp-3)]",
        "transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)]",
        checked ? "border-[var(--ink-strong)] bg-[var(--surface-2)]" : "border-[var(--line)] hover:border-[var(--line-strong)]",
      )}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} className="mt-[3px] h-4 w-4 shrink-0 accent-[var(--accent)]" />
      <span className="min-w-0">
        <span className="block text-300 text-[var(--ink-strong)]">{titlu}</span>
        {detaliu ? <span className="mt-[2px] block text-200 text-[var(--ink-muted)]">{detaliu}</span> : null}
      </span>
    </label>
  );
}

/**
 * Confirmarea.
 *
 * Numărul comenzii e cel mai mare lucru de pe ecran, în mono: e singurul lucru
 * pe care omul trebuie să-l poată citi cuiva la telefon.
 *
 * WhatsApp-ul e o legătură, nu o trimitere automată. Comanda a ajuns deja la
 * atelier prin e-mail; butonul o duce și pe telefonul de service, cu textul
 * scris dinainte. Nu se deschide singur — un pop-up neanunțat e blocat de
 * browser și sperie omul care tocmai a lăsat un număr de telefon.
 */
function Confirmare({ rezultat, phone, phoneE164 }: {
  rezultat: Extract<RezultatComanda, { ok: true }>; phone: string; phoneE164: string;
}) {
  const t = useTranslations();
  return (
    <div className="mt-[var(--sp-6)] max-w-[560px]">
      <p className="inline-flex items-center gap-[var(--sp-2)] text-300 font-medium text-[var(--ink-strong)]">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--ink-strong)] text-[var(--surface)]">
          <IconCheck size={16} />
        </span>
        {t("checkout.doneTitle")}
      </p>

      <p className="label mt-[var(--sp-6)]">{t("checkout.doneNumber")}</p>
      <p className="num mt-[var(--sp-1)] text-800 font-semibold tracking-[var(--tr-title)] text-[var(--ink-strong)]">
        {rezultat.orderNumber}
      </p>

      {/* Totalul de aici e cel calculat de server, din prețurile de acum din
          bază — nu cel din coș. Dacă un preț s-a schimbat între adăugare și
          trimitere, ăsta e cel adevărat, și clientul îl vede înainte să închidă
          pagina, nu la telefon. */}
      <p className="mt-[var(--sp-4)] flex items-baseline gap-[var(--sp-2)]">
        <span className="text-300 text-[var(--ink-muted)]">{t("checkout.total")}</span>
        <span className="num text-500 font-semibold text-[var(--ink-strong)]">{formatPrice(rezultat.total)}</span>
        <span className="text-100 font-medium uppercase tracking-[var(--tr-label)] text-[var(--ink-muted)]">MDL</span>
      </p>

      <p className="measure mt-[var(--sp-5)] text-300 text-[var(--ink)]">{t("checkout.doneBody")}</p>

      <div className="mt-[var(--sp-6)] rounded-[var(--radius-md)] border border-[var(--line)] p-[var(--sp-5)]">
        <WhatsAppButton href={rezultat.whatsapp} message="" label={t("checkout.doneWhatsApp")} variant="primary" />
        <p className="measure mt-[var(--sp-3)] text-200 text-[var(--ink-muted)]">{t("checkout.doneWhatsAppHint")}</p>
      </div>

      <div className="mt-[var(--sp-5)] flex flex-wrap items-center gap-[var(--sp-4)]">
        <a href={telLink(phoneE164)} className="inline-flex min-h-11 items-center gap-[var(--sp-2)] rounded-[var(--radius-sm)] border border-[var(--line-strong)] px-[var(--sp-4)] text-300 text-[var(--ink-strong)]">
          <IconPhone size={16} />
          <span className="num">{phone}</span>
        </a>
        <Link href="/catalog" className="nav-link inline-flex items-center gap-[var(--sp-2)] text-200">
          {t("checkout.doneBack")}
          <IconArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
