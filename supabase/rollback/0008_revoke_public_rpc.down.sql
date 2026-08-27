-- Anulează 0008. Nu se rulează decât dacă o funcție trebuie chemată din client.
grant execute on function public.prune_rate_limits()           to public;
grant execute on function public.refresh_facet_counts()        to public;
grant execute on function public.refresh_brand_counts()        to public;
grant execute on function public.enforce_rate_limit(text, int) to public;
grant execute on function public.guard_public_insert()         to public;
