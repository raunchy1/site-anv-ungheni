-- Readuce `enforce_rate_limit` la forma din 0007, fără curățenie.
create or replace function enforce_rate_limit(p_action text, p_max int) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_ip text := client_ip();
  v_n  int;
begin
  if coalesce(current_setting('request.jwt.claim.role', true), current_user) in ('service_role', 'postgres') then
    return;
  end if;

  insert into rate_limits (ip, action) values (v_ip, p_action)
  on conflict (ip, action, window_start) do update set n = rate_limits.n + 1
  returning n into v_n;

  if v_n > p_max then
    raise exception 'prea multe cereri: maximum % pe oră pentru %', p_max, p_action
      using errcode = 'check_violation';
  end if;
end $$;
revoke execute on function public.enforce_rate_limit(text, int) from public, anon, authenticated;
