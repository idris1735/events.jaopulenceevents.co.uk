-- ============================================================
-- Update ticket tier prices to final official pricing
-- Run in Supabase SQL Editor
-- Safe to run: only updates price_gbp (does not touch capacity or remaining)
-- ============================================================

-- Standard Single: £75 → £85
update public.ticket_tiers
set price_gbp = 85.00, description = 'Standard entry for one guest.'
where event_id = 'ad40d369-f379-4f2a-a19f-41c5fe7d1f72'
  and name = 'Standard Single';

-- Standard Couples: £145 → £165
update public.ticket_tiers
set price_gbp = 165.00, description = 'Standard entry for two guests.'
where event_id = 'ad40d369-f379-4f2a-a19f-41c5fe7d1f72'
  and name = 'Standard Couples';

-- Standard Group of 10: £700 → £800
update public.ticket_tiers
set price_gbp = 800.00, description = 'Group booking for ten guests.'
where event_id = 'ad40d369-f379-4f2a-a19f-41c5fe7d1f72'
  and name = 'Standard Group of 10';

-- VIP Single: £90 → £110
update public.ticket_tiers
set price_gbp = 110.00
where event_id = 'ad40d369-f379-4f2a-a19f-41c5fe7d1f72'
  and name = 'VIP Experience Single';

-- VIP Couples: £170 → £210
update public.ticket_tiers
set price_gbp = 210.00
where event_id = 'ad40d369-f379-4f2a-a19f-41c5fe7d1f72'
  and name = 'VIP Experience Couples';

-- VIP Group of 10: £899 → £1,000
update public.ticket_tiers
set price_gbp = 1000.00
where event_id = 'ad40d369-f379-4f2a-a19f-41c5fe7d1f72'
  and name = 'VIP Experience Group of 10';

-- Verify
select name, price_gbp, status, remaining
from public.ticket_tiers
where event_id = 'ad40d369-f379-4f2a-a19f-41c5fe7d1f72'
order by price_gbp;
