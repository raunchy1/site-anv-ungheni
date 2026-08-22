/**
 * Dictionar minim pentru pagina de design system. Nu inlocuieste next-intl —
 * exista ca sa putem randa fiecare componenta in RO si in RU una langa alta
 * si sa vedem daca chirilicul sparge ceva.
 */

export type Locale = "ro" | "ru";

export type Dict = {
  htmlLang: string;
  // navigatie / general
  catalog: string;
  services: string;
  contact: string;
  search: string;
  searchPlaceholder: string;
  home: string;
  // dimensiune
  sizeSelectorTitle: string;
  width: string;
  aspect: string;
  diameter: string;
  showResults: string;
  results: string;
  resultsAvailable: string;
  reset: string;
  pickWidthFirst: string;
  pickAspectFirst: string;
  // produs
  specifications: string;
  size: string;
  season: string;
  loadIndex: string;
  speedIndex: string;
  brand: string;
  addToCart: string;
  priceOnRequest: string;
  callToOrder: string;
  inStock: string;
  supplierStock: string;
  /** Termenul de livrare, sub eticheta de stoc. Marfa vine de la furnizor in 1-3 zile. */
  supplierNote: string;
  inStockNote: string;
  outOfStock: string;
  alternatives: string;
  exactSize: string;
  nearSize: string;
  from: string;
  perTyre: string;
  // sezoane
  summer: string;
  winter: string;
  allSeason: string;
  // stari
  emptyCartTitle: string;
  emptyCartBody: string;
  noResultsTitle: string;
  noResultsBody: string;
  errorTitle: string;
  errorBody: string;
  retry: string;
  loading: string;
  typeMore: string;
  noImage: string;
  showUnavailable: string;
  // actiuni
  filter: string;
  compare: string;
  favorite: string;
  cart: string;
  page: string;
  of: string;
  previous: string;
  next: string;
  close: string;
  cancel: string;
  confirm: string;
};

const ro: Dict = {
  htmlLang: "ro",
  catalog: "Catalog anvelope",
  services: "Servicii",
  contact: "Contact",
  search: "Caută",
  searchPlaceholder: "Dimensiune, marcă sau model",
  home: "Acasă",
  sizeSelectorTitle: "Alege dimensiunea",
  width: "Lățime",
  aspect: "Înălțime",
  diameter: "Diametru",
  showResults: "Vezi rezultatele",
  results: "rezultate",
  resultsAvailable: "disponibile",
  reset: "Șterge",
  pickWidthFirst: "Alege întâi lățimea",
  pickAspectFirst: "Alege întâi înălțimea",
  specifications: "Specificații",
  size: "Dimensiune",
  season: "Sezon",
  loadIndex: "Indice de sarcină",
  speedIndex: "Indice de viteză",
  brand: "Marcă",
  addToCart: "Adaugă în coș",
  priceOnRequest: "Preț la cerere",
  callToOrder: "068 263 644",
  inStock: "În stoc",
  supplierStock: "Disponibil",
  supplierNote: "livrare 1–3 zile",
  inStockNote: "la magazin",
  outOfStock: "Indisponibil",
  alternatives: "Alternative disponibile",
  exactSize: "aceeași dimensiune",
  nearSize: "dimensiune apropiată",
  from: "de la",
  perTyre: "bucata",
  summer: "Vară",
  winter: "Iarnă",
  allSeason: "All season",
  emptyCartTitle: "Coșul este gol",
  emptyCartBody: "Alege o dimensiune și adaugă anvelopele de care ai nevoie.",
  noResultsTitle: "Nicio anvelopă pe această dimensiune",
  noResultsBody:
    "Dimensiunea există în catalog, dar toate variantele sunt momentan indisponibile.",
  errorTitle: "Nu am putut încărca rezultatele",
  errorBody: "Conexiunea a căzut la jumătatea cererii.",
  retry: "Încearcă din nou",
  loading: "Se încarcă",
  typeMore: "Mai scrie o literă",
  noImage: "Fără fotografie",
  showUnavailable: "Arată și produsele momentan indisponibile",
  filter: "Filtre",
  compare: "Compară",
  favorite: "Favorite",
  cart: "Coș",
  page: "Pagina",
  of: "din",
  previous: "Înapoi",
  next: "Înainte",
  close: "Închide",
  cancel: "Renunță",
  confirm: "Confirmă",
};

const ru: Dict = {
  htmlLang: "ru",
  catalog: "Каталог шин",
  services: "Услуги",
  contact: "Контакты",
  search: "Поиск",
  searchPlaceholder: "Размер, марка или модель",
  home: "Главная",
  sizeSelectorTitle: "Выберите размер",
  width: "Ширина",
  aspect: "Высота",
  diameter: "Диаметр",
  showResults: "Показать результаты",
  results: "результатов",
  resultsAvailable: "в наличии",
  reset: "Сбросить",
  pickWidthFirst: "Сначала выберите ширину",
  pickAspectFirst: "Сначала выберите высоту",
  specifications: "Характеристики",
  size: "Размер",
  season: "Сезон",
  loadIndex: "Индекс нагрузки",
  speedIndex: "Индекс скорости",
  brand: "Марка",
  addToCart: "В корзину",
  priceOnRequest: "Цена по запросу",
  callToOrder: "068 263 644",
  inStock: "В наличии",
  supplierStock: "Доступно",
  supplierNote: "доставка 1–3 дня",
  inStockNote: "в магазине",
  outOfStock: "Нет в наличии",
  alternatives: "Доступные альтернативы",
  exactSize: "тот же размер",
  nearSize: "близкий размер",
  from: "от",
  perTyre: "за шину",
  summer: "Лето",
  winter: "Зима",
  allSeason: "Всесезонные",
  emptyCartTitle: "Корзина пуста",
  emptyCartBody: "Выберите размер и добавьте нужные шины.",
  noResultsTitle: "Нет шин этого размера",
  noResultsBody:
    "Размер есть в каталоге, но все варианты сейчас недоступны.",
  errorTitle: "Не удалось загрузить результаты",
  errorBody: "Соединение прервалось на середине запроса.",
  retry: "Повторить",
  loading: "Загрузка",
  typeMore: "Введите ещё одну букву",
  noImage: "Без фотографии",
  showUnavailable: "Показать и недоступные товары",
  filter: "Фильтры",
  compare: "Сравнить",
  favorite: "Избранное",
  cart: "Корзина",
  page: "Страница",
  of: "из",
  previous: "Назад",
  next: "Вперёд",
  close: "Закрыть",
  cancel: "Отмена",
  confirm: "Подтвердить",
};

export const dictionaries: Readonly<Record<Locale, Dict>> = { ro, ru };

export const t = (locale: Locale): Dict => dictionaries[locale];
