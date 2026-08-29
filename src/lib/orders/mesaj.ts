import type { Locale } from "@/lib/types";

/**
 * Textul comenzii, într-un singur loc.
 *
 * Aceeași comandă pleacă pe două canale — e-mail către atelier și WhatsApp — și
 * ele TREBUIE să spună exact același lucru. Dacă textul ar fi scris de două ori,
 * s-ar despărți la prima modificare, iar cineva ar suna clientul cu alt total
 * decât cel din e-mail.
 *
 * Formatul e gândit pentru un telefon ținut într-o mână în atelier: numărul
 * comenzii sus, marfa la mijloc, datele de contact jos, unde le cauți când
 * ridici telefonul să suni.
 */

export type OrderLine = {
  title: string;
  slug: string;
  price: number;
  qty: number;
};

export type OrderData = {
  orderNumber: string;
  customerName: string;
  phone: string;
  email: string | null;
  city: string;
  address: string | null;
  delivery: "ridicare_magazin" | "curier_ungheni" | "curier_moldova";
  payment: "numerar_livrare" | "numerar_magazin" | "transfer_bancar";
  wantsMounting: boolean;
  note: string | null;
  items: OrderLine[];
  subtotal: number;
  deliveryCost: number;
  total: number;
  locale: Locale;
};

const LIVRARE: Record<OrderData["delivery"], { ro: string; ru: string }> = {
  ridicare_magazin: { ro: "Ridicare din magazin", ru: "Самовывоз из магазина" },
  curier_ungheni: { ro: "Curier în Ungheni", ru: "Курьер по Унгенам" },
  curier_moldova: { ro: "Curier în toată Moldova", ru: "Курьер по Молдове" },
};

const PLATA: Record<OrderData["payment"], { ro: string; ru: string }> = {
  numerar_livrare: { ro: "Numerar la livrare", ru: "Наличными при доставке" },
  numerar_magazin: { ro: "Numerar în magazin", ru: "Наличными в магазине" },
  transfer_bancar: { ro: "Transfer bancar", ru: "Банковский перевод" },
};

export const etichetaLivrare = (d: OrderData["delivery"], l: Locale) => LIVRARE[d][l];
export const etichetaPlata = (p: OrderData["payment"], l: Locale) => PLATA[p][l];

/** `1 234` — grupare cu spațiu îngust, ca în restul site-ului. */
const bani = (n: number) => new Intl.NumberFormat("ro-MD", { maximumFractionDigits: 0 }).format(n);

/**
 * Varianta text: pentru WhatsApp și pentru partea `text/plain` a e-mailului.
 * Fără markdown — WhatsApp are propriile lui semne, iar `*` în mijlocul unui
 * titlu de anvelopă ar bolde jumătate de mesaj.
 */
export function comandaText(o: OrderData, siteUrl: string): string {
  const l = o.locale;
  const r = l === "ru";
  const linii = o.items.map(
    (i) => `• ${i.title}\n  ${i.qty} × ${bani(i.price)} = ${bani(i.price * i.qty)} MDL\n  ${siteUrl}/${i.slug}`,
  );

  const out = [
    r ? `НОВЫЙ ЗАКАЗ ${o.orderNumber}` : `COMANDĂ NOUĂ ${o.orderNumber}`,
    "",
    ...linii,
    "",
    `${r ? "Сумма" : "Subtotal"}: ${bani(o.subtotal)} MDL`,
    o.deliveryCost > 0 ? `${r ? "Доставка" : "Livrare"}: ${bani(o.deliveryCost)} MDL` : null,
    `${r ? "ИТОГО" : "TOTAL"}: ${bani(o.total)} MDL`,
    "",
    `${r ? "Клиент" : "Client"}: ${o.customerName}`,
    `${r ? "Телефон" : "Telefon"}: ${o.phone}`,
    o.email ? `E-mail: ${o.email}` : null,
    `${r ? "Доставка" : "Livrare"}: ${etichetaLivrare(o.delivery, l)}`,
    o.address ? `${r ? "Адрес" : "Adresă"}: ${o.city}, ${o.address}` : `${r ? "Город" : "Oraș"}: ${o.city}`,
    `${r ? "Оплата" : "Plată"}: ${etichetaPlata(o.payment, l)}`,
    o.wantsMounting ? (r ? "➕ Нужен шиномонтаж" : "➕ Dorește montaj") : null,
    o.note ? `${r ? "Примечание" : "Mențiune"}: ${o.note}` : null,
  ];

  return out.filter((x) => x !== null).join("\n");
}

