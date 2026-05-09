create extension if not exists "pgcrypto";

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null check (status in ('draft', 'published', 'archived')) default 'draft',
  summary text not null,
  description text not null,
  venue_name text not null,
  venue_address text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  hero_label text not null,
  dress_code text not null,
  sales_start_at timestamptz not null,
  sales_end_at timestamptz not null,
  policies jsonb not null default '{}'::jsonb,
  gallery jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ticket_tiers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  description text not null,
  price_gbp numeric(10,2) not null,
  capacity integer not null check (capacity >= 0),
  remaining integer not null check (remaining >= 0),
  max_per_order integer not null default 6,
  status text not null check (status in ('active', 'sold_out', 'hidden')) default 'active',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  stripe_checkout_session_id text unique not null,
  stripe_payment_intent_id text,
  buyer_name text not null,
  buyer_email text not null,
  buyer_phone text not null,
  total_pence integer not null,
  currency text not null default 'GBP',
  status text not null check (status in ('pending', 'paid', 'failed', 'refunded')) default 'pending',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  ticket_tier_id uuid not null references public.ticket_tiers(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  unit_price_pence integer not null
);

create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  guest_index integer not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.guests(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  ticket_tier_id uuid not null references public.ticket_tiers(id) on delete cascade,
  public_id text not null unique,
  qr_payload text not null,
  pdf_path text,
  status text not null check (status in ('issued', 'used', 'void')) default 'issued',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.webhook_events (
  stripe_event_id text primary key,
  type text not null,
  status text not null,
  processed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.admin_profiles (
  id uuid primary key default gen_random_uuid(),
  supabase_user_id uuid not null unique,
  display_name text not null,
  role text not null check (role in ('owner', 'staff')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.email_deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null,
  status text not null,
  recipient_email text not null,
  provider_message_id text,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.reserve_ticket_inventory(target_tier_id uuid, requested_qty integer)
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
      status = case
        when remaining - requested_qty <= 0 then 'sold_out'
        else status
      end
  where id = target_tier_id
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

alter table public.events enable row level security;
alter table public.ticket_tiers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.guests enable row level security;
alter table public.tickets enable row level security;
alter table public.webhook_events enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.email_deliveries enable row level security;

drop policy if exists "public events visible" on public.events;
create policy "public events visible"
on public.events
for select
to anon, authenticated
using (status = 'published');

drop policy if exists "public ticket tiers visible" on public.ticket_tiers;
create policy "public ticket tiers visible"
on public.ticket_tiers
for select
to anon, authenticated
using (status = 'active');

drop policy if exists "admin profile self read" on public.admin_profiles;
create policy "admin profile self read"
on public.admin_profiles
for select
to authenticated
using (auth.uid() = supabase_user_id);

insert into public.events (
  id,
  name,
  slug,
  status,
  summary,
  description,
  venue_name,
  venue_address,
  starts_at,
  ends_at,
  hero_label,
  dress_code,
  sales_start_at,
  sales_end_at,
  policies,
  gallery
)
values (
  'ad40d369-f379-4f2a-a19f-41c5fe7d1f72',
  'Winter Masquerade Ball',
  'winter-masquerade-ball',
  'published',
  'Winter masquerade glamour with cocktail reception, live sax, DJs, red carpet, and bottomless drinks.',
  'J&A Opulence Events proudly presents the Winter Masquerade Ball, featuring DJ KK and a surprise DJ, cocktail reception, live sax, red carpet moments, live entertainment, bottomless drinks, and best masquerade awards for male and female guests. Super early bird pricing runs from April to June.',
  'Venue to be announced',
  'Full venue details will be released to guests soon.',
  '2099-12-31T20:00:00+00',
  '2099-12-31T23:59:00+00',
  'Super Early Bird • April - June',
  'Masquerade ball eveningwear.',
  '2026-04-01T00:00:00+00',
  '2026-06-30T23:00:00+00',
  jsonb_build_object(
    'refund', 'Tickets are non-refundable unless the event is cancelled by the organiser.',
    'privacy', 'Guest information is used only for ticket delivery, event operations, and approved customer communication.',
    'terms', 'Ticket holders must present valid QR tickets at entry. Event management reserves the right to refuse entry for policy breaches.'
  ),
  jsonb_build_array(
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80'
  )
)
on conflict (slug) do nothing;

insert into public.ticket_tiers (
  event_id,
  name,
  description,
  price_gbp,
  capacity,
  remaining,
  max_per_order,
  status
)
values
  (
    'ad40d369-f379-4f2a-a19f-41c5fe7d1f72',
    'Standard Single',
    'Super early bird standard entry for one guest.',
    75.00,
    120,
    120,
    6,
    'active'
  ),
  (
    'ad40d369-f379-4f2a-a19f-41c5fe7d1f72',
    'Standard Couples',
    'Super early bird standard entry for two guests.',
    145.00,
    60,
    60,
    4,
    'active'
  ),
  (
    'ad40d369-f379-4f2a-a19f-41c5fe7d1f72',
    'Standard Group of 10',
    'Super early bird group booking for ten guests.',
    700.00,
    12,
    12,
    1,
    'active'
  ),
  (
    'ad40d369-f379-4f2a-a19f-41c5fe7d1f72',
    'VIP Experience Single',
    'VIP seated service plus a 3-course plated dinner for one guest.',
    90.00,
    80,
    80,
    6,
    'active'
  ),
  (
    'ad40d369-f379-4f2a-a19f-41c5fe7d1f72',
    'VIP Experience Couples',
    'VIP seated service plus a 3-course plated dinner for two guests.',
    170.00,
    40,
    40,
    4,
    'active'
  ),
  (
    'ad40d369-f379-4f2a-a19f-41c5fe7d1f72',
    'VIP Experience Group of 10',
    'VIP group booking with seated service and 3-course plated dinner.',
    899.00,
    10,
    10,
    1,
    'active'
  )
on conflict do nothing;
