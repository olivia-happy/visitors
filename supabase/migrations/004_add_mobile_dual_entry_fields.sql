alter table if exists public.plans
add column if not exists entry_mode text not null default 'quick',
add column if not exists travel_mode text null,
add column if not exists preference_tags jsonb not null default '[]'::jsonb,
add column if not exists parking_required boolean not null default false,
add column if not exists parking_sort text null,
add column if not exists max_walk_from_parking_minutes integer null,
add column if not exists execution_summary jsonb null,
add column if not exists reservation_risks jsonb not null default '[]'::jsonb,
add column if not exists parking_guides jsonb not null default '[]'::jsonb,
add column if not exists hotel_area_recommendations jsonb not null default '[]'::jsonb;
