-- Store topic titles without duplicated compact date suffixes.
-- UI can render the date from expression_days.day_date as needed.

update public.expression_days
set title = btrim(regexp_replace(title, '\s*\(' || to_char(day_date, 'YYMMDD') || '\)\s*$', '')),
    updated_at = now()
where day_date is not null
  and title ~ ('\s*\(' || to_char(day_date, 'YYMMDD') || '\)\s*$');

notify pgrst, 'reload schema';
