create extension if not exists pgcrypto;

create table if not exists public.error_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  source text not null default '',
  action text not null default '',
  message text not null default '',
  error_name text,
  error_code text,
  status_code integer,
  url text,
  route text,
  user_agent text,
  stack text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists error_logs_user_id_idx on public.error_logs (user_id);
create index if not exists error_logs_source_idx on public.error_logs (source);
create index if not exists error_logs_created_at_idx on public.error_logs (created_at desc);

alter table public.error_logs enable row level security;

drop policy if exists "Create error logs" on public.error_logs;
create policy "Create error logs"
on public.error_logs for insert
with check (true);

drop policy if exists "Read own error logs" on public.error_logs;
create policy "Read own error logs"
on public.error_logs for select
using (auth.uid() = user_id);

select pg_notify('pgrst', 'reload schema');
select to_regclass('public.error_logs') as error_logs_table;
