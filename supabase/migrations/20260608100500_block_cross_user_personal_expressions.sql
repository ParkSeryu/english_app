-- Keep personal-marker expressions owner-only even when their parent topic is shared.

create or replace function public.can_read_expression(auth_user_id uuid, expression_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  can_read boolean := false;
begin
  if auth_user_id is null or expression_id is null then
    return false;
  end if;

  select exists (
    select 1
    from public.expressions e
    join public.expression_days d on d.id = e.expression_day_id
    where e.id = $2
      and (
        e.user_memo is distinct from '__personal_expression__'
        or e.owner_id = $1
      )
      and public.can_read_content_folder($1, d.folder_id)
  ) into can_read;

  return can_read;
end;
$$;

do $$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'expressions'
      and policyname = 'expressions_select_authorized'
  ) then
    drop policy expressions_select_authorized on public.expressions;
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'expression_examples'
      and policyname = 'expression_examples_select_authorized_expression'
  ) then
    drop policy expression_examples_select_authorized_expression on public.expression_examples;
  end if;
end;
$$;

create policy "expressions_select_authorized" on public.expressions
for select
to authenticated
using (public.can_read_expression(auth.uid(), id));

create policy "expression_examples_select_authorized_expression" on public.expression_examples
for select
to authenticated
using (
  auth.uid() is not null
  and exists (
    select 1
    from public.expressions
    where expressions.id = expression_examples.expression_id
      and public.can_read_expression(auth.uid(), expressions.id)
  )
);

notify pgrst, 'reload schema';
