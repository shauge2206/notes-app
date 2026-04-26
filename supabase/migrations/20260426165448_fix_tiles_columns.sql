-- Add missing columns to tiles (IF NOT EXISTS doesn't add columns to existing tables)
alter table tiles add column if not exists title text not null default '';
alter table tiles add column if not exists type text not null default 'sections';
alter table tiles add column if not exists color text not null default 'slate';
alter table tiles add column if not exists size text not null default 'md';
alter table tiles add column if not exists position int not null default 0;
alter table tiles add column if not exists is_pinned boolean not null default false;
alter table tiles add column if not exists is_archived boolean not null default false;
alter table tiles add column if not exists created_at timestamptz default now();
alter table tiles add column if not exists updated_at timestamptz default now();

-- Ensure sections columns exist
alter table sections add column if not exists title text not null default 'Untitled';
alter table sections add column if not exists content jsonb;
alter table sections add column if not exists plain_text text not null default '';
alter table sections add column if not exists position int not null default 0;
alter table sections add column if not exists created_at timestamptz default now();
alter table sections add column if not exists updated_at timestamptz default now();

-- Ensure checklist_items columns exist
alter table checklist_items add column if not exists content text not null default '';
alter table checklist_items add column if not exists is_completed boolean not null default false;
alter table checklist_items add column if not exists position int not null default 0;
alter table checklist_items add column if not exists created_at timestamptz default now();
alter table checklist_items add column if not exists updated_at timestamptz default now();

-- Ensure work_sessions columns exist
alter table work_sessions add column if not exists note text not null default '';
alter table work_sessions add column if not exists created_at timestamptz default now();
