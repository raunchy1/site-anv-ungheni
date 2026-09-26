/**
 * RAIOANELE ȘI MUNICIPIILE ÎN CARE LIVRĂM.
 *
 * De ce există: omul din Cahul nu caută „anvelope Moldova", caută „anvelope
 * Cahul". Până acum singurul răspuns al site-ului la întrebarea asta era o
 * propoziție de pe prima pagină — „livrăm în toată Moldova" — pe care un motor
 * de căutare n-o leagă de Cahul. Fiecare raion primește aici o pagină a lui, cu
 * ce e adevărat despre el: cât costă livrarea, în cât timp ajunge, cum se
 * plătește, ce orașe acoperă și cât de departe e de atelier.
 *
 * Ce NU se scrie: puncte de montaj partenere, reduceri locale, termene mai
 * scurte decât cele din coș. Pagina pentru Cahul spune exact ce spune checkout-ul
 * pentru o adresă din Cahul, și nimic în plus — o pagină de oraș care promite
 * altceva decât coșul e o pagină-momeală, iar Google le tratează ca atare.
 *
 * Stânga Nistrului lipsește deliberat: curierul nu livrează acolo, iar o pagină
 * „anvelope Tiraspol" ar fi o promisiune pe care comanda n-o poate ține.
 *
 * Coordonatele sunt ale centrului raional; servesc doar la distanța în linie
 * dreaptă față de atelier și la alegerea raioanelor vecine.
 */

export type Zona = "municipiu" | "nord" | "centru" | "sud";

export type Localitate = {
  /** Același slug în ambele limbi: `/anvelope-moldova/cahul`, `/ru/shiny-moldova/cahul`. */
  slug: string;
  ro: string;
  ru: string;
  /** „în Cahul" / „в Кагуле". Rusa declină, deci forma se scrie de mână. */
  inRo: string;
  inRu: string;
  /** Titlul unității administrative: „raionul Cahul", „municipiul Bălți". */
  unitateRo: string;
  unitateRu: string;
  zona: Zona;
  lat: number;
  lng: number;
  /** Orașele din raion — cele pe care omul le tastează în căutare. */
  orase: ReadonlyArray<readonly [ro: string, ru: string]>;
};

const raion = (
  slug: string, ro: string, ru: string, inRu: string, zona: Zona, lat: number, lng: number,
  orase: ReadonlyArray<readonly [string, string]>, unitateRu?: string,
): Localitate => ({
  slug, ro, ru, inRo: `în ${ro}`, inRu, unitateRo: `raionul ${ro}`, unitateRu: unitateRu ?? `${ru} (район)`,
  zona, lat, lng, orase,
});

