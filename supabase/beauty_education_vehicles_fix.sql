create extension if not exists pgcrypto;

create table if not exists public.beauty_wellness_services (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null default '',
  business_name text,
  mobile text not null default '',
  category text not null default '',
  additional_skills text[] not null default '{}',
  service_for text,
  home_service boolean not null default false,
  experience integer not null default 0,
  starting_price numeric,
  village text,
  district text,
  description text,
  image_url text,
  latitude double precision,
  longitude double precision,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.education_services (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null default '',
  business_name text,
  mobile text not null default '',
  category text not null default '',
  additional_skills text[] not null default '{}',
  teaching_mode text,
  student_level text,
  experience integer not null default 0,
  starting_price numeric,
  village text,
  district text,
  description text,
  image_url text,
  latitude double precision,
  longitude double precision,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transport_vehicles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null default '',
  mobile text not null default '',
  vehicle_type text,
  vehicle_number text,
  capacity text,
  capacity_unit text not null default 'Tons',
  material_types text[] not null default '{}',
  price numeric,
  pricing_type text not null default 'Per Trip',
  availability text not null default 'Available Now',
  village text,
  district text,
  state text,
  pincode text,
  facilities text[] not null default '{}',
  description text,
  image_url text,
  verified boolean not null default false,
  active boolean not null default true,
  latitude double precision,
  longitude double precision,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists beauty_wellness_services_status_idx on public.beauty_wellness_services (status);
create index if not exists beauty_wellness_services_owner_idx on public.beauty_wellness_services (owner_id);
create index if not exists beauty_wellness_services_category_idx on public.beauty_wellness_services (category);
create index if not exists beauty_wellness_services_skills_idx on public.beauty_wellness_services using gin (additional_skills);
create index if not exists beauty_wellness_services_created_idx on public.beauty_wellness_services (created_at desc);

create index if not exists education_services_status_idx on public.education_services (status);
create index if not exists education_services_owner_idx on public.education_services (owner_id);
create index if not exists education_services_category_idx on public.education_services (category);
create index if not exists education_services_skills_idx on public.education_services using gin (additional_skills);
create index if not exists education_services_created_idx on public.education_services (created_at desc);

create index if not exists transport_vehicles_status_idx on public.transport_vehicles (status);
create index if not exists transport_vehicles_owner_idx on public.transport_vehicles (owner_id);
create index if not exists transport_vehicles_type_idx on public.transport_vehicles (vehicle_type);
create index if not exists transport_vehicles_materials_idx on public.transport_vehicles using gin (material_types);
create index if not exists transport_vehicles_created_idx on public.transport_vehicles (created_at desc);

alter table public.beauty_wellness_services enable row level security;
alter table public.education_services enable row level security;
alter table public.transport_vehicles enable row level security;

drop policy if exists "Read active beauty wellness services" on public.beauty_wellness_services;
create policy "Read active beauty wellness services"
on public.beauty_wellness_services for select
using (status = 'ACTIVE' or auth.uid() = owner_id);

drop policy if exists "Create own beauty wellness services" on public.beauty_wellness_services;
create policy "Create own beauty wellness services"
on public.beauty_wellness_services for insert
with check (auth.uid() = owner_id);

drop policy if exists "Update own beauty wellness services" on public.beauty_wellness_services;
create policy "Update own beauty wellness services"
on public.beauty_wellness_services for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Delete own beauty wellness services" on public.beauty_wellness_services;
create policy "Delete own beauty wellness services"
on public.beauty_wellness_services for delete
using (auth.uid() = owner_id);

drop policy if exists "Read active education services" on public.education_services;
create policy "Read active education services"
on public.education_services for select
using (status = 'ACTIVE' or auth.uid() = owner_id);

drop policy if exists "Create own education services" on public.education_services;
create policy "Create own education services"
on public.education_services for insert
with check (auth.uid() = owner_id);

drop policy if exists "Update own education services" on public.education_services;
create policy "Update own education services"
on public.education_services for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Delete own education services" on public.education_services;
create policy "Delete own education services"
on public.education_services for delete
using (auth.uid() = owner_id);

drop policy if exists "Read active transport vehicles" on public.transport_vehicles;
create policy "Read active transport vehicles"
on public.transport_vehicles for select
using (status = 'ACTIVE' or auth.uid() = owner_id);

drop policy if exists "Create own transport vehicles" on public.transport_vehicles;
create policy "Create own transport vehicles"
on public.transport_vehicles for insert
with check (auth.uid() = owner_id);

drop policy if exists "Update own transport vehicles" on public.transport_vehicles;
create policy "Update own transport vehicles"
on public.transport_vehicles for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Delete own transport vehicles" on public.transport_vehicles;
create policy "Delete own transport vehicles"
on public.transport_vehicles for delete
using (auth.uid() = owner_id);

grant usage on schema public to anon, authenticated;
grant select on public.beauty_wellness_services, public.education_services, public.transport_vehicles to anon, authenticated;
grant insert, update, delete on public.beauty_wellness_services, public.education_services, public.transport_vehicles to authenticated;

select pg_notify('pgrst', 'reload schema');

select
  to_regclass('public.beauty_wellness_services') as beauty_wellness_services_table,
  to_regclass('public.education_services') as education_services_table,
  to_regclass('public.transport_vehicles') as transport_vehicles_table;
