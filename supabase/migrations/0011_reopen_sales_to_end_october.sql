-- ============================================================
-- Reopen ticket sales.
-- The previous sales window closed on 2026-07-31. Sales are
-- reopened through the end of October 2026 (the event runs on
-- 2026-11-28), so buyers can purchase tickets for the
-- Winter Masquerade Ball.
-- ============================================================

update public.events
set sales_end_at = '2026-10-31T23:59:00+00'
where id = 'ad40d369-f379-4f2a-a19f-41c5fe7d1f72';

-- Verify
select id, name, sales_start_at, sales_end_at
from public.events
where id = 'ad40d369-f379-4f2a-a19f-41c5fe7d1f72';