export const LOCALITATI: readonly Localitate[] = [
  /* ------------------------------------------------------------ municipii */
  {
    slug: "chisinau", ro: "Chișinău", ru: "Кишинёв", inRo: "în Chișinău", inRu: "в Кишинёве",
    unitateRo: "municipiul Chișinău", unitateRu: "муниципий Кишинёв", zona: "municipiu",
    lat: 47.0105, lng: 28.8638,
    orase: [["Chișinău", "Кишинёв"], ["Durlești", "Дурлешты"], ["Codru", "Кодру"], ["Sîngera", "Сынжера"],
      ["Vatra", "Ватра"], ["Cricova", "Криково"], ["Vadul lui Vodă", "Вадул-луй-Водэ"], ["Ciorescu", "Чорэску"],
      ["Stăuceni", "Стэучень"], ["Budești", "Будешты"]],
  },
  {
    slug: "balti", ro: "Bălți", ru: "Бельцы", inRo: "în Bălți", inRu: "в Бельцах",
    unitateRo: "municipiul Bălți", unitateRu: "муниципий Бельцы", zona: "municipiu",
    lat: 47.7617, lng: 27.9289,
    orase: [["Bălți", "Бельцы"], ["Elizaveta", "Елизавета"], ["Sadovoe", "Садовое"]],
  },
  {
    slug: "gagauzia", ro: "Găgăuzia", ru: "Гагаузия", inRo: "în Găgăuzia", inRu: "в Гагаузии",
    unitateRo: "UTA Găgăuzia", unitateRu: "АТО Гагаузия", zona: "sud",
    lat: 46.2956, lng: 28.6556,
    orase: [["Comrat", "Комрат"], ["Ceadîr-Lunga", "Чадыр-Лунга"], ["Vulcănești", "Вулканешты"],
      ["Congaz", "Конгаз"], ["Tomai", "Томай"], ["Copceac", "Копчак"]],
  },

  /* -------------------------------------------------------------- centru */
  raion("ungheni", "Ungheni", "Унгены", "в Унгенах", "centru", 47.2105, 27.8006,
    [["Ungheni", "Унгены"], ["Cornești", "Корнешты"], ["Sculeni", "Скулень"], ["Valea Mare", "Валя Маре"],
      ["Pîrlița", "Пырлица"], ["Zagarancea", "Загаранча"], ["Mănoilești", "Мэноилешть"]], "Унгенский район"),
  raion("anenii-noi", "Anenii Noi", "Анений Ной", "в Анений Ной", "centru", 46.8783, 29.2306,
    [["Anenii Noi", "Анений Ной"], ["Bulboaca", "Булбоака"], ["Mereni", "Мерень"], ["Varnița", "Варница"]], "Новоаненский район"),
  raion("calarasi", "Călărași", "Калараш", "в Калараше", "centru", 47.2544, 28.3081,
    [["Călărași", "Калараш"], ["Hîrjauca", "Хыржаука"], ["Pîrjolteni", "Пыржолтень"]], "Каларашский район"),
  raion("criuleni", "Criuleni", "Криуляны", "в Криулянах", "centru", 47.2139, 29.1592,
    [["Criuleni", "Криуляны"], ["Măgdăcești", "Мэгдэчешть"], ["Hrușova", "Хрушова"]], "Криулянский район"),
  raion("dubasari", "Dubăsari", "Дубоссары", "в Дубоссарском районе (Кочиерь)", "centru", 47.3, 29.1167,
    [["Cocieri", "Кочиерь"], ["Molovata", "Моловата"], ["Doroțcaia", "Дороцкое"]], "Дубоссарский район"),
  raion("hincesti", "Hîncești", "Хынчешты", "в Хынчештах", "centru", 46.8306, 28.5906,
    [["Hîncești", "Хынчешты"], ["Lăpușna", "Лэпушна"], ["Cărpineni", "Карпинень"], ["Mingir", "Минжир"]], "Хынчештский район"),
  raion("ialoveni", "Ialoveni", "Яловены", "в Яловенах", "centru", 46.9431, 28.7778,
    [["Ialoveni", "Яловены"], ["Costești", "Костешты"], ["Bardar", "Бардар"], ["Ruseștii Noi", "Русештий Ной"]], "Яловенский район"),
  raion("nisporeni", "Nisporeni", "Ниспорены", "в Ниспоренах", "centru", 47.0814, 28.1783,
    [["Nisporeni", "Ниспорены"], ["Vărzărești", "Вэрзэрешть"], ["Grozești", "Грозешть"]], "Ниспоренский район"),
  raion("orhei", "Orhei", "Орхей", "в Орхее", "centru", 47.3831, 28.8231,
    [["Orhei", "Орхей"], ["Peresecina", "Пересечина"], ["Susleni", "Суслень"], ["Ivancea", "Иванча"]], "Оргеевский район"),
  raion("rezina", "Rezina", "Резина", "в Резине", "centru", 47.7492, 28.9622,
    [["Rezina", "Резина"], ["Ignăței", "Игнэцей"], ["Mateuți", "Матеуць"]], "Резинский район"),
  raion("straseni", "Strășeni", "Страшены", "в Страшенах", "centru", 47.1414, 28.6103,
    [["Strășeni", "Страшены"], ["Bucovăț", "Буковэц"], ["Lozova", "Лозова"], ["Sireți", "Сирець"]], "Страшенский район"),
  raion("telenesti", "Telenești", "Теленешты", "в Теленештах", "centru", 47.4997, 28.3656,
    [["Telenești", "Теленешты"], ["Sărătenii Vechi", "Сэрэтений Векь"], ["Mîndrești", "Мындрешть"]], "Теленештский район"),

  /* ---------------------------------------------------------------- nord */
  raion("briceni", "Briceni", "Бричаны", "в Бричанах", "nord", 48.3614, 27.0778,
    [["Briceni", "Бричаны"], ["Lipcani", "Липканы"], ["Larga", "Ларга"]], "Бричанский район"),
  raion("donduseni", "Dondușeni", "Дондюшаны", "в Дондюшанах", "nord", 48.2242, 27.585,
    [["Dondușeni", "Дондюшаны"], ["Tîrnova", "Тырнова"], ["Sudarca", "Сударка"]], "Дондюшанский район"),
  raion("drochia", "Drochia", "Дрокия", "в Дрокии", "nord", 48.0353, 27.8128,
    [["Drochia", "Дрокия"], ["Pelinia", "Пелиния"], ["Ochiul Alb", "Окюл-Алб"]], "Дрокиевский район"),
  raion("edinet", "Edineț", "Единцы", "в Единцах", "nord", 48.1681, 27.305,
    [["Edineț", "Единцы"], ["Cupcini", "Купчинь"], ["Gordinești", "Гординешть"]], "Единецкий район"),
  raion("falesti", "Fălești", "Фалешты", "в Фалештах", "nord", 47.5722, 27.7092,
    [["Fălești", "Фалешты"], ["Călinești", "Кэлинешть"], ["Răuțel", "Рэуцел"], ["Glinjeni", "Глинжень"]], "Фалештский район"),
  raion("floresti", "Florești", "Флорешты", "во Флорештах", "nord", 47.8933, 28.3014,
    [["Florești", "Флорешты"], ["Mărculești", "Мэркулешть"], ["Ghindești", "Гиндешть"], ["Ciutulești", "Чутулешть"]], "Флорештский район"),
  raion("glodeni", "Glodeni", "Глодяны", "в Глодянах", "nord", 47.7708, 27.5144,
    [["Glodeni", "Глодяны"], ["Cobani", "Кобань"], ["Balatina", "Балатина"]], "Глодянский район"),
  raion("ocnita", "Ocnița", "Окница", "в Окнице", "nord", 48.4108, 27.48,
    [["Ocnița", "Окница"], ["Otaci", "Атаки"], ["Frunză", "Фрунзэ"]], "Окницкий район"),
  raion("riscani", "Rîșcani", "Рышканы", "в Рышканах", "nord", 47.9556, 27.5539,
    [["Rîșcani", "Рышканы"], ["Costești", "Костешты"], ["Recea", "Реча"]], "Рышканский район"),
  raion("singerei", "Sîngerei", "Сынжерей", "в Сынжерей", "nord", 47.6389, 28.1419,
    [["Sîngerei", "Сынжерей"], ["Biruința", "Бируинца"], ["Pepeni", "Пепень"], ["Coșcodeni", "Кошкодень"]], "Сынжерейский район"),
  raion("soroca", "Soroca", "Сороки", "в Сороках", "nord", 48.1558, 28.2975,
    [["Soroca", "Сороки"], ["Vădeni", "Вэдень"], ["Racovăț", "Раковэц"], ["Cosăuți", "Косэуць"]], "Сорокский район"),
  raion("soldanesti", "Șoldănești", "Шолданешты", "в Шолданештах", "nord", 47.8161, 28.7967,
    [["Șoldănești", "Шолданешты"], ["Cotiujenii Mari", "Котюжений Марь"], ["Olișcani", "Олишкань"]], "Шолданештский район"),

  /* ----------------------------------------------------------------- sud */
  raion("cahul", "Cahul", "Кагул", "в Кагуле", "sud", 45.9075, 28.1944,
    [["Cahul", "Кагул"], ["Giurgiulești", "Джурджулешты"], ["Crihana Veche", "Крихана Веке"], ["Colibași", "Колибаш"]], "Кагульский район"),
  raion("basarabeasca", "Basarabeasca", "Басарабяска", "в Басарабяске", "sud", 46.3336, 28.9633,
    [["Basarabeasca", "Басарабяска"], ["Iordanovca", "Иордановка"], ["Sadaclia", "Садаклия"]], "Басарабянский район"),
  raion("cantemir", "Cantemir", "Кантемир", "в Кантемире", "sud", 46.2786, 28.2014,
    [["Cantemir", "Кантемир"], ["Cîietu", "Кыету"], ["Baimaclia", "Баймаклия"]], "Кантемирский район"),
  raion("causeni", "Căușeni", "Каушаны", "в Каушанах", "sud", 46.6436, 29.4114,
    [["Căușeni", "Каушаны"], ["Căinari", "Кайнары"], ["Tănătari", "Тэнэтарь"], ["Zaim", "Заим"]], "Каушанский район"),
  raion("cimislia", "Cimișlia", "Чимишлия", "в Чимишлии", "sud", 46.52, 28.7833,
    [["Cimișlia", "Чимишлия"], ["Gura Galbenei", "Гура Галбеней"], ["Sagaidac", "Сагайдак"]], "Чимишлийский район"),
  raion("leova", "Leova", "Леова", "в Леове", "sud", 46.4786, 28.2553,
    [["Leova", "Леова"], ["Iargara", "Яргара"], ["Filipeni", "Филипень"]], "Леовский район"),
  raion("stefan-voda", "Ștefan Vodă", "Штефан-Водэ", "в Штефан-Водэ", "sud", 46.5128, 29.6631,
    [["Ștefan Vodă", "Штефан-Водэ"], ["Slobozia Mare", "Слободзия Маре"], ["Olănești", "Оланешты"], ["Purcari", "Пуркарь"]], "Штефан-Водский район"),
  raion("taraclia", "Taraclia", "Тараклия", "в Тараклии", "sud", 45.9, 28.6689,
    [["Taraclia", "Тараклия"], ["Tvardița", "Твардица"], ["Corten", "Кортен"]], "Тараклийский район"),
];

export const localitate = (slug: string) => LOCALITATI.find((l) => l.slug === slug);

export const numeLoc = (l: Localitate, locale: "ro" | "ru") => (locale === "ru" ? l.ru : l.ro);

/** Distanța în linie dreaptă, în km, rotunjită la 5. Nu e drumul — pagina o spune. */
export function distantaKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  const km = 2 * 6371 * Math.asin(Math.sqrt(h));
  return Math.max(5, Math.round(km / 5) * 5);
}

/** Cele mai apropiate raioane — legăturile „livrăm și în…" de pe fiecare pagină. */
export function vecini(l: Localitate, n = 5) {
  return LOCALITATI.filter((x) => x.slug !== l.slug)
    .map((x) => ({ x, d: distantaKm(l, x) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, n)
    .map(({ x }) => x);
}

export const ZONE: ReadonlyArray<{ id: Zona; ro: string; ru: string }> = [
  { id: "municipiu", ro: "Municipii", ru: "Муниципии" },
  { id: "centru", ro: "Centru", ru: "Центр" },
  { id: "nord", ro: "Nord", ru: "Север" },
  { id: "sud", ro: "Sud și Găgăuzia", ru: "Юг и Гагаузия" },
];
