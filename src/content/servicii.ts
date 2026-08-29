/**
 * Catalogul de servicii al atelierului, cu prețuri.
 *
 * Sursa: `AnvelopeUngheniServiciisiPreturi.docx`, generat din aplicația de
 * gestiune. Textele românești sunt COPIATE din document, nu rescrise — sunt
 * textele clientului, iar prețurile sunt cele oficiale.
 *
 * Traducerea rusă e făcută de mine și are nevoie de o citire a unui vorbitor
 * nativ înainte de lansare (vezi `TODO-CRISTIAN.md`).
 *
 * De ce stă conținutul în cod și nu în bază: e material redacțional, se
 * schimbă la câteva luni, are structură (tabele cu 7 coloane, liste, îndemnuri)
 * și trebuie versionat împreună cu pagina care-l randează. Tabela `services`
 * din bază rămâne ce era — cele 9 pagini de serviciu indexate — iar catalogul
 * de aici trimite spre ele prin `dbSlug`.
 *
 * `«telefon»` din document NU e scris aici: numărul vine din `settings`, ca
 * peste tot în site.
 */

import type { Locale } from "@/lib/types";

export type Bilingv = { ro: string; ru: string };

/** Un tabel de prețuri. Prima coloană e eticheta, restul sunt cifre. */
export type TabelPreturi = {
  titlu?: Bilingv;
  coloane: Bilingv[];
  randuri: string[][];
  nota?: Bilingv;
};

export type Serviciu = {
  /** Ancoră în pagină și cheie de listă. */
  id: string;
  /** Numărul din document — ordinea e a clientului, nu a mea. */
  numar: string;
  titlu: Bilingv;
  /** Prima propoziție, cea care oprește derularea. */
  carlig: Bilingv;
  corp: Bilingv;
  include?: { titlu: Bilingv; puncte: Bilingv[] };
  tabele: TabelPreturi[];
  /** Îndemnul de la finalul capitolului; `{tel}` se înlocuiește la randare. */
  indemn: Bilingv;
  /** Slug-ul paginii de serviciu existente, unde există una. */
  dbSlug?: string;
  foto: { fisier: string; alt: Bilingv; sursa: string; autor: string; licenta: string; pagina: string };
};

const t = (ro: string, ru: string): Bilingv => ({ ro, ru });

