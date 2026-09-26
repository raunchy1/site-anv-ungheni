/**
 * GHIDURILE: RĂSPUNSURILE LA CE ÎNTREABĂ OMUL ÎNAINTE SĂ CUMPERE.
 *
 * De ce există. Paginile de catalog răspund la „anvelope 205/55 R16"; nimic de
 * pe site nu răspundea la „ce înseamnă 91V", „cât de veche e anvelopa mea" sau
 * „când pun anvelopele de iarnă". Sunt căutări cu volum mare, iar un asistent
 * AI întrebat același lucru citează o pagină care răspunde clar, cu cifre.
 *
 * REGULA. Doar cunoștințe tehnice generale, verificabile — tabelele de indici
 * sunt standardul ETRTO/ISO, calculul diametrului e aritmetică. NU se scrie
 * nimic despre legislația din Moldova (termene obligatorii, amenzi, adâncimi
 * minime legale): nu le-am verificat, iar un ghid care greșește legea e mai rău
 * decât niciunul.
 */

export type Bloc =
  | { tip: "p"; ro: string; ru: string }
  | { tip: "lista"; ro: string[]; ru: string[] }
  | { tip: "tabel"; cap: [string, string]; capRu: [string, string]; randuri: Array<[string, string]>; randuriRu?: Array<[string, string]> };

export type Ghid = {
  slug: string;
  titlu: { ro: string; ru: string };
  descriere: { ro: string; ru: string };
  sectiuni: Array<{ h: { ro: string; ru: string }; blocuri: Bloc[] }>;
  intrebari: Array<{ ro: [string, string]; ru: [string, string] }>;
  /** Unde duce ghidul mai departe: segmente de catalog. */
  catalog: Array<{ segmente: string[]; ro: string; ru: string }>;
};

const INDICI_SARCINA: Array<[string, string]> = [
  ["80", "450"], ["82", "475"], ["84", "500"], ["86", "530"], ["88", "560"], ["89", "580"],
  ["90", "600"], ["91", "615"], ["92", "630"], ["93", "650"], ["94", "670"], ["95", "690"],
  ["96", "710"], ["97", "730"], ["98", "750"], ["99", "775"], ["100", "800"], ["101", "825"],
  ["102", "850"], ["103", "875"], ["104", "900"], ["105", "925"], ["106", "950"], ["107", "975"],
  ["108", "1000"], ["109", "1030"], ["110", "1060"], ["112", "1120"], ["115", "1215"], ["120", "1400"],
];

const INDICI_VITEZA: Array<[string, string]> = [
  ["N", "140"], ["P", "150"], ["Q", "160"], ["R", "170"], ["S", "180"], ["T", "190"],
  ["U", "200"], ["H", "210"], ["V", "240"], ["W", "270"], ["Y", "300"],
];

