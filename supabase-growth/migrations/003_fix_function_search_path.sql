-- Fixes "Function Search Path Mutable" (Supabase security advisor, WARN) --
-- neither function was SECURITY DEFINER, so the practical risk was low, but
-- pinning search_path is a one-line fix that closes the class of
-- schema-injection issue this lint exists to catch.
create or replace function set_updated_at() returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function reserve_send_slot(p_date date, p_cap integer) returns boolean
language plpgsql
set search_path = public
as $$
declare
  current_count integer;
begin
  insert into daily_send_log (send_date, sent_count) values (p_date, 0)
    on conflict (send_date) do nothing;

  select sent_count into current_count from daily_send_log where send_date = p_date for update;

  if current_count >= p_cap then
    return false;
  end if;

  update daily_send_log set sent_count = sent_count + 1 where send_date = p_date;
  return true;
end;
$$;
