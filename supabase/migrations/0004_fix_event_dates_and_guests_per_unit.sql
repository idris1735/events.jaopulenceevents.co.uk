-- Fix Winter Masquerade Ball event dates (seed used placeholder year 2099)
update public.events
set
  starts_at = '2026-11-28T18:00:00+00',
  ends_at   = '2026-11-29T02:00:00+00'
where slug = 'winter-masquerade-ball';

-- Fix guests_per_unit for bundle tiers (migration 0003 added the column with default 1,
-- so Couples and Group tiers still have guests_per_unit = 1)
update public.ticket_tiers
set guests_per_unit = 2
where event_id = (select id from public.events where slug = 'winter-masquerade-ball')
  and name in ('Standard Couples', 'VIP Experience Couples');

update public.ticket_tiers
set guests_per_unit = 10
where event_id = (select id from public.events where slug = 'winter-masquerade-ball')
  and name in ('Standard Group of 10', 'VIP Experience Group of 10');
