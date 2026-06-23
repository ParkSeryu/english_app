do $$
begin
  if to_regclass('public.app_schema_migrations') is not null then
    alter table public.app_schema_migrations enable row level security;
  end if;
end $$;
