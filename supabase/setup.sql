-- ============================================================
-- J&A Opulence Events — Supabase Setup Script
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- Safe to re-run: all statements use IF NOT EXISTS / OR REPLACE
-- ============================================================

-- ── 1. Reserve inventory RPC (atomic, prevents overselling) ──
create or replace function public.reserve_ticket_inventory(
  target_tier_id uuid,
  requested_qty  integer
)
returns table(success boolean, remaining integer, new_status text)
language plpgsql
security definer
as $$
declare
  updated_row public.ticket_tiers%rowtype;
begin
  if requested_qty <= 0 then
    return query select false, null::integer, null::text;
    return;
  end if;

  update public.ticket_tiers
  set remaining = remaining - requested_qty,
      status    = case
                    when remaining - requested_qty <= 0 then 'sold_out'
                    else status
                  end
  where id     = target_tier_id
    and status = 'active'
    and remaining >= requested_qty
  returning * into updated_row;

  if updated_row.id is null then
    return query select false, null::integer, null::text;
  else
    return query select true, updated_row.remaining, updated_row.status;
  end if;
end;
$$;

-- ── 2. Release inventory RPC (used on checkout.session.expired) ──
create or replace function public.release_ticket_inventory(
  target_tier_id uuid,
  released_qty   integer
)
returns void
language plpgsql
security definer
as $$
begin
  update public.ticket_tiers
  set remaining = least(capacity, remaining + released_qty),
      status    = case
                    when status = 'sold_out' and (remaining + released_qty) > 0 then 'active'
                    else status
                  end
  where id = target_tier_id;
end;
$$;

-- ── 3. Tickets storage bucket ──
-- Run in SQL Editor (storage schema)
insert into storage.buckets (id, name, public)
values ('tickets', 'tickets', false)
on conflict (id) do nothing;

-- Service role can read/write all objects
drop policy if exists "service role full access" on storage.objects;
create policy "service role full access"
  on storage.objects
  for all
  to service_role
  using (bucket_id = 'tickets')
  with check (bucket_id = 'tickets');

-- ── 4. Seed: admin owner account ──
-- IMPORTANT: First create an Auth user in Supabase Dashboard →
--   Authentication → Users → Invite user (or Add user)
--   Email: admin@jaopulenceevents.co.uk  (or your preferred email)
--   Then paste the new user's UUID below and run this block.
--
-- Replace 'YOUR-AUTH-USER-UUID-HERE' with the actual UUID:
do $$
declare
  v_user_id uuid := 'YOUR-AUTH-USER-UUID-HERE';
begin
  if v_user_id::text = 'YOUR-AUTH-USER-UUID-HERE' then
    raise notice 'Skipping admin profile — replace v_user_id with a real UUID.';
  else
    insert into public.admin_profiles (supabase_user_id, display_name, role)
    values (v_user_id, 'J&A Admin', 'owner')
    on conflict (supabase_user_id) do update
      set role = 'owner', display_name = 'J&A Admin';
    raise notice 'Admin profile created/updated for %', v_user_id;
  end if;
end $$;

-- ── 5. Seed: sample published event with two ticket tiers ──
-- Remove or edit this block once you create real events via the admin UI.
do $$
declare
  v_event_id uuid;
begin
  -- Only insert if no events exist yet
  if (select count(*) from public.events) = 0 then

    insert into public.events (
      name, slug, status, summary, description,
      venue_name, venue_address,
      starts_at, ends_at,
      hero_label, dress_code,
      sales_start_at, sales_end_at,
      policies, gallery
    ) values (
      'An Evening of Opulence',
      'evening-of-opulence',
      'published',
      'A night of luxury dining, live entertainment and dancing.',
      'Join us for an unforgettable black-tie evening at one of London''s most prestigious venues. Enjoy a five-course dinner, live jazz, and dancing until midnight.',
      'The Grand Ballroom',
      '14 Mayfair Lane, London W1K 1AB',
      now() + interval '60 days',
      now() + interval '60 days' + interval '5 hours',
      'An Evening of Opulence',
      'Black Tie',
      now() - interval '1 day',
      now() + interval '59 days',
      '{"refund": "All sales are final. No refunds.", "privacy": "Guest data is used solely for this event.", "terms": "By purchasing you agree to our terms of entry."}'::jsonb,
      '[]'::jsonb
    )
    returning id into v_event_id;

    insert into public.ticket_tiers (event_id, name, description, price_gbp, capacity, remaining, max_per_order, status)
    values
      (v_event_id, 'General Admission', 'Five-course dinner, live entertainment, dancing.', 95.00, 200, 200, 6, 'active'),
      (v_event_id, 'VIP Table', 'Premium table placement, champagne reception, priority service.', 175.00, 40, 40, 4, 'active');

    raise notice 'Sample event created with ID: %', v_event_id;
  else
    raise notice 'Events already exist — skipping seed.';
  end if;
end $$;
