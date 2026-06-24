alter table if exists public.plans
add column if not exists summary text not null default '';
