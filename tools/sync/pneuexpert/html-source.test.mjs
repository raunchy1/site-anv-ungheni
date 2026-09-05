/**
 * Teste pe citirea paginilor de la pneuexpert. Fără rețea: fragmente de HTML
 * exact în forma în care le scriu ei.
 *
 *   node --test tools/sync/pneuexpert/*.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseProprietati, parseSitemap, parseListare, refDinUrl, construiesteTitlu, parseProdus, imagini, brandDinAdresa } from './html-source.mjs';

const prop = (t, v) => `<div class="detail-property-item"> <div class="detail-property-title">${t}</div> <div class="detail-property-delimiter"></div> <div class="detail-property-value"> ${v} </div> </div>`;

const pagina = ({ h1, props, pret = 1850, disp = 'OutOfStock', poze = ['/upload/iblock/d6e/foto.jpg'] }) => `
<html><head>
<meta property="og:image" content="https://pneuexpert.md/upload/iblock/a5f/mare.jpg"/>
</head><body>
<h1>${h1}</h1>
<div class="product-item-detail-slider-images-container" data-entity="images-container">
${poze.map((p) => `<div class="product-item-detail-slider-image active" data-entity="image"><img src="${p}" alt="x"></div>`).join('')}
</div><div class="product-item-detail-slider-controls"></div>
<meta itemprop="price" content="${pret}" />
<meta itemprop="priceCurrency" content="MDL" />
<link itemprop="availability" href="http://schema.org/${disp}" />
<div class="detail-characteristics"><h3>Caracteristici</h3><dl class="product-item-detail-properties">
${props.map(([t, v]) => prop(t, v)).join('')}
</dl></div>
<script>var alteProduse = {'PICT':{'SRC':'/upload/iblock/999/alt-produs.jpg'}};</script>
</body></html>`;

const PROPS_MINERVA = [
  ['Brand', '<a href="/catalog/tires/minerva/leto-vara/">Minerva</a>'],
  ['Model', 'Frostrack UHP'],
  ['Țara de origine', 'China'],
  ['Sezon', 'Iarna'],
  ['Diametru', '18'],
  ['Mărime', '255/35 R18'],
  ['Lățime anvelopa', '255'],
  ['Înălțime profil', '35'],
  ['Indicele de greutate', '94'],
  ['Indicele de viteza', 'V'],
];

test('tabelul de caracteristici se citește ca perechi, cu linkurile scoase', () => {
  const p = parseProprietati(pagina({ h1: 'Anvelopă X', props: PROPS_MINERVA }));
  assert.equal(p.Brand, 'Minerva', 'valoarea e un <a>, se ia textul');
  assert.equal(p.Model, 'Frostrack UHP');
  assert.equal(p['Mărime'], '255/35 R18');
});

test('titlul se reconstruiește în convenția catalogului nostru, nu în a lor', () => {
  const p = parseProdus(pagina({ h1: 'Anvelopă MINERVA 255/35 R18 94V FROSTRACK UHP XL (rear)', props: PROPS_MINERVA }), { id: 'm1', url: '/catalog/tires/m1/' });
  assert.equal(p.titleRo, 'Minerva Frostrack UHP 255/35 R18 94V XL (rear)');
  assert.equal(p.titleRu, p.titleRo, 'pagina lor rusă arată același șir latin');
  assert.equal(p.isXl, true);
  assert.equal(p.priceMdl, 1850);
  assert.equal(p.stockStatus, 'out_of_stock');
  assert.equal(p.seasonRaw, 'Iarna');
});

test('„XL" se citește ca și cuvânt întreg, nu ca literele din alt nume', () => {
  const p = parseProdus(pagina({ h1: 'Anvelopă KAPSEN 215/45 R17 91W K3000 XLB', props: [['Brand', 'Kapsen'], ['Model', 'K3000'], ['Mărime', '215/45 R17'], ['Indicele de greutate', '91'], ['Indicele de viteza', 'W']] }), { id: 'k', url: '/catalog/tires/k/' });
  assert.equal(p.isXl, false, '„XLB" nu e XL');
});

test('litera C a anvelopelor de marfă se ia din numele lor când lipsește din „Mărime"', () => {
  const p = parseProdus(pagina({ h1: 'Anvelopă NEREUS 195/70 R15C 104/102R NS500', props: [['Brand', 'Nereus'], ['Model', 'NS500'], ['Mărime', '195/70 R15'], ['Indicele de greutate', '104/102'], ['Indicele de viteza', 'R']] }), { id: 'n', url: '/catalog/tires/n/' });
  assert.equal(p.sizeRaw, '195/70 R15C');
});

test('dimensiunea se recompune din cele trei numere dacă nu dau „Mărime"', () => {
  const p = parseProdus(pagina({ h1: 'Anvelopă X 205/55 R16', props: [['Brand', 'Kapsen'], ['Model', 'K3000'], ['Lățime anvelopa', '205'], ['Înălțime profil', '55'], ['Diametru', '16']] }), { id: 'x', url: '/catalog/tires/x/' });
  assert.equal(p.sizeRaw, '205/55 R16');
});

test('stocul lor se traduce în al nostru', () => {
  const cu = (d) => parseProdus(pagina({ h1: 'Anvelopă X', props: PROPS_MINERVA, disp: d }), { id: 'x', url: '/x/' }).stockStatus;
  assert.equal(cu('InStock'), 'supplier');
  assert.equal(cu('OutOfStock'), 'out_of_stock');
  assert.equal(cu('CevaNou'), 'out_of_stock', 'o valoare pe care n-o știm nu devine „disponibil"');
});

test('se iau doar pozele produsului, nu și ale recomandărilor de dedesubt', () => {
  const p = parseProdus(pagina({ h1: 'Anvelopă X', props: PROPS_MINERVA }), { id: 'x', url: '/x/' });
  const url = p.images.map((i) => i.url);
  assert.ok(url.some((u) => u.endsWith('/foto.jpg')), 'poza din galerie');
  assert.ok(url.some((u) => u.endsWith('/mare.jpg')), 'og:image, uneori mai mare');
  assert.ok(!url.some((u) => u.includes('alt-produs')), 'poza altui produs NU intră în catalog');
});

test('o pagină fără tabel de caracteristici e structură schimbată, nu produs gol', () => {
  assert.throws(() => parseProdus('<html><h1>Anvelopă X</h1></html>', { id: 'x', url: '/x/' }), /caracteristici/);
});

test('adresele de catalog se împart în produse și categorii', () => {
  assert.deepEqual(refDinUrl('/catalog/tires/shiny_dlya_avto_anvelope_autoturisme/nereus_155_70_r13/'), { id: 'nereus_155_70_r13', url: '/catalog/tires/shiny_dlya_avto_anvelope_autoturisme/nereus_155_70_r13/' });
  assert.equal(refDinUrl('/catalog/tires/shiny_dlya_avto_anvelope_autoturisme/'), null, 'categorie, nu produs');
  assert.equal(refDinUrl('/catalog/tires/'), null);
  assert.equal(refDinUrl('/catalog/tires/vnedorozhniki_suv/filter/'), null, 'pagina de filtre nu e produs');
  assert.equal(refDinUrl('/catalog/diski_jante/ceva/'), null, 'jantele nu ne interesează');
  assert.ok(refDinUrl('/catalog/tires/minerva_255_35_r18_94v_frostrack_uhp_xl_rear/'), 'și adresele scurte sunt produse');
});

test('sitemap-ul dă doar produse', () => {
  const xml = `<urlset><url><loc>https://pneuexpert.md/catalog/tires/</loc></url>
  <url><loc>https://pneuexpert.md/catalog/tires/vnedorozhniki_suv/x_1/</loc></url>
  <url><loc>https://pneuexpert.md/catalog/acumulatoare/y/</loc></url></urlset>`;
  assert.deepEqual(parseSitemap(xml).map((r) => r.id), ['x_1']);
});

test('listarea dă produsele paginii, fără duplicate', () => {
  const html = `<a href="/catalog/tires/vnedorozhniki_suv/a_1/">x</a><a href="/catalog/tires/vnedorozhniki_suv/a_1/">poza</a><a href="/catalog/tires/vnedorozhniki_suv/b_2/">y</a>`;
  assert.deepEqual(parseListare(html).map((r) => r.id), ['a_1', 'b_2']);
});

test('titlul construit sare peste câmpurile care lipsesc', () => {
  assert.equal(construiesteTitlu({ brand: 'Nereus', model: 'NS500', size: '195/70 R15C', load: '104/102', speed: 'R' }), 'Nereus NS500 195/70 R15C 104/102R');
  assert.equal(construiesteTitlu({ brand: 'Nereus', model: 'NS500', size: '195/70 R15C' }), 'Nereus NS500 195/70 R15C');
});

test('modelul se culege din numele lor când tabelul nu-l are', () => {
  const p = parseProdus(pagina({
    h1: 'Anvelopă HANKOOK 235/50 R18 100V Dynapro HP2 RA33',
    props: [['Brand', 'Hankook'], ['Sezon', 'Vara'], ['Lățime anvelopa', '235'], ['Înălțime profil', '50'], ['Diametru', '18'], ['Indicele de greutate', '100'], ['Indicele de viteza', 'V']],
  }), { id: 'h', url: '/h/' });
  assert.equal(p.modelRaw, 'Dynapro HP2 RA33', 'numele lor e cu majuscule; în catalog intră scris normal');
  assert.equal(p.titleRo, 'Hankook Dynapro HP2 RA33 235/50 R18 100V');
});

test('indicele scris cu Т chirilic nu ajunge în model', () => {
  const p = parseProdus(pagina({
    h1: 'Anvelopă LAUFENN 195/65 R15 95Т XL i*Fit Ice LW71',
    props: [['Brand', 'Laufenn'], ['Lățime anvelopa', '195'], ['Înălțime profil', '65'], ['Diametru', '15'], ['Indicele de greutate', '95'], ['Indicele de viteza', 'T']],
  }), { id: 'l', url: '/l/' });
  assert.ok(!/95/.test(p.modelRaw), `„95Т" cu Т rusesc trebuie recunoscut ca indice, nu ca model: ${p.modelRaw}`);
});

test('marca lipsă din tabel se ia din adresă, dar scrisă cum e pe pagină', () => {
  /* Adresa lor scrie „comforcer", pagina scrie „Comforser". Pagina are dreptate. */
  assert.equal(brandDinAdresa('comforcer_195_65_r16c_cf360_104_102r', 'Comforser 195/65 R16C 104/102R Cargo Snow CF360'), 'Comforser');
  assert.equal(brandDinAdresa('supera_265_40_r21_105w_xl_sport_sa37', 'SUPERIA 265/40 R21 105W XL Sport SA37'), 'Superia');
  /* Aici numele începe cu MODELUL, deci marca rămâne cea din adresă. */
  assert.equal(brandDinAdresa('westlake_245_45_r18_100w_xl_zupereco_z_107', 'ZuperEco Z-107 245/45 R18 100W XL'), 'Westlake');
  assert.equal(brandDinAdresa('195_65_r15', 'ceva'), null, 'o adresă care începe cu cifre nu dă marcă');
});

