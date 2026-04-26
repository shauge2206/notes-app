-- Tiles
create table if not exists tiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  type text not null default 'sections',
  color text not null default 'slate',
  size text not null default 'md',
  position int not null default 0,
  is_pinned boolean not null default false,
  is_archived boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table tiles enable row level security;
drop policy if exists "owner" on tiles;
create policy "owner" on tiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Sections
create table if not exists sections (
  id uuid primary key default gen_random_uuid(),
  tile_id uuid not null references tiles(id) on delete cascade,
  title text not null default 'Untitled',
  content jsonb,
  plain_text text not null default '',
  position int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table sections enable row level security;
drop policy if exists "owner" on sections;
create policy "owner" on sections for all
  using (exists (select 1 from tiles where tiles.id = sections.tile_id and tiles.user_id = auth.uid()))
  with check (exists (select 1 from tiles where tiles.id = sections.tile_id and tiles.user_id = auth.uid()));

-- Checklist items
create table if not exists checklist_items (
  id uuid primary key default gen_random_uuid(),
  tile_id uuid not null references tiles(id) on delete cascade,
  content text not null,
  is_completed boolean not null default false,
  position int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table checklist_items enable row level security;
drop policy if exists "owner" on checklist_items;
create policy "owner" on checklist_items for all
  using (exists (select 1 from tiles where tiles.id = checklist_items.tile_id and tiles.user_id = auth.uid()))
  with check (exists (select 1 from tiles where tiles.id = checklist_items.tile_id and tiles.user_id = auth.uid()));

-- Work sessions
create table if not exists work_sessions (
  id uuid primary key default gen_random_uuid(),
  tile_id uuid not null references tiles(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade not null,
  note text not null,
  created_at timestamptz default now()
);

alter table work_sessions enable row level security;
drop policy if exists "owner" on work_sessions;
create policy "owner" on work_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
