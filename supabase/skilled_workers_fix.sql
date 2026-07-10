create extension if not exists pgcrypto;

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
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists skilled_workers_status_idx
on public.skilled_workers (status);

create index if not exists skilled_workers_owner_idx
on public.skilled_workers (owner_id);

create index if not exists skilled_workers_category_idx
on public.skilled_workers (category);

create index if not exists skilled_workers_skills_idx
on public.skilled_workers using gin (skills);

create index if not exists skilled_workers_created_idx
on public.skilled_workers (created_at desc);

alter table public.skilled_workers enable row level security;

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

grant usage on schema public to anon, authenticated;
grant select on public.skilled_workers to anon, authenticated;
grant insert, update, delete on public.skilled_workers to authenticated;

select pg_notify('pgrst', 'reload schema');

select to_regclass('public.skilled_workers') as skilled_workers_table;
