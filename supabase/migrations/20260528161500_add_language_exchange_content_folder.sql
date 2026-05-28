-- Add the language exchange content folder as a reusable topic namespace.

insert into public.content_groups (slug, name)
values ('all_authenticated', '모든 인증 사용자')
on conflict (slug) do nothing;

with upserted_folder as (
  insert into public.content_folders (id, parent_id, name, slug, sort_order)
  values ('d741aadf-737e-4cec-93f1-ba7bf8f69253', null, '언어교환', 'language-exchange', 20)
  on conflict (slug) do update
    set name = excluded.name,
        parent_id = excluded.parent_id,
        sort_order = excluded.sort_order
  returning id
)
insert into public.content_folder_permissions (folder_id, group_id, permission)
select upserted_folder.id, content_groups.id, 'read'
from upserted_folder
join public.content_groups on content_groups.slug = 'all_authenticated'
on conflict (folder_id, group_id, permission) do nothing;

notify pgrst, 'reload schema';
