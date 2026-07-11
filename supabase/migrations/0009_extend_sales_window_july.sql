-- ============================================================
-- Fix: ticket sales were fully closed site-wide from 1 July onward
-- because sales_end_at was never moved off the original 30 June date.
-- Josephine extended sales (Standard tier legacy pricing) through
-- end of July, so the site-wide sales window is extended to match.
--
-- NOTE: legacy Standard pricing (£75/£145/£800) is handled via three
-- Stripe promotion codes (STANDARD75, COUPLES145, GROUP700), not by
-- rolling back ticket_tiers.price_gbp — the tier prices stay at the
-- official new prices (£85/£165/£800/£110/£210/£1000). The codes
-- expire automatically on 2026-07-31 23:59:59 UTC.
-- ============================================================

update public.events
set sales_end_at = '2026-07-31T23:59:00+00'
where id = 'ad40d369-f379-4f2a-a19f-41c5fe7d1f72';

-- Verify
select id, name, sales_start_at, sales_end_at
from public.events
where id = 'ad40d369-f379-4f2a-a19f-41c5fe7d1f72';
