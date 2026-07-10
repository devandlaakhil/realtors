create extension if not exists pgcrypto;

create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null default '',
  mobile text not null default '',
  whatsapp_number text,
  vehicle_types text[] not null default '{}',
  licence_type text,
  licence_number text,
  experience integer not null default 0,
  price_per_day numeric,
  price_per_trip numeric,
  available_for_outstation boolean not null default false,
  available_at_night boolean not null default false,
  has_own_vehicle boolean not null default false,
  village text,
  district text,
  state text,
  languages text,
  description text,
  image_url text,
  latitude double precision,
  longitude double precision,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists drivers_status_idx on public.drivers (status);
create index if not exists drivers_owner_idx on public.drivers (owner_id);
create index if not exists drivers_vehicle_types_idx on public.drivers using gin (vehicle_types);
create index if not exists drivers_location_idx on public.drivers (latitude, longitude);
create index if not exists drivers_created_idx on public.drivers (created_at desc);

alter table public.drivers enable row level security;

drop policy if exists "Read active drivers" on public.drivers;
create policy "Read active drivers"
on public.drivers for select
using (status = 'ACTIVE' or auth.uid() = owner_id);

drop policy if exists "Create own drivers" on public.drivers;
create policy "Create own drivers"
on public.drivers for insert
with check (auth.uid() = owner_id);

drop policy if exists "Update own drivers" on public.drivers;
create policy "Update own drivers"
on public.drivers for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Delete own drivers" on public.drivers;
create policy "Delete own drivers"
on public.drivers for delete
using (auth.uid() = owner_id);

grant usage on schema public to anon, authenticated;
grant select on public.drivers to anon, authenticated;
grant insert, update, delete on public.drivers to authenticated;

select pg_notify('pgrst', 'reload schema');

select to_regclass('public.drivers') as drivers_table;
