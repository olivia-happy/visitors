alter table public.plans
add column if not exists weather_summary jsonb null;
