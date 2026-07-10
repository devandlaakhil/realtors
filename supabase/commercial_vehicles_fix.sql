create extension if not exists pgcrypto;

create table if not exists public.commercial_vehicles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  owner_name text not null default '',
  mobile_number text not null default '',
  whatsapp_number text,
  vehicle_type text not null default 'Tractor',
  title text not null default '',
  brand text,
  model text,
  horse_power numeric,
  manufacturing_year integer,
  registration_number text,
  price_per_hour numeric,
  price_per_acre numeric,
  minimum_booking_hours numeric,
  address text,
  village text,
  mandal text,
  district text,
  state text,
  pincode text,
  includes_driver boolean not null default false,
  fuel_included boolean not null default false,
  rotavator_available boolean not null default false,
  cultivator_available boolean not null default false,
  trailer_available boolean not null default false,
  is_available boolean not null default true,
  available_from timestamptz,
  available_to timestamptz,
  description text,
  images text[] not null default '{}',
  latitude double precision,
  longitude double precision,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists commercial_vehicles_status_idx on public.commercial_vehicles (status);
create index if not exists commercial_vehicles_owner_idx on public.commercial_vehicles (owner_id);
create index if not exists commercial_vehicles_type_idx on public.commercial_vehicles (vehicle_type);
create index if not exists commercial_vehicles_location_idx on public.commercial_vehicles (latitude, longitude);
create index if not exists commercial_vehicles_created_idx on public.commercial_vehicles (created_at desc);

alter table public.commercial_vehicles enable row level security;

drop policy if exists "Read active commercial vehicles" on public.commercial_vehicles;
create policy "Read active commercial vehicles"
on public.commercial_vehicles for select
using (status = 'ACTIVE' or auth.uid() = owner_id);

drop policy if exists "Create own commercial vehicles" on public.commercial_vehicles;
create policy "Create own commercial vehicles"
on public.commercial_vehicles for insert
with check (auth.uid() = owner_id);

drop policy if exists "Update own commercial vehicles" on public.commercial_vehicles;
create policy "Update own commercial vehicles"
on public.commercial_vehicles for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Delete own commercial vehicles" on public.commercial_vehicles;
create policy "Delete own commercial vehicles"
on public.commercial_vehicles for delete
using (auth.uid() = owner_id);

grant usage on schema public to anon, authenticated;
grant select on public.commercial_vehicles to anon, authenticated;
grant insert, update, delete on public.commercial_vehicles to authenticated;

select pg_notify('pgrst', 'reload schema');

select to_regclass('public.commercial_vehicles') as commercial_vehicles_table;
