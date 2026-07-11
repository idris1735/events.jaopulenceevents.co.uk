-- ============================================================
-- FULL FIX: replaces old tiers (General Admission / VIP Table Access)
-- with correct Winter Masquerade Ball pricing.
-- Safe to run even if prior migrations have already been applied.
-- ============================================================

-- Event UUID (confirmed in Supabase)
-- id = ad40d369-f379-4f2a-a19f-41c5fe7d1f72

-- 1. Update the event — fix name, slug, and all details
update public.events set
  name           = 'Winter Masquerade Ball',
  slug           = 'winter-masquerade-ball',
  status         = 'published',
  summary        = 'Winter masquerade glamour with cocktail reception, live sax, DJs, red carpet, and bottomless drinks.',
  description    = 'J&A Opulence Events proudly presents the Winter Masquerade Ball, featuring DJ KK and a surprise DJ, cocktail reception, live sax, red carpet moments, live entertainment, bottomless drinks, and best masquerade awards for male and female guests. Super early bird pricing runs from April to June.',
  venue_name     = 'Grand Sapphire, Croydon',
  venue_address  = 'Full venue details will be released to guests soon.',
  starts_at      = '2026-11-28T18:00:00+00',
  ends_at        = '2026-11-29T02:00:00+00',
  hero_label     = 'Super Early Bird • April - June',
  dress_code     = 'Masquerade ball eveningwear.',
  sales_start_at = '2026-04-01T00:00:00+00',
  sales_end_at   = '2026-06-30T23:00:00+00',
  policies       = jsonb_build_object(
    'refund',  'Tickets are non-refundable unless the event is cancelled by the organiser.',
    'privacy', 'Guest information is used only for ticket delivery, event operations, and approved customer communication.',
    'terms',   'Ticket holders must present valid QR tickets at entry. Event management reserves the right to refuse entry for policy breaches.'
  ),
  gallery        = jsonb_build_array(
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80'
  )
where id = 'ad40d369-f379-4f2a-a19f-41c5fe7d1f72';

-- 2. Wipe ALL old tiers for this event (removes General Admission / VIP Table Access)
delete from public.ticket_tiers
where event_id = 'ad40d369-f379-4f2a-a19f-41c5fe7d1f72';

-- 3. Insert the correct 6 tiers
insert into public.ticket_tiers
  (event_id, name, description, price_gbp, capacity, remaining, max_per_order, guests_per_unit, status)
values
  ('ad40d369-f379-4f2a-a19f-41c5fe7d1f72', 'Standard Single',           'Standard entry for one guest.',                                          85.00, 120, 120, 6, 1,  'active'),
  ('ad40d369-f379-4f2a-a19f-41c5fe7d1f72', 'Standard Couples',          'Standard entry for two guests.',                                         165.00,  60,  60, 4, 2,  'active'),
  ('ad40d369-f379-4f2a-a19f-41c5fe7d1f72', 'Standard Group of 10',      'Group booking for ten guests.',                                          800.00,  12,  12, 1, 10, 'active'),
  ('ad40d369-f379-4f2a-a19f-41c5fe7d1f72', 'VIP Experience Single',     'VIP seated service plus a 3-course plated dinner for one guest.',         110.00,  80,  80, 6, 1,  'active'),
  ('ad40d369-f379-4f2a-a19f-41c5fe7d1f72', 'VIP Experience Couples',    'VIP seated service plus a 3-course plated dinner for two guests.',        210.00,  40,  40, 4, 2,  'active'),
  ('ad40d369-f379-4f2a-a19f-41c5fe7d1f72', 'VIP Experience Group of 10','VIP group booking with seated service and 3-course plated dinner.',       1000.00,  10,  10, 1, 10, 'active');

-- 4. Verify
select name, price_gbp, guests_per_unit, capacity, remaining, status
from public.ticket_tiers
where event_id = 'ad40d369-f379-4f2a-a19f-41c5fe7d1f72'
order by price_gbp;
