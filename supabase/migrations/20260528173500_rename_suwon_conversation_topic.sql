-- Rename Suwon English meetup conversation topics to their exact class name.

update public.expression_days d
set title = '회화연습반',
    updated_at = now()
from public.content_folders f
where d.folder_id = f.id
  and f.slug = 'suwon-english-meetup'
  and d.title = '회화반';

notify pgrst, 'reload schema';
