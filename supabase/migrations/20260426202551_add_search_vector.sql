-- Add tsvector column for full-text search on sections
alter table sections add column if not exists search_vector tsvector;

-- Populate from existing plain_text
update sections set search_vector = to_tsvector('norwegian', coalesce(title, '') || ' ' || coalesce(plain_text, ''));

-- Auto-update on insert/update
create or replace function sections_search_vector_trigger() returns trigger as $$
begin
  new.search_vector := to_tsvector('norwegian', coalesce(new.title, '') || ' ' || coalesce(new.plain_text, ''));
  return new;
end;
$$ language plpgsql;

drop trigger if exists sections_search_vector_update on sections;
create trigger sections_search_vector_update
  before insert or update of title, plain_text on sections
  for each row execute function sections_search_vector_trigger();

-- GIN index for fast search
create index if not exists sections_search_vector_idx on sections using gin(search_vector);
