alter table public.plans enable row level security;
alter table public.plan_reservation_hints enable row level security;
alter table public.plan_budget_items enable row level security;
alter table public.plan_checklist_items enable row level security;

create policy "Users can read own plans"
on public.plans
for select
using (auth.uid() = user_id);

create policy "Users can create own plans"
on public.plans
for insert
with check (auth.uid() = user_id or user_id is null);

