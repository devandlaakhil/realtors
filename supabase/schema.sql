create extension if not exists pgcrypto;

create table if not exists public.service_posts (
  id uuid primary key default gen_random_uuid(),
  service_type text not null,
  owner_id uuid,
  title text,
  category text,
  price numeric,
  unit text,
  mobile text,
  location_text text,
  village text,
  district text,
  latitude double precision,
  longitude double precision,
  images text[] not null default '{}',
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null default '',
  mobile text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_calls (
  id uuid primary key default gen_random_uuid(),
  service_post_id uuid references public.service_posts(id) on delete cascade,
  caller_id uuid,
  caller_mobile text,
  created_at timestamptz not null default now()
);

create table if not exists public.home_repair_services (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  shop_name text not null default '',
  owner_name text not null default '',
  mobile text not null default '',
  address text not null default '',
  village text,
  district text,
  products text[] not null default '{}',
  opening_time text not null default '08:00',
  closing_time text not null default '20:00',
  home_delivery boolean not null default false,
  description text,
  image_url text,
  latitude double precision,
  longitude double precision,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.skilled_workers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null default '',
  category text not null default '',
  mobile text not null default '',
  price numeric,
  village text,
  district text,
  experience integer not null default 0,
  is_active boolean not null default true,
  team_size integer not null default 0,
  skills text[] not null default '{}',
  cleaning_category text,
  role text,
  image_url text,
  latitude double precision,
  longitude double precision,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
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
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
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
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists service_posts_type_status_idx on public.service_posts (service_type, status);
create index if not exists service_posts_type_category_idx on public.service_posts (service_type, category);
create index if not exists service_posts_owner_idx on public.service_posts (owner_id);
create index if not exists service_posts_created_idx on public.service_posts (created_at desc);
create index if not exists service_posts_location_idx on public.service_posts (latitude, longitude);
create index if not exists profiles_mobile_idx on public.profiles (mobile);
create index if not exists home_repair_services_status_idx on public.home_repair_services (status);
create index if not exists home_repair_services_owner_idx on public.home_repair_services (owner_id);
create index if not exists home_repair_services_products_idx on public.home_repair_services using gin (products);
create index if not exists home_repair_services_location_idx on public.home_repair_services (latitude, longitude);
create index if not exists home_repair_services_created_idx on public.home_repair_services (created_at desc);
create index if not exists skilled_workers_status_idx on public.skilled_workers (status);
create index if not exists skilled_workers_owner_idx on public.skilled_workers (owner_id);
create index if not exists skilled_workers_category_idx on public.skilled_workers (category);
create index if not exists skilled_workers_skills_idx on public.skilled_workers using gin (skills);
create index if not exists skilled_workers_location_idx on public.skilled_workers (latitude, longitude);
create index if not exists skilled_workers_created_idx on public.skilled_workers (created_at desc);
create index if not exists beauty_wellness_services_status_idx on public.beauty_wellness_services (status);
create index if not exists beauty_wellness_services_owner_idx on public.beauty_wellness_services (owner_id);
create index if not exists beauty_wellness_services_category_idx on public.beauty_wellness_services (category);
create index if not exists beauty_wellness_services_skills_idx on public.beauty_wellness_services using gin (additional_skills);
create index if not exists beauty_wellness_services_location_idx on public.beauty_wellness_services (latitude, longitude);
create index if not exists beauty_wellness_services_created_idx on public.beauty_wellness_services (created_at desc);
create index if not exists education_services_status_idx on public.education_services (status);
create index if not exists education_services_owner_idx on public.education_services (owner_id);
create index if not exists education_services_category_idx on public.education_services (category);
create index if not exists education_services_skills_idx on public.education_services using gin (additional_skills);
create index if not exists education_services_location_idx on public.education_services (latitude, longitude);
create index if not exists education_services_created_idx on public.education_services (created_at desc);
create index if not exists transport_vehicles_status_idx on public.transport_vehicles (status);
create index if not exists transport_vehicles_owner_idx on public.transport_vehicles (owner_id);
create index if not exists transport_vehicles_type_idx on public.transport_vehicles (vehicle_type);
create index if not exists transport_vehicles_materials_idx on public.transport_vehicles using gin (material_types);
create index if not exists transport_vehicles_location_idx on public.transport_vehicles (latitude, longitude);
create index if not exists transport_vehicles_created_idx on public.transport_vehicles (created_at desc);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists service_posts_set_updated_at on public.service_posts;
create trigger service_posts_set_updated_at
before update on public.service_posts
for each row execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists home_repair_services_set_updated_at on public.home_repair_services;
create trigger home_repair_services_set_updated_at
before update on public.home_repair_services
for each row execute function public.set_updated_at();

drop trigger if exists skilled_workers_set_updated_at on public.skilled_workers;
create trigger skilled_workers_set_updated_at
before update on public.skilled_workers
for each row execute function public.set_updated_at();

drop trigger if exists beauty_wellness_services_set_updated_at on public.beauty_wellness_services;
create trigger beauty_wellness_services_set_updated_at
before update on public.beauty_wellness_services
for each row execute function public.set_updated_at();

drop trigger if exists education_services_set_updated_at on public.education_services;
create trigger education_services_set_updated_at
before update on public.education_services
for each row execute function public.set_updated_at();

drop trigger if exists transport_vehicles_set_updated_at on public.transport_vehicles;
create trigger transport_vehicles_set_updated_at
before update on public.transport_vehicles
for each row execute function public.set_updated_at();

alter table public.service_posts enable row level security;
alter table public.service_calls enable row level security;
alter table public.profiles enable row level security;
alter table public.home_repair_services enable row level security;
alter table public.skilled_workers enable row level security;
alter table public.beauty_wellness_services enable row level security;
alter table public.education_services enable row level security;
alter table public.transport_vehicles enable row level security;

drop policy if exists "Read own profile" on public.profiles;
create policy "Read own profile"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "Create own profile" on public.profiles;
create policy "Create own profile"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "Update own profile" on public.profiles;
create policy "Update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Read active service posts" on public.service_posts;
create policy "Read active service posts"
on public.service_posts for select
using (status = 'ACTIVE' or auth.uid() = owner_id);

drop policy if exists "Create own service posts" on public.service_posts;
create policy "Create own service posts"
on public.service_posts for insert
with check (auth.uid() = owner_id);

drop policy if exists "Update own service posts" on public.service_posts;
create policy "Update own service posts"
on public.service_posts for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Delete own service posts" on public.service_posts;
create policy "Delete own service posts"
on public.service_posts for delete
using (auth.uid() = owner_id);

drop policy if exists "Read active home repair services" on public.home_repair_services;
create policy "Read active home repair services"
on public.home_repair_services for select
using (status = 'ACTIVE' or auth.uid() = owner_id);

drop policy if exists "Create own home repair services" on public.home_repair_services;
create policy "Create own home repair services"
on public.home_repair_services for insert
with check (auth.uid() = owner_id);

drop policy if exists "Update own home repair services" on public.home_repair_services;
create policy "Update own home repair services"
on public.home_repair_services for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Delete own home repair services" on public.home_repair_services;
create policy "Delete own home repair services"
on public.home_repair_services for delete
using (auth.uid() = owner_id);

drop policy if exists "Read active skilled workers" on public.skilled_workers;
create policy "Read active skilled workers"
on public.skilled_workers for select
using (status = 'ACTIVE' or auth.uid() = owner_id);

drop policy if exists "Create own skilled workers" on public.skilled_workers;
create policy "Create own skilled workers"
on public.skilled_workers for insert
with check (auth.uid() = owner_id);

drop policy if exists "Update own skilled workers" on public.skilled_workers;
create policy "Update own skilled workers"
on public.skilled_workers for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Delete own skilled workers" on public.skilled_workers;
create policy "Delete own skilled workers"
on public.skilled_workers for delete
using (auth.uid() = owner_id);

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

insert into storage.buckets (id, name, public)
values ('service-images', 'service-images', true)
on conflict (id) do nothing;

drop policy if exists "Public read service images" on storage.objects;
create policy "Public read service images"
on storage.objects for select
using (bucket_id = 'service-images');

drop policy if exists "Authenticated upload service images" on storage.objects;
create policy "Authenticated upload service images"
on storage.objects for insert
with check (bucket_id = 'service-images' and auth.role() = 'authenticated');

drop policy if exists "Authenticated update service images" on storage.objects;
create policy "Authenticated update service images"
on storage.objects for update
using (bucket_id = 'service-images' and auth.role() = 'authenticated');
