-- Drop stale "text" column from checklist_items (we use "content" instead)
alter table checklist_items drop column if exists text;
