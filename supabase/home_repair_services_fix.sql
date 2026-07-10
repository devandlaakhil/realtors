create extension if not exists pgcrypto;

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
  opening_time text,
  closing_time text,
  home_delivery boolean not null default false,
  description text,
  image_url text,
  latitude double precision,
  longitude double precision,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists home_repair_services_status_idx
on public.home_repair_services (status);

create index if not exists home_repair_services_owner_idx
on public.home_repair_services (owner_id);

create index if not exists home_repair_services_products_idx
on public.home_repair_services using gin (products);

create index if not exists home_repair_services_created_idx
on public.home_repair_services (created_at desc);

alter table public.home_repair_services enable row level security;

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

grant usage on schema public to anon, authenticated;
grant select on public.home_repair_services to anon, authenticated;
grant insert, update, delete on public.home_repair_services to authenticated;

select pg_notify('pgrst', 'reload schema');

select to_regclass('public.home_repair_services') as home_repair_services_table;
