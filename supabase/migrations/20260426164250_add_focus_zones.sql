-- Focus Zones table
create table if not exists focus_zones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text not null default 'slate',
  position int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table focus_zones enable row level security;
drop policy if exists "owner" on focus_zones;
create policy "owner" on focus_zones for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Add zone_id to tiles
alter table tiles add column if not exists zone_id uuid references focus_zones(id) on delete set null;
