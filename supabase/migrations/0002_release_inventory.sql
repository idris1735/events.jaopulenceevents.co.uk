create or replace function public.release_ticket_inventory(target_tier_id uuid, released_qty integer)
returns void
language plpgsql
security definer
as $$
begin
  update public.ticket_tiers
  set
    remaining = least(capacity, remaining + released_qty),
    status    = case
                  when status = 'sold_out' and (remaining + released_qty) > 0 then 'active'
                  else status
                end
  where id = target_tier_id;
end;
$$;
