-- 0008 — retragem dreptul de execuție publică pe funcțiile de întreținere
-- Idempotentă. Rollback: supabase/rollback/0008_revoke_public_rpc.down.sql
--
-- Găsit la auditul din 27 august 2026: cele patru funcții `security definer`
-- din 0007 erau apelabile de oricine, fără cont, prin `/rest/v1/rpc/<nume>`.
-- Consecințele, în ordinea gravității:
--
--   prune_rate_limits()    — șterge contoarele de rată, deci dezarmează
--                            protecția anti-spam de pe comenzi și programări;
--   refresh_facet_counts() — `refresh materialized view` pe 15.010 rânduri,
--                            la fiecare apel, cât de des vrea apelantul;
--   refresh_brand_counts() — două `update` pe toată tabela `brands`;
--   enforce_rate_limit()   — permite umflarea contorului altui IP.
--
-- Niciuna nu e chemată din aplicație (zero `.rpc(` în `src/` și `tools/`):
-- se apelează din seed și din import, care rulează cu service role și nu sunt
-- afectate de `revoke`. Declanșatoarele de pe `orders` și `service_bookings`
-- rulează ca proprietarul funcției, deci continuă să funcționeze.

revoke execute on function public.prune_rate_limits()            from public, anon, authenticated;
revoke execute on function public.refresh_facet_counts()         from public, anon, authenticated;
revoke execute on function public.refresh_brand_counts()         from public, anon, authenticated;
revoke execute on function public.enforce_rate_limit(text, int)  from public, anon, authenticated;
revoke execute on function public.guard_public_insert()          from public, anon, authenticated;

-- Nota: dreptul venea din `PUBLIC` (implicit la `create function`), nu dintr-un
-- `grant` explicit catre `anon`, deci `revoke` trebuie sa numeasca `public`.

-- `search_path` fix pentru cele două funcții semnalate de linter: fără el, un
-- `search_path` ostil poate schimba ce tabelă vede funcția.
alter function public.set_updated_at() set search_path = public;
alter function public.client_ip()      set search_path = public;