/**
 * Varianta HTML, pentru e-mail.
 *
 * Tabel cu atribute, stiluri inline, fără clase și fără font extern: e singurul
 * fel de HTML pe care îl randează la fel Gmail, Outlook și clientul de pe
 * telefon. Nu e neglijență, e formatul cerut de mediu.
 */
export function comandaHtml(o: OrderData, siteUrl: string): string {
  const r = o.locale === "ru";
  const esc = (s: string) => s.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]!);

  const randuri = o.items.map((i) => `
    <tr>
      <td style="padding:12px 8px;border-bottom:1px solid #e6e2dd;font:14px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;color:#1a1a1a">
        <a href="${siteUrl}/${esc(i.slug)}" style="color:#1a1a1a;text-decoration:none">${esc(i.title)}</a>
      </td>
      <td style="padding:12px 8px;border-bottom:1px solid #e6e2dd;font:14px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;color:#57534e;text-align:right;white-space:nowrap">${i.qty} × ${bani(i.price)}</td>
      <td style="padding:12px 8px;border-bottom:1px solid #e6e2dd;font:14px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;color:#1a1a1a;text-align:right;white-space:nowrap"><strong>${bani(i.price * i.qty)}</strong></td>
    </tr>`).join("");

  const rand = (eticheta: string, valoare: string) => `
    <tr>
      <td style="padding:6px 0;font:14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#78716c;width:140px;vertical-align:top">${esc(eticheta)}</td>
      <td style="padding:6px 0;font:14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#1a1a1a"><strong>${esc(valoare)}</strong></td>
    </tr>`;

  return `<!doctype html>
<html lang="${o.locale}"><body style="margin:0;padding:24px 12px;background:#f5f3f0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e6e2dd;border-radius:8px">
  <tr><td style="padding:24px 20px 8px">
    <p style="margin:0;font:12px/1 -apple-system,Segoe UI,Roboto,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#78716c">${r ? "Новый заказ" : "Comandă nouă"}</p>
    <p style="margin:6px 0 0;font:600 24px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;color:#1a1a1a">${esc(o.orderNumber)}</p>
    <div style="height:3px;width:64px;margin-top:12px;background:#D40608"></div>
  </td></tr>

  <tr><td style="padding:16px 12px 0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${randuri}
      <tr>
        <td style="padding:12px 8px;font:14px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;color:#78716c" colspan="2">${r ? "Сумма" : "Subtotal"}</td>
        <td style="padding:12px 8px;font:14px/1.4 ui-monospace,Menlo,monospace;color:#57534e;text-align:right">${bani(o.subtotal)}</td>
      </tr>
      ${o.deliveryCost > 0 ? `<tr>
        <td style="padding:0 8px 12px;font:14px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;color:#78716c" colspan="2">${r ? "Доставка" : "Livrare"}</td>
        <td style="padding:0 8px 12px;font:14px/1.4 ui-monospace,Menlo,monospace;color:#57534e;text-align:right">${bani(o.deliveryCost)}</td>
      </tr>` : ""}
      <tr>
        <td style="padding:12px 8px;border-top:2px solid #1a1a1a;font:600 16px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;color:#1a1a1a" colspan="2">${r ? "ИТОГО" : "TOTAL"}</td>
        <td style="padding:12px 8px;border-top:2px solid #1a1a1a;font:600 18px/1.4 ui-monospace,Menlo,monospace;color:#1a1a1a;text-align:right;white-space:nowrap">${bani(o.total)} MDL</td>
      </tr>
    </table>
  </td></tr>

  <tr><td style="padding:8px 20px 24px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${rand(r ? "Клиент" : "Client", o.customerName)}
      ${rand(r ? "Телефон" : "Telefon", o.phone)}
      ${o.email ? rand("E-mail", o.email) : ""}
      ${rand(r ? "Доставка" : "Livrare", etichetaLivrare(o.delivery, o.locale))}
      ${rand(r ? "Адрес" : "Adresă", o.address ? `${o.city}, ${o.address}` : o.city)}
      ${rand(r ? "Оплата" : "Plată", etichetaPlata(o.payment, o.locale))}
      ${o.wantsMounting ? rand(r ? "Шиномонтаж" : "Montaj", r ? "Да, нужен" : "Da, dorește") : ""}
      ${o.note ? rand(r ? "Примечание" : "Mențiune", o.note) : ""}
    </table>

    <p style="margin:20px 0 0">
      <a href="tel:${esc(o.phone.replace(/\s/g, ""))}" style="display:inline-block;padding:12px 20px;background:#D40608;color:#ffffff;font:600 14px/1 -apple-system,Segoe UI,Roboto,sans-serif;text-decoration:none;border-radius:6px">${r ? "Позвонить клиенту" : "Sună clientul"}</a>
    </p>
  </td></tr>
</table>
</body></html>`;
}
