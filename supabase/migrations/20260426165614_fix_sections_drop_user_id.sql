-- Drop ALL existing policies on sections and checklist_items
do $$
declare
  pol record;
begin
  for pol in select policyname from pg_policies where tablename = 'sections' loop
    execute format('drop policy if exists %I on sections', pol.policyname);
  end loop;
  for pol in select policyname from pg_policies where tablename = 'checklist_items' loop
    execute format('drop policy if exists %I on checklist_items', pol.policyname);
  end loop;
end $$;

-- Drop user_id columns (access is via tile RLS)
alter table sections drop column if exists user_id;
alter table checklist_items drop column if exists user_id;

-- Recreate proper RLS policies via tile ownership
create policy "owner" on sections for all
  using (exists (select 1 from tiles where tiles.id = sections.tile_id and tiles.user_id = auth.uid()))
  with check (exists (select 1 from tiles where tiles.id = sections.tile_id and tiles.user_id = auth.uid()));

create policy "owner" on checklist_items for all
  using (exists (select 1 from tiles where tiles.id = checklist_items.tile_id and tiles.user_id = auth.uid()))
  with check (exists (select 1 from tiles where tiles.id = checklist_items.tile_id and tiles.user_id = auth.uid()));
