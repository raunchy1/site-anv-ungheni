import { JsonLd } from "@/components/seo/JsonLd";
import { faqSchema } from "@/lib/seo/schema";
import { TreadRule } from "@/components/icons";
import type { Locale, Settings } from "@/lib/types";

/**
 * ÎNTREBĂRILE PE CARE LE PUNE OMUL ÎNAINTE SĂ CUMPERE.
 *
 * Nu e o secțiune de umplutură pentru Google. E singurul loc de pe site unde
 * scrie, în propoziții întregi, ce se întâmplă după ce apeși „comandă": cine
 * livrează, în cât timp, cu ce garanție, unde se montează. Un asistent întrebat
 * „cine livrează anvelope în Moldova" nu poate cita o bară de filtre — poate
 * cita un răspuns scris.
 *
 * REGULA: fiecare răspuns repetă o afirmație pe care site-ul o face deja în altă
 * parte — livrarea în 1–3 zile de pe fișa de produs, garanția din `settings`,
 * programul și adresa din subsol, creditul din insigna de pe card. Ce nu e
 * scris nicăieri nu se inventează aici, oricât ar ajuta la căutare: costul
 * livrării și termenul de retur lipsesc deliberat și sunt trecute în
 * TODO-CRISTIAN.md, pentru că sunt promisiuni pe care nu le pot face eu.
 *
 * Marcajul `FAQPage` are voie să conțină doar text care e ȘI vizibil pe pagină.
 * De aceea răspunsurile se randează, nu se ascund.
 */
export function intrebari(settings: Settings, locale: Locale): { q: string; a: string }[] {
  const ru = locale === "ru";
  const program = settings.opening_hours.mon_sat;
  const duminica = settings.opening_hours.sun;

  const lista: { q: string; a: string }[] = [
    ru
      ? {
          q: "Доставляете ли вы шины по всей Молдове?",
          a: `Да. Мы доставляем по всей Республике Молдова за 1–3 дня. Заказ можно оформить на сайте или по телефону ${settings.phone_display}.`,
        }
      : {
          q: "Livrați anvelope în toată Moldova?",
          a: `Da. Livrăm în toată Republica Moldova în 1–3 zile. Comanda se plasează pe site sau la telefon, la ${settings.phone_display}.`,
        },
    ru
      ? {
          q: "Где можно установить шины?",
          a: `В нашей мастерской по адресу ${settings.address}: шиномонтаж, балансировка, ремонт, накачка азотом и датчики давления TPMS. Полный список — на странице «Услуги»; цену называем по телефону или на месте.`,
        }
      : {
          q: "Unde pot monta anvelopele?",
          a: `În atelierul nostru din ${settings.address}: montaj, echilibrare, reparații, umflare cu azot și senzori de presiune TPMS. Lista completă e pe pagina Servicii; prețul îl dăm la telefon sau la fața locului.`,
        },
    ru
      ? {
          q: "Какая гарантия на шины?",
          a: `${settings.warranty_years} года гарантии на все новые шины из каталога. Мы продаём только новые шины — бывших в употреблении у нас нет.`,
        }
      : {
          q: "Ce garanție au anvelopele?",
          a: `${settings.warranty_years} ani garanție la toate anvelopele noi din catalog. Vindem exclusiv anvelope noi — nu avem anvelope rulate.`,
        },
    ru
      ? {
          q: "Как найти нужный размер?",
          a: "Размер написан на боковине шины, например 205/55 R16: ширина, высота профиля и диаметр диска. Введите три числа в подборщик на главной странице — каталог покажет всё, что есть в наличии в этом размере.",
        }
      : {
          q: "Cum găsesc dimensiunea de care am nevoie?",
          a: "Dimensiunea e scrisă pe flancul anvelopei, de exemplu 205/55 R16: lățimea, înălțimea profilului și diametrul jantei. Alege cele trei numere în selectorul de pe pagina principală și catalogul arată tot ce avem pe dimensiunea aceea.",
        },
    ru
      ? {
          q: "Какой у вас график работы?",
          a: `Понедельник–суббота, ${program}${duminica ? `, воскресенье ${duminica}` : ""}. Адрес: ${settings.address}. Телефон: ${settings.phone_display}.`,
        }
      : {
          q: "Care e programul atelierului?",
          a: `Luni–sâmbătă, ${program}${duminica ? `, duminică ${duminica}` : ""}. Adresa: ${settings.address}. Telefon: ${settings.phone_display}.`,
        },
  ];

  const credit = ru ? settings.credit_badge_ru : settings.credit_badge_ro;
  if (credit) {
    lista.push(
      ru
        ? { q: "Можно ли купить шины в рассрочку?", a: `Да: ${credit}. Условия уточняйте по телефону ${settings.phone_display}.` }
        : { q: "Pot cumpăra anvelope în rate?", a: `Da: ${credit}. Condițiile se confirmă la telefon, la ${settings.phone_display}.` },
    );
  }

  return lista;
}

export function Faq({ settings, locale }: { settings: Settings; locale: Locale }) {
  const qa = intrebari(settings, locale);
  const titlu = locale === "ru" ? "Частые вопросы" : "Întrebări frecvente";

  return (
    <section aria-labelledby="faq">
      <h2 id="faq" className="text-500 font-semibold text-[var(--ink-strong)]">{titlu}</h2>
      <TreadRule variant="full" className="mt-[var(--sp-3)] text-[var(--line)]" />
      <dl className="mt-[var(--sp-5)] grid gap-[var(--sp-5)] md:grid-cols-2">
        {qa.map(({ q, a }) => (
          <div key={q} className="max-w-[60ch]">
            <dt className="text-300 font-semibold text-[var(--ink-strong)]">{q}</dt>
            <dd className="mt-[var(--sp-2)] text-300 text-[var(--ink-muted)]">{a}</dd>
          </div>
        ))}
      </dl>
      <JsonLd data={faqSchema(qa)} />
    </section>
  );
}
