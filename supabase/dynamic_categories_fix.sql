create extension if not exists pgcrypto;

create table if not exists public.dynamic_service_categories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  name text not null default '',
  slug text not null unique,
  description text,
  icon_url text,
  section_name text not null default 'More Services',
  status text not null default 'PUBLISHED',
  fields jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dynamic_service_posts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  category_slug text not null references public.dynamic_service_categories(slug) on delete cascade,
  payload jsonb not null default '{}',
  file_urls jsonb not null default '{}',
  latitude double precision,
  longitude double precision,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dynamic_service_categories_status_idx on public.dynamic_service_categories (status);
create index if not exists dynamic_service_categories_slug_idx on public.dynamic_service_categories (slug);
create index if not exists dynamic_service_posts_category_idx on public.dynamic_service_posts (category_slug);
create index if not exists dynamic_service_posts_owner_idx on public.dynamic_service_posts (owner_id);
create index if not exists dynamic_service_posts_status_idx on public.dynamic_service_posts (status);
create index if not exists dynamic_service_posts_created_idx on public.dynamic_service_posts (created_at desc);

alter table public.dynamic_service_categories enable row level security;
alter table public.dynamic_service_posts enable row level security;

drop policy if exists "Read published dynamic categories" on public.dynamic_service_categories;
create policy "Read published dynamic categories"
on public.dynamic_service_categories for select
using (status = 'PUBLISHED' or auth.uid() = owner_id);

drop policy if exists "Create own dynamic categories" on public.dynamic_service_categories;
create policy "Create own dynamic categories"
on public.dynamic_service_categories for insert
with check (auth.uid() = owner_id);

drop policy if exists "Update own dynamic categories" on public.dynamic_service_categories;
create policy "Update own dynamic categories"
on public.dynamic_service_categories for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Delete own dynamic categories" on public.dynamic_service_categories;
create policy "Delete own dynamic categories"
on public.dynamic_service_categories for delete
using (auth.uid() = owner_id);

drop policy if exists "Read active dynamic posts" on public.dynamic_service_posts;
create policy "Read active dynamic posts"
on public.dynamic_service_posts for select
using (status = 'ACTIVE' or auth.uid() = owner_id);

drop policy if exists "Create own dynamic posts" on public.dynamic_service_posts;
create policy "Create own dynamic posts"
on public.dynamic_service_posts for insert
with check (auth.uid() = owner_id);

drop policy if exists "Update own dynamic posts" on public.dynamic_service_posts;
create policy "Update own dynamic posts"
on public.dynamic_service_posts for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Delete own dynamic posts" on public.dynamic_service_posts;
create policy "Delete own dynamic posts"
on public.dynamic_service_posts for delete
using (auth.uid() = owner_id);

grant usage on schema public to anon, authenticated;
grant select on public.dynamic_service_categories, public.dynamic_service_posts to anon, authenticated;
grant insert, update, delete on public.dynamic_service_categories, public.dynamic_service_posts to authenticated;

select pg_notify('pgrst', 'reload schema');

select
  to_regclass('public.dynamic_service_categories') as dynamic_service_categories_table,
  to_regclass('public.dynamic_service_posts') as dynamic_service_posts_table;