export const GHIDURI: readonly Ghid[] = [
  {
    slug: "cum-citesti-dimensiunea-anvelopei",
    titlu: {
      ro: "Cum citești dimensiunea anvelopei: ce înseamnă 205/55 R16 91V",
      ru: "Как читать размер шины: что означает 205/55 R16 91V",
    },
    descriere: {
      ro: "Lățimea, înălțimea profilului, diametrul jantei, indicele de sarcină și de viteză — explicate pe exemplul 205/55 R16 91V, cu calculul diametrului roții.",
      ru: "Ширина, высота профиля, диаметр диска, индексы нагрузки и скорости — на примере 205/55 R16 91V, с расчётом диаметра колеса.",
    },
    sectiuni: [
      {
        h: { ro: "Unde găsești dimensiunea", ru: "Где найти размер" },
        blocuri: [
          {
            tip: "lista",
            ro: [
              "pe flancul anvelopei montate acum pe mașină — cel mai sigur loc;",
              "pe eticheta de pe marginea ușii șoferului sau de pe clapeta rezervorului;",
              "în cartea tehnică a mașinii, unde apar toate dimensiunile omologate.",
            ],
            ru: [
              "на боковине шины, которая сейчас стоит на машине — самый надёжный вариант;",
              "на наклейке в проёме водительской двери или на лючке бензобака;",
              "в руководстве по эксплуатации, где указаны все допустимые размеры.",
            ],
          },
        ],
      },
      {
        h: { ro: "Ce înseamnă fiecare număr", ru: "Что означает каждое число" },
        blocuri: [
          {
            tip: "tabel",
            cap: ["Marcaj", "Ce înseamnă"],
            capRu: ["Маркировка", "Что означает"],
            randuri: [
              ["205", "lățimea anvelopei, în milimetri"],
              ["55", "înălțimea profilului, ca procent din lățime (55% × 205 = 113 mm)"],
              ["R", "construcție radială — aproape toate anvelopele de azi"],
              ["16", "diametrul jantei, în țoli"],
              ["91", "indicele de sarcină: 615 kg pe anvelopă"],
              ["V", "indicele de viteză: maximum 240 km/h"],
            ],
            randuriRu: [
              ["205", "ширина шины в миллиметрах"],
              ["55", "высота профиля в процентах от ширины"],
              ["R", "радиальная конструкция"],
              ["16", "диаметр диска в дюймах"],
              ["91", "индекс нагрузки: 615 кг на шину"],
              ["V", "индекс скорости: до 240 км/ч"],
            ],
          },
          {
            tip: "p",
            ro: "Diametrul întregii roți se calculează din dimensiune: 16 țoli × 25,4 = 406 mm janta, plus de două ori profilul (2 × 113 mm) — în total aproximativ 632 mm. Când alegi o dimensiune alternativă, diferența de diametru față de cea originală ar trebui să rămână sub 3%, altfel vitezometrul și sistemele de asistență măsoară greșit.",
            ru: "Диаметр колеса считается из размера: 16 дюймов × 25,4 = 406 мм диск плюс два профиля (2 × 113 мм) — всего около 632 мм. При выборе альтернативного размера разница в диаметре с заводским не должна превышать 3%, иначе спидометр и системы помощи водителю будут ошибаться.",
          },
        ],
      },
      {
        h: { ro: "Marcajele de lângă dimensiune", ru: "Маркировки рядом с размером" },
        blocuri: [
          {
            tip: "lista",
            ro: [
              "XL sau Extra Load — anvelopă ranforsată, cu indice de sarcină mai mare decât varianta standard;",
              "RunFlat (RFT, ROF, SSR) — poate rula încă aproximativ 80 km după pană, pe mașinile care o permit;",
              "M+S — noroi și zăpadă, declarat de producător; simbolul muntelui cu fulg (3PMSF) înseamnă că anvelopa a trecut un test oficial pe zăpadă;",
              "DOT urmat de patru cifre — săptămâna și anul fabricației (vezi ghidul despre vechimea anvelopei).",
            ],
            ru: [
              "XL или Extra Load — усиленная шина с повышенным индексом нагрузки;",
              "RunFlat (RFT, ROF, SSR) — позволяет проехать около 80 км после прокола на машинах, которые это поддерживают;",
              "M+S — грязь и снег по заявлению производителя; значок горы со снежинкой (3PMSF) означает, что шина прошла официальный тест на снегу;",
              "DOT и четыре цифры — неделя и год производства (см. статью о возрасте шины).",
            ],
          },
        ],
      },
    ],
    intrebari: [
      {
        ro: ["Pot pune o dimensiune diferită de cea din fabrică?", "Da, dacă e omologată pentru mașina ta (apare în cartea tehnică) și dacă diametrul total rămâne în limita de 3% față de original. Indicele de sarcină și de viteză nu trebuie să fie mai mici decât cele prescrise."],
        ru: ["Можно ли поставить размер, отличный от заводского?", "Да, если он допущен для вашей машины (указан в руководстве) и общий диаметр отличается не более чем на 3%. Индексы нагрузки и скорости не должны быть ниже заводских."],
      },
      {
        ro: ["Ce înseamnă R16?", "R indică construcția radială, iar 16 este diametrul jantei în țoli. Anvelopa R16 se montează doar pe jantă de 16 țoli."],
        ru: ["Что означает R16?", "R — радиальная конструкция, 16 — диаметр диска в дюймах. Шина R16 ставится только на 16-дюймовый диск."],
      },
    ],
    catalog: [
      { segmente: ["latime_205", "inaltime_55", "diametru_r16"], ro: "Anvelope 205/55 R16", ru: "Шины 205/55 R16" },
      { segmente: ["latime_195", "inaltime_65", "diametru_r15"], ro: "Anvelope 195/65 R15", ru: "Шины 195/65 R15" },
    ],
  },

  {
    slug: "indice-sarcina-viteza-anvelope",
    titlu: {
      ro: "Indicele de sarcină și de viteză al anvelopei — tabele complete",
      ru: "Индекс нагрузки и скорости шин — полные таблицы",
    },
    descriere: {
      ro: "Tabelul indicilor de sarcină (kg pe anvelopă) și al indicilor de viteză (km/h), cu regula de alegere: niciodată sub valorile din cartea tehnică.",
      ru: "Таблица индексов нагрузки (кг на шину) и скорости (км/ч) и правило выбора: не ниже значений из руководства автомобиля.",
    },
    sectiuni: [
      {
        h: { ro: "Cum se citesc", ru: "Как читать" },
        blocuri: [
          {
            tip: "p",
            ro: "La 205/55 R16 91V, „91” e indicele de sarcină și „V” cel de viteză. Indicele de sarcină e un cod, nu o greutate: 91 înseamnă 615 kg pe o anvelopă, adică 2.460 kg pe patru roți. Indicele de viteză e viteza maximă la care anvelopa poate rula încărcată complet.",
            ru: "В 205/55 R16 91V «91» — индекс нагрузки, «V» — индекс скорости. Индекс нагрузки — это код, а не вес: 91 означает 615 кг на одну шину, то есть 2 460 кг на четыре колеса. Индекс скорости — максимальная скорость при полной нагрузке.",
          },
        ],
      },
      {
        h: { ro: "Tabelul indicilor de sarcină", ru: "Таблица индексов нагрузки" },
        blocuri: [{ tip: "tabel", cap: ["Indice", "kg pe anvelopă"], capRu: ["Индекс", "кг на шину"], randuri: INDICI_SARCINA }],
      },
      {
        h: { ro: "Tabelul indicilor de viteză", ru: "Таблица индексов скорости" },
        blocuri: [{ tip: "tabel", cap: ["Indice", "km/h maxim"], capRu: ["Индекс", "макс. км/ч"], randuri: INDICI_VITEZA }],
      },
      {
        h: { ro: "Regula de alegere", ru: "Правило выбора" },
        blocuri: [
          {
            tip: "lista",
            ro: [
              "indicii anvelopei noi nu trebuie să fie mai mici decât cei din cartea tehnică a mașinii;",
              "un indice mai mare e permis — anvelopa e doar mai rezistentă decât e nevoie;",
              "la microbuze și SUV-uri grele contează mai ales sarcina: acolo apar anvelopele C (comerciale) și XL;",
              "pe aceeași axă, ambele anvelope trebuie să aibă aceiași indici.",
            ],
            ru: [
              "индексы новой шины не должны быть ниже указанных в руководстве автомобиля;",
              "более высокий индекс допустим — шина просто прочнее, чем нужно;",
              "для микроавтобусов и тяжёлых внедорожников особенно важна нагрузка: для них выпускают шины C (коммерческие) и XL;",
              "на одной оси обе шины должны иметь одинаковые индексы.",
            ],
          },
        ],
      },
    ],
    intrebari: [
      {
        ro: ["Ce înseamnă indicele de sarcină 91?", "615 kg pe o anvelopă. Pe patru roți, 2.460 kg — sarcina maximă pe care anvelopele o duc la presiunea corectă."],
        ru: ["Что означает индекс нагрузки 91?", "615 кг на одну шину, на четыре колеса — 2 460 кг при правильном давлении."],
      },
      {
        ro: ["Ce înseamnă H și V la anvelope?", "Indicele de viteză: H permite maximum 210 km/h, V maximum 240 km/h."],
        ru: ["Что означают H и V на шинах?", "Индекс скорости: H — до 210 км/ч, V — до 240 км/ч."],
      },
    ],
    catalog: [
      { segmente: ["latime_215", "inaltime_60", "diametru_r16"], ro: "Anvelope 215/60 R16", ru: "Шины 215/60 R16" },
      { segmente: ["latime_225", "inaltime_45", "diametru_r17"], ro: "Anvelope 225/45 R17", ru: "Шины 225/45 R17" },
    ],
  },

  {
    slug: "vechimea-anvelopei-cod-dot",
    titlu: {
      ro: "Cât de veche e anvelopa: cum citești codul DOT",
      ru: "Сколько лет шине: как читать код DOT",
    },
    descriere: {
      ro: "Ultimele patru cifre din codul DOT arată săptămâna și anul fabricației. Cum le găsești, cum le citești și când merită schimbată anvelopa.",
      ru: "Последние четыре цифры кода DOT — неделя и год производства. Где их найти, как прочитать и когда шину пора менять.",
    },
    sectiuni: [
      {
        h: { ro: "Unde e data fabricației", ru: "Где дата производства" },
        blocuri: [
          {
            tip: "p",
            ro: "Pe flanc, după literele DOT, e un șir de litere și cifre. Data sunt ultimele patru cifre, de obicei într-un oval separat. „3524” înseamnă săptămâna 35 din 2024 — sfârșitul lui august 2024. Codul e scris uneori doar pe o parte a anvelopei, deci poate fi pe flancul dinspre interior.",
            ru: "На боковине после букв DOT идёт ряд букв и цифр. Дата — последние четыре цифры, обычно в отдельном овале. «3524» — 35-я неделя 2024 года, конец августа 2024. Код бывает только с одной стороны шины, иногда с внутренней.",
          },
        ],
      },
      {
        h: { ro: "Când se schimbă anvelopa", ru: "Когда менять шину" },
        blocuri: [
          {
            tip: "lista",
            ro: [
              "după uzură: multe țări europene cer minimum 1,6 mm adâncime a profilului; pentru iarnă, producătorii recomandă cel puțin 4 mm, fiindcă sub atât aderența pe zăpadă scade vizibil;",
              "după vârstă: cauciucul se întărește în timp chiar și nefolosit; majoritatea producătorilor recomandă verificarea anuală după 5 ani și înlocuirea după cel mult 10 ani de la fabricație;",
              "imediat, la fisuri pe flanc, umflături (hernii) sau cord vizibil.",
            ],
            ru: [
              "по износу: во многих европейских странах минимальная глубина протектора — 1,6 мм; для зимы производители рекомендуют не меньше 4 мм, ниже сцепление на снегу заметно падает;",
              "по возрасту: резина твердеет со временем даже без езды; большинство производителей советуют ежегодную проверку после 5 лет и замену не позже 10 лет с даты производства;",
              "сразу — при трещинах на боковине, грыжах или видимом корде.",
            ],
          },
        ],
      },
      {
        h: { ro: "E o problemă o anvelopă nouă fabricată acum un an?", ru: "Плохо ли, если новой шине год?" },
        blocuri: [
          {
            tip: "p",
            ro: "Nu. O anvelopă depozitată corect — la întuneric, fără căldură și fără sarcină — își păstrează proprietățile. Anvelopele de un an sau doi de la fabricație sunt considerate noi și sunt vândute cu garanție completă.",
            ru: "Нет. Шина, хранившаяся правильно — в темноте, без жары и нагрузки, — сохраняет свойства. Шины возрастом год-два считаются новыми и продаются с полной гарантией.",
          },
        ],
      },
    ],
    intrebari: [
      {
        ro: ["Ce înseamnă DOT 2223?", "Anvelopa a fost fabricată în săptămâna 22 din 2023, adică la sfârșitul lui mai sau începutul lui iunie 2023."],
        ru: ["Что означает DOT 2223?", "Шина произведена на 22-й неделе 2023 года — конец мая или начало июня 2023."],
      },
      {
        ro: ["Câți ani ține o anvelopă?", "Depinde de kilometraj și de condiții, dar majoritatea producătorilor recomandă înlocuirea după cel mult 10 ani de la fabricație, chiar dacă profilul pare bun."],
        ru: ["Сколько лет служит шина?", "Зависит от пробега и условий, но большинство производителей рекомендуют менять шину не позже 10 лет с даты производства, даже если протектор выглядит нормально."],
      },
    ],
    catalog: [
      { segmente: ["sezon_iarna"], ro: "Anvelope de iarnă", ru: "Зимние шины" },
      { segmente: ["sezon_vara"], ro: "Anvelope de vară", ru: "Летние шины" },
    ],
  },

  {
    slug: "anvelope-iarna-vara-all-season",
    titlu: {
      ro: "Anvelope de iarnă, de vară sau all season: ce alegi și când le schimbi",
      ru: "Зимние, летние или всесезонные шины: что выбрать и когда менять",
    },
    descriere: {
      ro: "Diferența dintre anvelopele de iarnă, de vară și all season, regula celor 7 °C, marcajele M+S și 3PMSF și pentru cine au sens anvelopele all season.",
      ru: "Чем отличаются зимние, летние и всесезонные шины, правило 7 °C, маркировки M+S и 3PMSF и кому подходят всесезонные шины.",
    },
    sectiuni: [
      {
        h: { ro: "Regula celor 7 °C", ru: "Правило 7 °C" },
        blocuri: [
          {
            tip: "p",
            ro: "Cauciucul anvelopelor de vară se întărește sub aproximativ 7 °C și pierde aderență chiar pe asfalt uscat. Anvelopele de iarnă au un amestec care rămâne moale la frig și un profil cu lamele care prind zăpada. De aceea recomandarea obișnuită e schimbul când temperatura medie a zilei coboară constant sub 7 °C — în Moldova, de regulă, în a doua jumătate a lui octombrie sau în noiembrie — și înapoi primăvara, când trece constant peste 7 °C.",
            ru: "Резина летних шин твердеет ниже примерно 7 °C и теряет сцепление даже на сухом асфальте. У зимних шин смесь остаётся мягкой на холоде, а протектор с ламелями держит снег. Поэтому обычно шины меняют, когда среднесуточная температура стабильно опускается ниже 7 °C — в Молдове, как правило, во второй половине октября или в ноябре — и обратно весной, когда она стабильно выше 7 °C.",
          },
        ],
      },
      {
        h: { ro: "Comparația pe scurt", ru: "Коротко о различиях" },
        blocuri: [
          {
            tip: "tabel",
            cap: ["Tip", "Pentru cine"],
            capRu: ["Тип", "Кому подходит"],
            randuri: [
              ["Vară", "frânare scurtă pe cald și pe ploaie, consum mai mic"],
              ["Iarnă", "zăpadă, gheață, frig; singura alegere pentru drumuri de țară iarna"],
              ["All season", "oraș, iarnă blândă, kilometraj mic; compromis, nu înlocuitor"],
            ],
            randuriRu: [
              ["Лето", "короткий тормозной путь в тепло и дождь, меньший расход"],
              ["Зима", "снег, лёд, холод; единственный выбор для сельских дорог зимой"],
              ["Всесезонные", "город, мягкая зима, небольшой пробег; компромисс, а не замена"],
            ],
          },
        ],
      },
      {
        h: { ro: "Marcajele de iarnă", ru: "Зимние маркировки" },
        blocuri: [
          {
            tip: "lista",
            ro: [
              "M+S — „mud and snow”, declarat de producător, fără test obligatoriu;",
              "3PMSF — simbolul muntelui cu trei vârfuri și fulg de zăpadă: anvelopa a trecut un test standardizat de tracțiune pe zăpadă. E marcajul care contează;",
              "anvelopele all season bune au și ele 3PMSF.",
            ],
            ru: [
              "M+S — «грязь и снег», заявление производителя без обязательного теста;",
              "3PMSF — значок трёхглавой горы со снежинкой: шина прошла стандартный тест на сцепление на снегу. Именно этот знак важен;",
              "хорошие всесезонные шины тоже имеют 3PMSF.",
            ],
          },
        ],
      },
      {
        h: { ro: "Păstrarea anvelopelor între sezoane", ru: "Хранение шин между сезонами" },
        blocuri: [
          {
            tip: "p",
            ro: "La întuneric, la răcoare, departe de surse de căldură și de ozon (motoare electrice, aparate de sudură). Anvelopele fără jantă se țin în picioare și se rotesc o dată pe lună; cele pe jantă se pot stivui sau agăța. Atelierul nostru din Ungheni are și hotel de anvelope.",
            ru: "В темноте и прохладе, вдали от источников тепла и озона (электромоторы, сварка). Шины без дисков хранят стоя и поворачивают раз в месяц; на дисках — можно стопкой или подвешенными. В нашей мастерской в Унгенах есть и хранение шин.",
          },
        ],
      },
    ],
    intrebari: [
      {
        ro: ["Când se pun anvelopele de iarnă?", "Când temperatura medie a zilei coboară constant sub 7 °C — în Moldova, de obicei din a doua jumătate a lui octombrie sau din noiembrie."],
        ru: ["Когда ставить зимние шины?", "Когда среднесуточная температура стабильно ниже 7 °C — в Молдове обычно со второй половины октября или с ноября."],
      },
      {
        ro: ["Merită anvelopele all season?", "Pentru mers mai ales prin oraș, cu kilometraj mic și ierni blânde, da. Pentru drumuri de țară, zăpadă frecventă sau mult kilometraj, un set de iarnă și unul de vară rămân mai sigure."],
        ru: ["Стоит ли брать всесезонные шины?", "Для города, небольшого пробега и мягкой зимы — да. Для сельских дорог, частого снега или большого пробега надёжнее отдельные комплекты зимних и летних шин."],
      },
    ],
    catalog: [
      { segmente: ["sezon_iarna"], ro: "Anvelope de iarnă", ru: "Зимние шины" },
      { segmente: ["sezon_all-season"], ro: "Anvelope all season", ru: "Всесезонные шины" },
      { segmente: ["latime_205", "inaltime_55", "diametru_r16", "sezon_iarna"], ro: "Anvelope de iarnă 205/55 R16", ru: "Зимние шины 205/55 R16" },
    ],
  },
];

export const ghid = (slug: string) => GHIDURI.find((g) => g.slug === slug);

/** Data de publicare a ghidurilor, pentru `Article`. Se schimbă când se rescrie textul. */
export const DATA_GHIDURI = "2026-09-27";
