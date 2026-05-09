-- Fix ambiguous "remaining" column reference in reserve_ticket_inventory.
-- The function's RETURNS TABLE had a column also named "remaining", which
-- conflicted with ticket_tiers.remaining inside the UPDATE statement.

create or replace function public.reserve_ticket_inventory(target_tier_id uuid, requested_qty integer)
returns table(success boolean, remaining integer, new_status text)
language plpgsql
security definer
as $$
declare
  updated_row public.ticket_tiers%rowtype;
begin
  if requested_qty <= 0 then
    return query select false::boolean, null::integer, null::text;
    return;
  end if;

  update public.ticket_tiers t
  set remaining = t.remaining - requested_qty,
      status = case
        when t.remaining - requested_qty <= 0 then 'sold_out'
        else t.status
      end
  where t.id = target_tier_id
    and t.status = 'active'
    and t.remaining >= requested_qty
  returning t.* into updated_row;

  if updated_row.id is null then
    return query select false::boolean, null::integer, null::text;
  else
    return query select true::boolean, updated_row.remaining::integer, updated_row.status::text;
  end if;
end;
$$;
