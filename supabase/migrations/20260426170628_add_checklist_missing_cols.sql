-- Ensure checklist_items has all required columns with correct types
alter table checklist_items add column if not exists content text not null default '';
alter table checklist_items add column if not exists is_completed boolean not null default false;
alter table checklist_items add column if not exists updated_at timestamptz default now();

-- Ensure tile_id FK exists
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_name = 'checklist_items' and constraint_type = 'FOREIGN KEY'
  ) then
    alter table checklist_items add constraint checklist_items_tile_id_fkey
      foreign key (tile_id) references tiles(id) on delete cascade;
  end if;
end $$;