export const SERVICII: Serviciu[] = [
  {
    id: "service-roti",
    numar: "01",
    dbSlug: "schimbul-rotilor",
    titlu: t("Service roți și vulcanizare", "Шиномонтаж и вулканизация"),
    carlig: t(
      "Vibrează volanul la 90 km/h? Nu e drumul. E o roată dezechilibrată cu 15 grame.",
      "Руль вибрирует на 90 км/ч? Дело не в дороге. Дело в колесе, разбалансированном на 15 граммов.",
    ),
    corp: t(
      "Echilibrarea corectă nu este un moft: o roată dezechilibrată uzează neuniform anvelopa, obosește rulmenții și amortizoarele și îți mănâncă din aderență exact când frânezi mai tare. Facem montaj și echilibrare pe echipament pentru jante de la R15 la R24, inclusiv jante de aliaj cu profil jos și microbuze.",
      "Правильная балансировка — не прихоть: разбалансированное колесо изнашивает шину неравномерно, нагружает подшипники и амортизаторы и забирает сцепление именно тогда, когда вы тормозите сильнее всего. Выполняем монтаж и балансировку на оборудовании для дисков от R15 до R24, включая литые диски с низким профилем и микроавтобусы.",
    ),
    include: {
      titlu: t("Ce include serviciul complet", "Что входит в полный сервис"),
      puncte: [
        t("Scoaterea roților de pe mașină", "Снятие колёс с автомобиля"),
        t("Demontarea anvelopei de pe jantă și montarea celei noi", "Демонтаж шины с диска и установка новой"),
        t("Echilibrare computerizată, cu greutăți potrivite tipului de jantă", "Компьютерная балансировка с грузиками под тип диска"),
        t("Verificarea presiunii și montarea roților înapoi pe mașină", "Проверка давления и установка колёс обратно"),
      ],
    },
    tabele: [
      {
        titlu: t("Prețuri pe diametru și tip de vehicul (lei)", "Цены по диаметру и типу автомобиля (леев)"),
        coloane: [
          t("Diametru", "Диаметр"),
          t("Tip", "Тип"),
          t("Scos roată", "Снятие колеса"),
          t("Montat / demontat", "Монтаж / демонтаж"),
          t("Echilibrat", "Балансировка"),
          t("Service complet (4 roți)", "Полный сервис (4 колеса)"),
          t("Preț / roată", "Цена / колесо"),
        ],
        randuri: [
          ["R15", "AUTO", "25", "25", "40", "360", "90"],
          ["R15", "SUV", "30", "30", "50", "440", "110"],
          ["R15", "AT/MT", "35", "35", "55", "500", "125"],
          ["R16", "AUTO", "30", "25", "40", "380", "95"],
          ["R16", "SUV", "30", "30", "50", "440", "110"],
          ["R16", "AT/MT", "35", "35", "55", "500", "125"],
          ["R17", "AUTO", "30", "30", "50", "440", "110"],
          ["R17", "SUV", "35", "35", "55", "500", "125"],
          ["R17", "AT/MT", "45", "40", "65", "600", "150"],
          ["R18", "AUTO", "35", "35", "55", "500", "125"],
          ["R18", "SUV", "40", "35", "65", "560", "140"],
          ["R19", "AUTO", "40", "35", "60", "540", "135"],
          ["R19", "SUV", "45", "40", "65", "600", "150"],
          ["R20", "AUTO", "45", "45", "85", "700", "175"],
          ["R20", "SUV", "50", "75", "100", "900", "225"],
          ["R21", "AUTO", "50", "75", "125", "1000", "250"],
          ["R21", "SUV", "65", "85", "150", "1200", "300"],
          ["R22", "AUTO", "60", "75", "140", "1100", "275"],
          ["R22", "SUV", "65", "85", "150", "1200", "300"],
          ["R23", "SUV", "75", "100", "200", "1500", "375"],
          ["R24", "SUV", "75", "100", "200", "1500", "375"],
          ["R15C", "Tablă", "30", "30", "40", "400", "100"],
          ["R15C", "Aliaj", "30", "30", "50", "440", "110"],
          ["R15C", "Microbus", "30", "30", "40", "400", "100"],
          ["R16C", "Tablă", "30", "30", "50", "440", "110"],
          ["R16C", "Aliaj", "35", "35", "55", "500", "125"],
          ["R16C", "Microbus", "30", "35", "55", "480", "120"],
        ],
        nota: t(
          "„Service complet” este pachetul pentru toate cele 4 roți. Dacă ai nevoie doar de o operațiune, o poți plăti separat, la bucată. Prețurile pe coloanele „Scos roată”, „Montat / demontat” și „Echilibrat” sunt per roată.",
          "«Полный сервис» — это пакет на все 4 колеса. Если нужна только одна операция, её можно оплатить отдельно, поштучно. Цены в колонках «Снятие колеса», «Монтаж / демонтаж» и «Балансировка» указаны за одно колесо.",
        ),
      },
    ],
    indemn: t(
      "Vino fără programare sau sună la {tel}. Un set complet de 4 roți durează în medie 30–40 de minute.",
      "Приезжайте без записи или позвоните по номеру {tel}. Полный комплект из 4 колёс занимает в среднем 30–40 минут.",
    ),
    foto: {
      fisier: "service-roti.jpg",
      alt: t("Mașină de demontat anvelope într-un atelier", "Шиномонтажный станок в мастерской"),
      sursa: "Wikimedia Commons",
      autor: "Flippin504",
      licenta: "CC BY 3.0",
      pagina: "https://commons.wikimedia.org/wiki/File%3ATire%20Changer.jpg",
    },
  },

  {
    id: "azot",
    numar: "02",
    titlu: t("Umflare cu azot", "Накачка азотом"),
    carlig: t(
      "Presiunea care nu scade de la o lună la alta. Și nici de la vară la iarnă.",
      "Давление, которое не падает от месяца к месяцу. И от лета к зиме тоже.",
    ),
    corp: t(
      "Azotul are molecula mai mare decât aerul, așa că iese mult mai greu prin cauciuc. În plus, nu conține umiditate — deci presiunea nu mai sare în sus și în jos odată cu temperatura. Rezultatul practic: presiune stabilă, consum mai mic și o anvelopă care se uzează uniform.",
      "Молекула азота крупнее молекулы воздуха, поэтому он гораздо труднее проходит сквозь резину. К тому же он не содержит влаги — давление больше не скачет вслед за температурой. На практике: стабильное давление, меньший расход топлива и равномерный износ шины.",
    ),
    tabele: [
      {
        coloane: [t("Serviciu", "Услуга"), t("Preț", "Цена")],
        randuri: [
          ["Azot — autoturism (4 roți)", "150 lei"],
          ["Azot — SUV / 4x4 (4 roți)", "200 lei"],
        ],
      },
    ],
    indemn: t(
      "Cere azot la următoarea montare — se face în aceeași vizită, fără timp suplimentar.",
      "Попросите азот при следующем монтаже — делается за тот же визит, без дополнительного времени.",
    ),
    foto: {
      fisier: "azot.jpg",
      alt: t("Manometru de presiune folosit la o anvelopă", "Манометр для измерения давления в шине"),
      sursa: "Wikimedia Commons",
      autor: "(U.S. Air Force photo by Airman Frank Snider)",
      licenta: "Public domain",
      pagina: "https://commons.wikimedia.org/wiki/File%3ATire%20pressure%20gauge.jpg",
    },
  },

  {
    id: "valve",
    numar: "03",
    titlu: t("Valve și capace", "Вентили и колпачки"),
    carlig: t(
      "Piesa de 20 de lei care îți poate lăsa roata fără aer pe autostradă.",
      "Деталь за 20 леев, из-за которой колесо может спустить на трассе.",
    ),
    corp: t(
      "Valva este consumabil, nu piesă pe viață. Cauciucul ei crapă de la soare, sare de drum și vechime, iar o valvă obosită pierde aer lent, exact tipul de scurgere pe care nu îl observi până nu e prea târziu. O schimbăm la fiecare montare de anvelopă nouă.",
      "Вентиль — расходник, а не деталь на всю жизнь. Его резина трескается от солнца, дорожной соли и возраста, а уставший вентиль медленно травит воздух — именно та утечка, которую не замечаешь, пока не поздно. Меняем его при каждой установке новой шины.",
    ),
    tabele: [
      {
        coloane: [t("Serviciu", "Услуга"), t("Preț", "Цена")],
        randuri: [
          ["Valvă standard (bucata)", "20 lei"],
          ["Valvă metalică (bucata)", "50 lei"],
          ["Cap senzor (bucata)", "100 lei"],
        ],
      },
    ],
    indemn: t(
      "Schimbă valvele odată cu anvelopele — costă cât o cafea și îți scutește o pană.",
      "Меняйте вентили вместе с шинами — стоит как чашка кофе и избавляет от прокола.",
    ),
    foto: {
      fisier: "valve.jpg",
      alt: t("Valvă de anvelopă, prim-plan", "Вентиль шины крупным планом"),
      sursa: "Wikimedia Commons",
      autor: "Andrew Pertsev",
      licenta: "CC0",
      pagina: "https://commons.wikimedia.org/wiki/File%3ATire%20Valve%20Stem.jpg",
    },
  },

  {
    id: "reparatii",
    numar: "04",
    dbSlug: "reparatia-anvelopelor",
    titlu: t("Petice și reparații anvelope", "Ремонт шин и заплаты"),
    carlig: t(
      "Un cui în bandă de rulare nu înseamnă automat anvelopă nouă.",
      "Гвоздь в протекторе — ещё не приговор шине.",
    ),
    corp: t(
      "În majoritatea cazurilor, o pană în banda de rulare se repară definitiv, din interior, cu petic vulcanizat la cald — o soluție care ține cât anvelopa. Alegem tipul de petic după mărimea și poziția tăieturii. Îți spunem cinstit când o anvelopă nu mai e sigură de reparat: pe flanc, de exemplu, nu reparăm niciodată.",
      "В большинстве случаев прокол в протекторе устраняется окончательно — изнутри, заплатой горячей вулканизации, и держится столько же, сколько сама шина. Тип заплаты подбираем по размеру и месту пореза. Честно говорим, когда шину чинить уже небезопасно: боковину, например, мы не ремонтируем никогда.",
    ),
    tabele: [
      {
        coloane: [t("Serviciu", "Услуга"), t("Preț", "Цена")],
        randuri: [
          ["Petic UP3 — înțepături mici", "15 lei"],
          ["Petic UP4 — înțepături medii", "20 lei"],
          ["Petic TL110 — tăieturi mari", "100 lei"],
          ["Petic TL120 — tăieturi foarte mari", "200 lei"],
        ],
      },
      {
        titlu: t("Curățare butuc și saci de transport", "Чистка ступицы и мешки для перевозки"),
        coloane: [t("Serviciu", "Услуга"), t("Preț", "Цена")],
        randuri: [
          ["Curățat butuc", "20 lei"],
          ["Sac pentru anvelopă (bucata)", "10 lei"],
        ],
        nota: t(
          "Butucul curat înseamnă roată care se așază perfect plan pe disc — altfel apar vibrații chiar și cu roți echilibrate impecabil. Sacii sunt pentru clienții care își iau setul acasă și nu vor cauciuc pe tapițerie.",
          "Чистая ступица — это колесо, которое садится на диск идеально ровно; иначе вибрация появляется даже на безупречно отбалансированных колёсах. Мешки — для тех, кто забирает комплект домой и не хочет резину на обивке.",
        ),
      },
    ],
    indemn: t(
      "Adu anvelopa la control — diagnosticul e gratuit și îți spunem în 5 minute dacă se repară.",
      "Привезите шину на осмотр — диагностика бесплатная, за 5 минут скажем, подлежит ли ремонту.",
    ),
    foto: {
      fisier: "reparatii.jpg",
      alt: t("Trusă de petice pentru anvelope", "Набор заплат для ремонта шин"),
      sursa: "Wikimedia Commons",
      autor: "Björn Appel",
      licenta: "CC BY-SA 3.0",
      pagina: "https://commons.wikimedia.org/wiki/File%3APuncture-repaire-kit.jpg",
    },
  },

  {
    id: "tpms",
    numar: "05",
    titlu: t("Senzori de presiune (TPMS)", "Датчики давления (TPMS)"),
    carlig: t(
      "Becul de presiune stă aprins de luni de zile? Nu e defect de mașină. E un senzor care cere 25 de lei.",
      "Лампа давления горит месяцами? Машина не сломана. Это датчик, который стоит 25 леев.",
    ),
    corp: t(
      "Sistemul TPMS îți spune că o roată pierde aer înainte să simți tu ceva la volan. Când becul rămâne aprins permanent, creierul mașinii nu mai vede unul dintre senzori — fie bateria lui s-a terminat, fie senzorul nu a fost programat după ultima schimbare de roți. Montăm, programăm și scanăm senzori pentru toate mărcile uzuale.",
      "Система TPMS сообщает об утечке воздуха раньше, чем вы почувствуете что-то на руле. Когда лампа горит постоянно, электроника машины не видит один из датчиков: либо у него села батарея, либо его не прописали после последней смены колёс. Устанавливаем, программируем и сканируем датчики для всех распространённых марок.",
    ),
    include: {
      titlu: t("Ce facem", "Что делаем"),
      puncte: [
        t("Montăm senzorul nou în jantă, la montarea anvelopei", "Устанавливаем новый датчик в диск при монтаже шины"),
        t("Programăm senzorii pe calculatorul mașinii, ca să fie recunoscuți", "Прописываем датчики в компьютере автомобиля"),
        t("Scanăm întregul sistem și stingem martorul de pe bord", "Сканируем всю систему и гасим лампу на панели"),
      ],
    },
    tabele: [
      {
        coloane: [t("Serviciu", "Услуга"), t("Preț", "Цена")],
        randuri: [
          ["Montat senzor presiune (bucata)", "25 lei"],
          ["Programat senzori + scanare sistem", "200 lei"],
          ["Cap senzor (bucata)", "100 lei"],
        ],
      },
    ],
    indemn: t(
      "Vino cu becul aprins și pleci cu bordul curat. Sună la {tel} pentru o programare.",
      "Приезжайте с горящей лампой — уедете с чистой панелью. Запись по номеру {tel}.",
    ),
    foto: {
      fisier: "tpms.jpg",
      alt: t("Senzor de presiune montat în interiorul jantei", "Датчик давления, установленный внутри диска"),
      sursa: "Wikimedia Commons",
      autor: "TpmsReset",
      licenta: "CC BY-SA 4.0",
      pagina: "https://commons.wikimedia.org/wiki/File%3ATire%20pressure%20sensor%20in%20tire.jpg",
    },
  },

  {
    id: "jante",
    numar: "06",
    dbSlug: "reparatia-discurilor",
    titlu: t("Reparație și vopsire jante", "Ремонт и покраска дисков"),
    carlig: t(
      "Bordura ți-a îndoit janta. Nu îți trebuie una nouă de 4000 de lei.",
      "Бордюр помял диск. Новый за 4000 леев вам не нужен.",
    ),
    corp: t(
      "Îndreptăm jante de tablă și de aliaj lovite de gropi și borduri, iar acolo unde janta e sănătoasă dar arată obosit, o readucem la aspect de showroom. Reparația costă o fracțiune dintr-o jantă nouă și păstrează setul original al mașinii. Vopsim într-o culoare la alegere sau reproducem finisajul „diamond cut” — cel cu fața frezată lucios și fundalul mat, ca pe mașinile de fabrică. Toate variantele se finalizează cu lac protector, ca să reziste la sare, spălătorie și piatră.",
      "Правим стальные и литые диски после ям и бордюров, а там, где диск целый, но выглядит уставшим, возвращаем ему вид как из салона. Ремонт стоит долю цены нового диска и сохраняет заводской комплект. Красим в выбранный цвет или воспроизводим отделку «diamond cut» — с проточенной глянцевой лицевой частью и матовым фоном, как на заводских дисках. Все варианты покрываем защитным лаком, чтобы держали соль, мойку и щебень.",
    ),
    tabele: [
      {
        titlu: t("Îndreptare", "Правка"),
        coloane: [t("Serviciu", "Услуга"), t("Preț", "Цена")],
        randuri: [
          ["Roluit jantă tablă", "100 lei"],
          ["Îndreptat jantă aliaj", "de la 400 lei"],
        ],
        nota: t(
          "Prețul la aliaj depinde de gravitatea loviturii și de diametru — îl stabilim după ce vedem janta. Verificarea este gratuită.",
          "Цена на литой диск зависит от силы удара и диаметра — определяем её, увидев диск. Осмотр бесплатный.",
        ),
      },
      {
        titlu: t("Vopsire", "Покраска"),
        coloane: [t("Serviciu", "Услуга"), t("Preț", "Цена")],
        randuri: [
          ["Vopsit jantă, o culoare (bucata)", "200 lei"],
          ["Vopsit diamond cut + lac (bucata)", "300 lei"],
          ["Diamond cut + lac (bucata)", "150 lei"],
        ],
      },
    ],
    indemn: t(
      "Adu janta la evaluare — îți dăm prețul exact pe loc, fără obligații. Sau trimite-ne o poză pe WhatsApp la {tel}.",
      "Привезите диск на оценку — назовём точную цену на месте, без обязательств. Или пришлите фото в WhatsApp на {tel}.",
    ),
    foto: {
      fisier: "jante.jpg",
      alt: t("Jantă de aliaj cu etrier de frână vizibil", "Литой диск с видимым тормозным суппортом"),
      sursa: "Wikimedia Commons",
      autor: "Envy fstop",
      licenta: "CC BY-SA 4.0",
      pagina: "https://commons.wikimedia.org/wiki/File%3ADisc%20brakes.jpg",
    },
  },

  {
    id: "clima",
    numar: "07",
    dbSlug: "incarcare-conditionere-auto-cu-freon",
    titlu: t("Aer condiționat auto", "Автокондиционер"),
    carlig: t(
      "Aerul condiționat nu „se termină”. Pierde freon — și pierde compresorul dacă îl ignori.",
      "Кондиционер не «заканчивается». Он теряет фреон — а если не обращать внимания, теряет компрессор.",
    ),
    corp: t(
      "Un sistem de climatizare pierde natural o parte din freon în fiecare an. Când nivelul scade prea mult, compresorul rămâne fără ulei și se gripează — iar atunci vorbim de o reparație de mii de lei în loc de o încărcare de câteva sute. Facem întreținerea completă: aspirăm sistemul, tragem vid ca să scoatem umezeala, schimbăm uleiul și încărcăm cu freonul potrivit mașinii tale.",
      "Система кондиционирования естественным образом теряет часть фреона каждый год. Когда уровень падает слишком низко, компрессор остаётся без масла и заклинивает — и тогда речь о ремонте на тысячи леев вместо заправки за несколько сотен. Делаем полное обслуживание: откачиваем систему, вакуумируем, чтобы убрать влагу, меняем масло и заправляем фреоном, подходящим вашей машине.",
    ),
    include: {
      titlu: t("Ce include serviciul de bază", "Что входит в базовое обслуживание"),
      puncte: [
        t("Aspirarea freonului vechi și recuperarea lui", "Откачка старого фреона и его рекуперация"),
        t("Vacuumare — scoate umiditatea care distruge compresorul din interior", "Вакуумирование — убирает влагу, разрушающую компрессор изнутри"),
        t("Schimbul uleiului de compresor", "Замена масла компрессора"),
        t("Test de etanșeitate și verificarea temperaturii la guri", "Проверка герметичности и температуры на дефлекторах"),
      ],
    },
    tabele: [
      {
        coloane: [t("Serviciu", "Услуга"), t("Preț", "Цена")],
        randuri: [
          ["Serviciu A/C — aspirat + vacuumat + schimb ulei", "150 lei"],
          ["Freon R134A (pe gram)", "0,85 lei"],
          ["Freon R1234YF (pe gram)", "5,50 lei"],
          ["Schimb compresor A/C", "de la 500 lei"],
          ["Schimb radiator A/C", "în funcție de model"],
        ],
        nota: t(
          "O încărcare obișnuită de autoturism folosește între 400 și 700 de grame de freon. Îți spunem cantitatea exactă și costul total înainte să începem lucrul.",
          "Обычная заправка легкового автомобиля требует от 400 до 700 граммов фреона. Точное количество и итоговую стоимость называем до начала работы.",
        ),
      },
      {
        titlu: t("Ozonare sistem A/C", "Озонирование системы кондиционера"),
        coloane: [t("Serviciu", "Услуга"), t("Preț", "Цена")],
        randuri: [["Ozonare sistem aer condiționat", "350 lei"]],
        nota: t(
          "Mirosul acela de mucegai când pornești aerul sunt bacterii adunate în evaporator. Tratamentul cu ozon pătrunde în tot circuitul de ventilație, distruge microorganismele și elimină mirosul de la sursă, nu îl maschează cu parfum. Recomandat dacă simți miros de umezeală, dacă cineva din familie e alergic, dacă ai cumpărat mașina la mâna a doua sau dacă ai transportat animale.",
          "Тот запах плесени при включении кондиционера — это бактерии, скопившиеся в испарителе. Обработка озоном проходит по всему контуру вентиляции, уничтожает микроорганизмы и убирает запах у источника, а не маскирует его отдушкой. Рекомендуем, если чувствуете запах сырости, если у кого-то в семье аллергия, если машина куплена с рук или если возили животных.",
        ),
      },
    ],
    indemn: t(
      "Programează revizia de climă înainte de primul val de căldură — atunci se aglomerează. Sună la {tel}.",
      "Запишитесь на обслуживание кондиционера до первой жары — потом очередь. Звоните на {tel}.",
    ),
    foto: {
      fisier: "clima.jpg",
      alt: t("Stație de service pentru aer condiționat auto", "Станция обслуживания автокондиционеров"),
      sursa: "Wikimedia Commons",
      autor: "Werkstattausstattung",
      licenta: "CC BY-SA 3.0",
      pagina: "https://commons.wikimedia.org/wiki/File%3AKlimaserviceger%C3%A4t.jpg",
    },
  },

  {
    id: "frane",
    numar: "08",
    dbSlug: "slefuirea-discurilor-de-frana",
    titlu: t("Sistem de frânare", "Тормозная система"),
    carlig: t(
      "Frâna e singurul sistem din mașină care nu are a doua șansă.",
      "Тормоза — единственная система в машине, у которой нет второго шанса.",
    ),
    corp: t(
      "Plăcuțele uzate și discurile ondulate îți lungesc distanța de oprire exact în situația în care contează fiecare metru. Schimbăm plăcuțe față și spate, inclusiv pe sistemele cu frână de mână electrică, șlefuim discurile care au bătaie și recondiționăm etrierele ruginite.",
      "Изношенные колодки и покоробленные диски увеличивают тормозной путь именно там, где важен каждый метр. Меняем передние и задние колодки, в том числе на системах с электронным ручником, протачиваем диски с биением и восстанавливаем ржавые суппорты.",
    ),
    tabele: [
      {
        coloane: [t("Serviciu", "Услуга"), t("Preț", "Цена")],
        randuri: [
          ["Șlefuire disc frână (per disc)", "400 lei"],
          ["Schimb plăcuțe frână față", "300 lei"],
          ["Schimb plăcuțe frână spate", "300 lei"],
          ["Schimb plăcuțe spate — frână de mână electrică", "400 lei"],
          ["Curățare butuc + cupru (bucata)", "50 lei"],
          ["Curățare + vopsire etriere (4 bucăți)", "100 lei"],
        ],
        nota: t(
          "Prețurile sunt pentru manoperă. Piesele se adaugă separat, iar tu alegi dacă le aduci tu sau ți le procurăm noi.",
          "Цены указаны за работу. Запчасти считаются отдельно, и вы сами решаете, привезёте их или закажем мы.",
        ),
      },
    ],
    indemn: t(
      "Auzi scârțâit la frânare? Vino azi la verificare — controlul plăcuțelor este gratuit.",
      "Слышите скрип при торможении? Приезжайте сегодня — проверка колодок бесплатная.",
    ),
    foto: {
      fisier: "frane.jpg",
      alt: t("Disc și etrier de frână, văzute prin spițele jantei", "Тормозной диск и суппорт, вид через спицы диска"),
      sursa: "Wikimedia Commons",
      autor: "User Ballista on en.wikipedia",
      licenta: "CC BY-SA 3.0",
      pagina: "https://commons.wikimedia.org/wiki/File%3ARear%20disc%20brake%20unit.JPG",
    },
  },

  {
    id: "hotel-anvelope",
    numar: "09",
    dbSlug: "hotel-anvelope",
    titlu: t("Hotel anvelope — depozitare sezonieră", "Отель для шин — сезонное хранение"),
    carlig: t(
      "Patru anvelope ocupă un sfert din garaj. La noi ocupă zero.",
      "Четыре шины занимают четверть гаража. У нас — ноль.",
    ),
    corp: t(
      "Îți păstrăm setul de anvelope până la schimbul următor, în condiții corecte: la temperatură stabilă, ferite de soare și de umezeală — lucruri care usucă și crapă cauciucul dacă stau pe balcon sau în garaj neîncălzit. Fiecare set este etichetat pe numele și mașina ta și înregistrat în sistemul nostru, deci știm exact ce avem și unde.",
      "Храним ваш комплект шин до следующей смены в правильных условиях: стабильная температура, без солнца и сырости — того, что сушит и трескает резину на балконе или в неотапливаемом гараже. Каждый комплект маркирован вашим именем и машиной и внесён в нашу систему, поэтому мы точно знаем, что и где лежит.",
    ),
    include: {
      titlu: t("Ce primești", "Что вы получаете"),
      puncte: [
        t("Spălarea și verificarea anvelopelor înainte de depozitare", "Мойку и проверку шин перед хранением"),
        t("Depozitare în spațiu amenajat, pe toată durata sezonului", "Хранение в оборудованном помещении весь сезон"),
        t("Evidență în sistem, pe numele și numărul mașinii tale", "Учёт в системе — на ваше имя и номер машины"),
        t("Setul pregătit și gata de montat când vii la schimbul de sezon", "Комплект, готовый к установке, когда придёте на сезонную смену"),
      ],
    },
    tabele: [
      {
        coloane: [t("Serviciu", "Услуга"), t("Preț", "Цена")],
        randuri: [
          ["Set 4 anvelope (un sezon)", "300 lei"],
          ["Set 4 anvelope pe jante (un sezon)", "400 lei"],
        ],
      },
    ],
    indemn: t(
      "Rezervă-ți locul din timp — la schimbul de sezon locurile se ocupă în câteva zile. Sună la {tel}.",
      "Бронируйте место заранее — в сезон смены места разбирают за несколько дней. Звоните на {tel}.",
    ),
    foto: {
      fisier: "hotel-anvelope.jpg",
      alt: t("Anvelope stivuite în depozit", "Шины, сложенные на складе"),
      sursa: "Wikimedia Commons",
      autor: "SAgbley",
      licenta: "CC BY-SA 4.0",
      pagina: "https://commons.wikimedia.org/wiki/File%3ACar%20Tyres.jpg",
    },
  },

  {
    id: "vanzare",
    numar: "10",
    titlu: t("Vânzare anvelope", "Продажа шин"),
    carlig: t(
      "Anvelope pe stoc, montate pe loc. Fără să aștepți o săptămână după comandă.",
      "Шины в наличии, установка на месте. Без недели ожидания заказа.",
    ),
    corp: t(
      "Ținem stoc permanent de anvelope de vară, de iarnă și all-season, în dimensiunile cele mai căutate, de la mărci accesibile până la premium. Le montăm și echilibrăm în aceeași vizită, iar dacă dimensiunea ta nu e pe raft, o aducem rapid.",
      "Держим постоянный запас летних, зимних и всесезонных шин в самых ходовых размерах — от доступных марок до премиальных. Монтируем и балансируем за тот же визит, а если вашего размера нет на полке, привозим быстро.",
    ),
    include: {
      titlu: t("De ce să cumperi de la un service, nu dintr-un depozit", "Почему выгоднее купить в сервисе, а не на складе"),
      puncte: [
        t("Vezi anvelopa înainte să plătești — inclusiv săptămâna de fabricație (DOT)", "Вы видите шину до оплаты — включая неделю выпуска (DOT)"),
        t("Montaj și echilibrare pe loc, fără să cari cauciucuri prin oraș", "Монтаж и балансировка на месте, без возни с резиной по городу"),
        t("Îți recomandăm dimensiunea corectă pentru mașina ta, nu ce vrem noi să vindem", "Советуем размер, подходящий вашей машине, а не тот, что нам выгодно продать"),
        t("Setul vechi rămâne la noi în hotel, dacă vrei", "Старый комплект по желанию остаётся у нас на хранении"),
      ],
    },
    tabele: [],
    indemn: t(
      "Spune-ne dimensiunea de pe flanc (ex. 205/55 R16) la {tel} și îți trimitem variantele disponibile cu prețuri.",
      "Назовите размер с боковины (например, 205/55 R16) по номеру {tel} — пришлём доступные варианты с ценами.",
    ),
    foto: {
      fisier: "vanzare.jpg",
      alt: t("Interior de atelier de vulcanizare", "Интерьер шиномонтажной мастерской"),
      sursa: "Wikimedia Commons",
      autor: "Visitor7",
      licenta: "CC BY-SA 3.0",
      pagina: "https://commons.wikimedia.org/wiki/File%3AInside%20a%20Tire%20Shop.jpg",
    },
  },
];

/** Textul unui câmp bilingv, cu numărul de telefon completat. */
export function text(v: Bilingv, locale: Locale, tel?: string): string {
  const s = locale === "ru" ? v.ru : v.ro;
  return tel ? s.replace("{tel}", tel) : s;
}
