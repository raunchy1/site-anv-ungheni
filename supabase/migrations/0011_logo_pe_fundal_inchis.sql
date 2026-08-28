-- 0011 — logo-urile desenate în alb primesc placă închisă
-- Idempotentă. Rollback: supabase/rollback/0011_logo_pe_fundal_inchis.down.sql
--
-- Aproape o treime dintre producători publică doar varianta albă a logo-ului:
-- e cea din antetul propriului site, care are fundal închis. Pe placa deschisă
-- a cardului nostru ar fi invizibilă, iar alternativa — să nu punem logo — ne
-- costa 1.500 de produse fără identitate vizuală.
--
-- Soluția nu e să redesenăm logo-ul, ci să-i dăm suprafața pentru care a fost
-- desenat: `BrandLogo` randează placa închisă când steagul e ridicat.
-- Se completează automat de `tools/logos/import-logos.mjs`, care măsoară
-- luminanța pixelilor opaci.

alter table brands add column if not exists logo_on_dark boolean not null default false;

comment on column brands.logo_on_dark is
  'Logo-ul e desenat în alb și se randează pe placă închisă. Setat de importator, nu manual.';
