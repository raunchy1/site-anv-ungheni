/** Lista de branduri din §2.4 a briefingului, pentru comparație. */
export const BRIEF_BRANDS = `ACCELERA, Achilles, Anchee, Annaite, Aoteli, Aplus, Aptany, Ardent, Arivo, Atlas, Atturo, Austone, Avon, Barum, Bearway, BELSHINA, BFGoodrich, Brics, Bridgestone, Ceat, Centara, Charmhoo, Comfoser, Compasal, Continental, Cooper, Crosswind, Davanti, Debica, Delinte, Diplomat, Doublestar, Dovroad, Dunlop, Duraturn, Falken, Federal, Firemax, Firestone, Fortuna, Fortune, Fronway, Fulda, Gislaved, GiTi, Goodride-WestLake, Goodyear, Greentrac, Grenlander, Gripmax, GT Radial, Habilead, Haida, Hankook, Hilo, ILINK, Imperial, Joyroad, Kapsen, Kelly, Kinforest, Kleber, Kormoran, Kpatos, Kumho, Kustone, Landspider, Lanvigator, Lassa, Laufenn, Leao, LingLong, Marshal, Matador, Maxxis, Michelin, Mileking, Minerva, Motrio, Nankang, Neolin, Nereus, Nexen, Nokian, Nordexx, ONYX, Orium, Otani, Ovation, Petlas, Pirelli, Platin, Point S, POWERTRAC, Premiorri, Prinx, Rapid, Riken, Roadboss, Roadstone, Roadx, Rockblade, Rosava, Rotex, Rovelo, Royal Black, Rydanz, Sailun, Sava, Semperit, Starmaxx, Strial, Sunny, Superia, Three-A, Tigar, Toledo, Torque, Tourador, Toyo, TRACMAX, TRIANGLE, TRISTAR, Unigrip, Uniroyal, Viking, Voyager, Vredestein, Waterfall, West Lake, Westlake, Yokohama, ZETA, Zmax`
  .split(',').map((s) => s.trim());

/** Rute rezervate în site-ul nou — niciun slug de produs nu are voie să se ciocnească cu ele. */
export const RESERVED_ROUTES = [
  'catalog-anvelope', 'senzori-presiune-anvelope', 'servicii', 'contact', 'cos', 'checkout',
  'comanda', 'favorite', 'comparare', 'admin', 'api', 'ru', 'cont', 'cautare', 'design-system',
  'sitemap.xml', 'robots.txt', '_next', 'image',
  'termeni-si-conditii', 'livrare-si-plata', 'retur-si-garantie', 'politica-de-confidentialitate',
  'slefuirea-discurilor-de-frana', 'balansarea-rotilor', 'reparatia-anvelopelor',
  'reparatia-discurilor', 'schimbul-rotilor', 'sudura-cu-argon', 'vopsirea-discurilor',
  'hotel-anvelope', 'incarcare-conditionere-auto-cu-freon',
];

export const RESERVED_ROUTES_RU = [
  'katalog-shin', 'datchiki-davleniya-v-shinah', 'uslugi', 'kontakty', 'korzina', 'oformlenie-zakaza',
  'zakaz', 'izbrannoe', 'sravnenie', 'admin', 'api', 'poisk',
  'zamena-koles', 'rihtovka-diskov', 'remont-shin', 'balansirovka-kolyos', 'argonnaya-svarka',
  'pokraska-diskov', 'protochka-tormoznyh-diskov', 'hranenie-shin', 'zapravka-avtokondicionera',
];

export const SPEED_INDICES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'H', 'V', 'W', 'Y', 'Z', 'ZR'];
