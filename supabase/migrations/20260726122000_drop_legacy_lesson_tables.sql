drop table if exists public.study_examples cascade;
drop table if exists public.study_items cascade;
drop table if exists public.lessons cascade;

notify pgrst, 'reload schema';
