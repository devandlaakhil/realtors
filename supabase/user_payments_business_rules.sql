create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists about text,
  add column if not exists subscription_plan text not null default 'FREE',
  add column if not exists subscription_start_date timestamptz,
  add column if not exists subscription_end_date timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_subscription_plan_check'
  ) then
    alter table public.profiles
      add constraint profiles_subscription_plan_check
      check (subscription_plan in ('FREE', 'PROPERTY_PRO', 'SERVICE_PRO', 'BUSINESS_PRO'));
  end if;
end $$;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  userid uuid not null references auth.users(id) on delete cascade,
  owner_id uuid generated always as (userid) stored,
  plan text not null,
  amount numeric not null,
  currency text not null default 'INR',
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  status text not null default 'PENDING' check (status in ('PENDING', 'SUCCESS', 'FAILED')),
  payment_payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.payments (
  id,
  userid,
  plan,
  amount,
  currency,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  status,
  payment_payload,
  created_at,
  updated_at
)
select
  id,
  owner_id,
  plan,
  amount,
  currency,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  case
    when status in ('SUCCESS', 'PAID') then 'SUCCESS'
    when status in ('FAILED') then 'FAILED'
    else 'PENDING'
  end,
  payment_payload,
  created_at,
  updated_at
from public.subscription_payments
where owner_id is not null
on conflict (id) do nothing;

create index if not exists payments_userid_idx on public.payments (userid);
create index if not exists payments_status_idx on public.payments (status);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

alter table public.payments enable row level security;

drop policy if exists "Read own payments" on public.payments;
create policy "Read own payments"
on public.payments for select
using (auth.uid() = userid);

drop policy if exists "Create own payments" on public.payments;
create policy "Create own payments"
on public.payments for insert
with check (auth.uid() = userid);

drop policy if exists "Update own payments" on public.payments;
create policy "Update own payments"
on public.payments for update
using (auth.uid() = userid)
with check (auth.uid() = userid);

select pg_notify('pgrst', 'reload schema');
