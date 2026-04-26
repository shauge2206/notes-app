create or replace function get_user_tags(uid uuid)
returns table(tag text, count bigint)
language sql stable security definer
as $$
  select t.tag, count(*) as count
  from tiles, unnest(tags) as t(tag)
  where user_id = uid and is_archived = false
  group by t.tag
  order by count desc;
$$;
