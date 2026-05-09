-- Add guests_per_unit to ticket_tiers
-- This allows "bundle" tiers (Couples, Group of 10) to generate multiple tickets per purchased unit.
-- A Couples tier with guests_per_unit=2 and quantity=1 generates 2 individual tickets.
alter table public.ticket_tiers
  add column if not exists guests_per_unit integer not null default 1 check (guests_per_unit >= 1);
