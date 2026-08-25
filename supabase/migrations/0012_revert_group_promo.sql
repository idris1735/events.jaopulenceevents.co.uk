-- ============================================================
-- Revert the group-of-10 promo (migration 0010).
-- The promo has ended: prices return to normal.
--
-- 1. Standard Single max_per_order back to 6
--    (was raised to 20 for the group discount).
-- 2. Standard Group of 10 back to £800
--    (was temporarily reduced to £700).
-- ============================================================

update public.ticket_tiers
set max_per_order = 6
where event_id = 'ad40d369-f379-4f2a-a19f-41c5fe7d1f72'
  and name = 'Standard Single';

update public.ticket_tiers
set price_gbp    = 800.00,
    description  = 'Group booking for ten guests.'
where event_id = 'ad40d369-f379-4f2a-a19f-41c5fe7d1f72'
  and name = 'Standard Group of 10';

-- Verify
select name, price_gbp, guests_per_unit, max_per_order
from public.ticket_tiers
where event_id = 'ad40d369-f379-4f2a-a19f-41c5fe7d1f72'
order by price_gbp;
