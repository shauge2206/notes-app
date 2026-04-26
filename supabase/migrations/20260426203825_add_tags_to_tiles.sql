-- Add tags array column to tiles
alter table tiles add column if not exists tags text[] not null default '{}';

-- GIN index for fast tag filtering
create index if not exists tiles_tags_idx on tiles using gin(tags);
