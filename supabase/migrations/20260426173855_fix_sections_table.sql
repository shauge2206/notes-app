-- Drop any stale NOT NULL columns that might block inserts
alter table sections drop column if exists text;
alter table sections drop column if exists name;

-- Ensure correct defaults
alter table sections alter column title set default 'Untitled';
alter table sections alter column plain_text set default '';
alter table sections alter column position set default 0;