test('diametrul de camion, „R17,5", nu se lipește a doua oară', () => {
  const p = parseProdus(pagina({
    h1: 'Anvelopă OTANI OH-109 215/75 R17,5 135/133K All Position',
    props: [['Brand', 'Otani'], ['Model', 'OH-109 All Position'], ['Lățime anvelopa', '215'], ['Înălțime profil', '75'], ['Diametru', 'R17,5'], ['Indicele de greutate', '135/133'], ['Indicele de viteza', 'K']],
  }), { id: 'o', url: '/o/' });
  assert.equal(p.sizeRaw, '215/75 R17.5');
});

test('„Mărime" fără diametru se completează din câmpul „Diametru"', () => {
  const p = parseProdus(pagina({
    h1: 'Anvelopă MICHELIN 215/55 R16 93H Alpin 6',
    props: [['Brand', 'Michelin'], ['Model', 'Alpin 6'], ['Mărime', '215/55'], ['Diametru', '16'], ['Indicele de greutate', '93'], ['Indicele de viteza', 'H']],
  }), { id: 'm', url: '/m/' });
  assert.equal(p.sizeRaw, '215/55 R16');
});

test('o fișă vândută sub două mărci nu creează o a treia', () => {
  assert.equal(brandDinAdresa('westlake_225_50_r17_98w_zupereco_z_107', 'Westlake/Goodride 225/50 R17 98W ZuperEco Z-107'), 'Westlake');
  assert.equal(brandDinAdresa('goodride_225_50_r17_98w_zupereco_z_107', 'Westlake/Goodride 225/50 R17 98W ZuperEco Z-107'), 'Goodride');
});
