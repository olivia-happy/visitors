create table if not exists public.plans (
  id uuid primary key,
  user_id uuid null,
  city text not null,
  days integer not null,
  budget_min integer null,
  budget_max integer null,
  transport_preferences jsonb not null default '[]'::jsonb,
  stay_preference text null,
  interest_tags jsonb not null default '[]'::jsonb,
  special_requirements text null,
  xiaohongshu_link text null,
  xiaohongshu_notes text null,
  output_language text not null default 'zh-CN',
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists public.plan_reservation_hints (
  id uuid primary key,
  plan_id uuid not null references public.plans(id) on delete cascade,
  poi_name text not null,
  reminder_text text not null,
  reservation_channel text null,
  price_note text null,
  source_url text not null,
  source_type text not null default 'xiaohongshu',
  confidence numeric(3,2) not null default 0.90,
  evidence_excerpt text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.plan_budget_items (
  id uuid primary key,
  plan_id uuid not null references public.plans(id) on delete cascade,
  category text not null,
  amount_low integer null,
  amount_high integer null,
  is_adjustable boolean not null default true
);

create table if not exists public.plan_checklist_items (
  id uuid primary key,
  plan_id uuid not null references public.plans(id) on delete cascade,
  category text not null,
  item_name text not null,
  reason text null
);

