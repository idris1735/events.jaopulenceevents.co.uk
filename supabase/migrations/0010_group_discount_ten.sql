-- ============================================================
-- Group-of-10 discount: groups of 10+ pay £70 per guest.
--
-- Implemented automatically in code (lib/pricing.ts + checkout):
-- no promo code required. Buyers selecting 10+ Standard Single
-- tickets are charged £70 each at checkout.
--
-- 1. Allow Standard Single to be bought in quantities of 10+
--    (previously capped at 6 per order).
-- 2. Align the Standard Group of 10 bundle tier with the new
--    price (£70 x 10 = £700).
-- ============================================================

update public.ticket_tiers
set max_per_order = 20
where event_id = 'ad40d369-f379-4f2a-a19f-41c5fe7d1f72'
  and name = 'Standard Single';

update public.ticket_tiers
set price_gbp    = 700.00,
    description  = 'Group booking for ten guests at £70 per guest.'
where event_id = 'ad40d369-f379-4f2a-a19f-41c5fe7d1f72'
  and name = 'Standard Group of 10';

-- Verify
select name, price_gbp, guests_per_unit, max_per_order
from public.ticket_tiers
where event_id = 'ad40d369-f379-4f2a-a19f-41c5fe7d1f72'
order by price_gbp;
