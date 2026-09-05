-- 0026 — a doua sursă de catalog: pneuexpert.md
--
-- Strict ADITIVĂ, ca 0015. Niciun rând existent nu se modifică: coloana nouă e
-- nullable, iar indexul e parțial, deci cele 15.933 de produse de azi rămân
-- exact cum sunt.
--
-- DE CE O COLOANĂ SEPARATĂ ȘI NU UNA GENERICĂ `supplier_id`. Am cântărit un
-- tabel `supplier_refs` care ar fi ținut orice furnizor. E mai frumos și e
-- greșit acum: tot codul de sincronizare — potrivirea, recuperarea, cronul —
-- citește `products.pandashop_id` direct. O generalizare ar fi însemnat
-- rescrierea a șase fișiere care merg, ca să câștigăm un al treilea furnizor pe
-- care nu-l avem. Când apare al treilea, atunci se generalizează, cu două
-- exemple reale în față, nu cu unul și o presupunere.
--
-- Un produs poate avea AMBELE ID-uri: aceeași anvelopă se vinde și la pandashop,
-- și la pneuexpert. Potrivirea pe cheia naturală leagă rândul existent de al
-- doilea furnizor în loc să-l importe a doua oară.

alter table products add column if not exists pneuexpert_id text;

comment on column products.pneuexpert_id is
  'ID-ul produsului la pneuexpert.md — slug-ul lor din URL, care e stabil și unic (ex. „minerva_255_35_r18_94v_frostrack_uhp_xl_rear"). TEXT, ca și pandashop_id. NULL pe tot ce n-a fost văzut la ei.';

create unique index if not exists products_pneuexpert_id_uidx
  on products (pneuexpert_id) where pneuexpert_id is not null;

-- Carantina ține de acum două surse. `supplier` are implicit 'pandashop', deci
-- rândurile existente rămân corecte fără să fie atinse.
alter table sync_quarantine add column if not exists supplier text not null default 'pandashop';

comment on column sync_quarantine.supplier is
  'Furnizorul de la care vine ID-ul: „pandashop" sau „pneuexpert". Coloana `pandashop_id` își păstrează numele din 0015 ca să nu se rescrie codul care o citește; pentru pneuexpert ea ține slug-ul lor.';

-- Unicitatea trebuie să includă furnizorul: două surse pot avea același ID.
alter table sync_quarantine drop constraint if exists sync_quarantine_pandashop_id_reason_key;
create unique index if not exists sync_quarantine_supplier_id_reason_uidx
  on sync_quarantine (supplier, pandashop_id, reason);

-- Sursa rândului, pentru `products.source` și pentru jurnalul din `import_runs`.
-- În afara unui bloc `do $$`: `alter type ... add value` nu poate rula dintr-o
-- funcție, iar `if not exists` îl face idempotent.
alter type product_source add value if not exists 'pneuexpert_sync';
alter type import_source  add value if not exists 'pneuexpert_sync';
