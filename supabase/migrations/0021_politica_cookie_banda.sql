-- 0021 — politica de cookie, adusă la zi după apariția benzii de consimțământ.
--
-- Textul din 0017/0019 spunea, corect pentru ziua aceea, că site-ul nu cere
-- acordul prin nicio bandă. De la 5 septembrie 2026 cere: harta Google de pe
-- contact, prima pagină și fișa de produs nu se mai încarcă până când omul
-- răspunde. O politică de cookie care contrazice ce face pagina e mai rea decât
-- una absentă, așa că se modifică exact paragrafele care nu mai sunt adevărate.
--
-- Se schimbă prin `replace` pe fragmente exacte, nu prin rescrierea corpului:
-- restul textului e bun și n-are de ce să fie atins. Rulată de două ori nu
-- strică nimic — fragmentele vechi nu mai există la a doua trecere.

update legal_pages set
  body_ro = replace(replace(replace(replace(replace(body_ro,

    'De asta nu-ți sare în față nicio bandă care să-ți ceară acordul — n-avem pentru ce.',
    'Singurul lucru pentru care îți cerem acordul este harta Google de pe pagina de contact: până răspunzi, ea nu se încarcă deloc.'),

    '<tr><td><strong>au:size</strong></td><td>Ultima dimensiune căutată, de exemplu 205/55 R16</td><td>Ca formularul de căutare să o aibă deja completată data viitoare</td></tr>',
    '<tr><td><strong>au:size</strong></td><td>Ultima dimensiune căutată, de exemplu 205/55 R16</td><td>Ca formularul de căutare să o aibă deja completată data viitoare</td></tr>
    <tr><td><strong>au:consim</strong></td><td>Răspunsul tău la banda de cookie</td><td>Ca să nu te mai întrebăm la fiecare pagină. Îl poți schimba oricând din „Setări cookie", în subsol</td></tr>'),

    '<li><strong>Harta Google de pe pagina de contact.</strong> Nu se încarcă odată cu pagina: apare abia când derulezi până la ea. Din clipa aceea, Google poate pune propriile cookie-uri, după politica lui. Dacă nu derulezi până la hartă, nu se încarcă nimic de la Google.</li>',
    '<li><strong>Harta Google de pe pagina de contact.</strong> Nu se încarcă odată cu pagina și nu se încarcă nici dacă derulezi până la ea: are nevoie de acordul tău, dat fie din banda de jos, fie printr-un clic pe locul hărții. Din clipa aceea Google îți vede adresa IP și poate pune propriile cookie-uri, după politica lui. Fără acordul tău nu pleacă nimic spre Google.</li>'),

    '<h2>5. De ce nu-ți cerem acordul printr-o bandă</h2>
<p>Acordul se cere pentru cookie-urile care urmăresc, măsoară sau fac publicitate. Singurul nostru cookie face ca site-ul să-ți vorbească în limba pe care ai cerut-o — e strict necesar pentru ce ne-ai cerut tu să facem. O bandă de acord peste un site fără urmărire ar fi doar un obstacol în plus, nu o protecție.</p>
<p>Dacă vom adăuga vreodată statistici sau publicitate, banda apare înainte de primul cookie de acest fel, nu după.</p>',
    '<h2>5. Pentru ce îți cerem acordul</h2>
<p>Pentru un singur lucru: harta Google. Nu pentru că am urmări pe cineva, ci pentru că încărcarea hărții trimite adresa ta IP la Google și îi dă voie să pună cookie-urile lui — iar asta nu e ceva ce putem hotărî în locul tău.</p>
<p>Banda are două butoane la fel de mari, „Doar necesare" și „Accept harta", pentru că un refuz greu de găsit n-ar fi un refuz. Până apeși unul dintre ele nu se încarcă nimic de la Google. Alegerea se schimbă oricând din „Setări cookie", în subsolul fiecărei pagini.</p>
<p>Pentru restul — coșul, limba, dimensiunea ținută minte — nu-ți cerem acordul, fiindcă fără ele nu putem face lucrul pentru care ai venit, iar datele nu pleacă nicăieri de pe dispozitivul tău.</p>
<p>Dacă vom adăuga vreodată statistici sau publicitate, ele intră în bandă înainte de primul cookie de acest fel, nu după.</p>'),

    'Ce se strică dacă le blochezi: limba nu se mai ține minte de la o pagină la alta, iar coșul se golește când închizi fila.',
    'Ce se strică dacă le blochezi: limba nu se mai ține minte de la o pagină la alta, coșul se golește când închizi fila, iar banda de cookie va reapărea la fiecare vizită, pentru că răspunsul tău nu mai are unde să fie ținut minte.'),

  body_ru = replace(replace(replace(replace(replace(body_ru,

    'Поэтому вам и не выскакивает баннер с просьбой о согласии — просить не о чем.',
    'Единственное, о чём мы просим согласия, — карта Google на странице контактов: пока вы не ответите, она вообще не загружается.'),

    '<tr><td><strong>au:size</strong></td><td>Последний искомый размер, например 205/55 R16</td><td>Чтобы в следующий раз форма поиска была уже заполнена</td></tr>',
    '<tr><td><strong>au:size</strong></td><td>Последний искомый размер, например 205/55 R16</td><td>Чтобы в следующий раз форма поиска была уже заполнена</td></tr>
    <tr><td><strong>au:consim</strong></td><td>Ваш ответ на баннер cookie</td><td>Чтобы не спрашивать на каждой странице. Изменить можно в любой момент через «Настройки cookie» внизу страницы</td></tr>'),

    '<li><strong>Карта Google на странице контактов.</strong> Она не грузится вместе со страницей: появляется, только когда вы до неё долистаете. С этого момента Google может ставить свои cookie, по своим правилам. Не долистали до карты — от Google не загружается ничего.</li>',
    '<li><strong>Карта Google на странице контактов.</strong> Она не грузится вместе со страницей и не загрузится, даже если вы до неё долистаете: нужно ваше согласие — через баннер внизу или нажатием на место карты. С этого момента Google видит ваш IP-адрес и может ставить свои cookie, по своим правилам. Без вашего согласия в Google не уходит ничего.</li>'),

    '<h2>5. Почему мы не просим согласия баннером</h2>
<p>Согласие спрашивают для cookie, которые следят, измеряют или показывают рекламу. Наш единственный cookie нужен, чтобы сайт говорил с вами на выбранном вами языке — он строго необходим для того, о чём вы сами попросили. Баннер согласия на сайте без слежки был бы просто лишней преградой, а не защитой.</p>
<p>Если мы когда-нибудь добавим статистику или рекламу, баннер появится до первого такого cookie, а не после.</p>',
    '<h2>5. О чём мы просим согласия</h2>
<p>Об одном: о карте Google. Не потому, что мы за кем-то следим, а потому, что загрузка карты отправляет ваш IP-адрес в Google и разрешает ему поставить свои cookie, — а это не то, что мы вправе решать за вас.</p>
<p>У баннера две одинаково крупные кнопки, «Только необходимые» и «Разрешить карту»: спрятанный отказ — не отказ. Пока вы не нажали одну из них, от Google не загружается ничего. Выбор меняется в любой момент через «Настройки cookie» внизу каждой страницы.</p>
<p>На остальное — корзину, язык, запомненный размер — согласия не спрашиваем: без них мы не сможем сделать то, за чем вы пришли, а данные никуда не уходят с вашего устройства.</p>
<p>Если мы когда-нибудь добавим статистику или рекламу, они попадут в баннер до первого такого cookie, а не после.</p>'),

    'Что сломается, если их заблокировать: язык перестанет запоминаться от страницы к странице, а корзина будет очищаться при закрытии вкладки.',
    'Что сломается, если их заблокировать: язык перестанет запоминаться от страницы к странице, корзина будет очищаться при закрытии вкладки, а баннер cookie будет появляться при каждом визите — вашему ответу негде будет храниться.'),

  updated_at = now()
where slug_ro = 'politica-cookie';
