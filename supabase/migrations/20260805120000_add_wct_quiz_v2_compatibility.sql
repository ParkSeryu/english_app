-- Standard sync, Pop start, and standard submit serialize on the signed bigint
-- hashtextextended(owner_uuid::text || ':' || book_uuid::text, 0).
create or replace function public.sync_wct_standard_quiz_sets(
  p_owner_id uuid,
  p_books jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_book jsonb;
  v_set jsonb;
  v_questions jsonb;
  v_existing public.wct_quiz_sets%rowtype;
  v_book_id uuid;
  v_existing_book_id uuid;
  v_source_id uuid;
  v_book_title text;
  v_expected_lesson_key text;
  v_day_count integer;
  v_question_count integer;
  v_multiple_choice_count integer;
  v_fill_blank_count integer;
  v_true_false_count integer;
  v_translation_count integer;
  v_pattern_count integer;
  v_created_count integer := 0;
  v_updated_count integer := 0;
  v_unchanged_count integer := 0;
  v_reset_quiz_progress_count integer := 0;
  v_reset_pop_progress_count integer := 0;
  v_deleted_count integer;
  v_existing_id uuid;
  v_changed_id uuid;
  v_book_changed boolean;
begin
  if p_owner_id is null
    or p_books is null
    or jsonb_typeof(p_books) is distinct from 'array' then
    raise exception 'WCT standard quiz synchronization requires 1 to 100 books';
  end if;
  if jsonb_array_length(p_books) not between 1 and 100 then
    raise exception 'WCT standard quiz synchronization requires 1 to 100 books';
  end if;

  -- Only shape and UUID parseability are checked before taking every lock.
  if exists (
    select 1
    from jsonb_array_elements(p_books) entry(book)
    where jsonb_typeof(book) is distinct from 'object'
      or jsonb_typeof(book->'bookId') is distinct from 'string'
      or nullif(book->>'bookId', '') is null
  ) then
    raise exception 'WCT standard quiz synchronization has an invalid book';
  end if;

  -- Sorted, unique acquisition prevents multi-book batches from deadlocking.
  for v_book_id in
    select distinct (book->>'bookId')::uuid
    from jsonb_array_elements(p_books) entry(book)
    order by (book->>'bookId')::uuid
  loop
    perform pg_advisory_xact_lock(
      hashtextextended(p_owner_id::text || ':' || v_book_id::text, 0)
    );
  end loop;

  if (
    select count(*) <> count(distinct book->>'bookId')
    from jsonb_array_elements(p_books) entry(book)
  ) then
    raise exception 'WCT standard quiz synchronization has duplicate books';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_books) entry(book)
    where not (book ? 'bookId' and book ? 'sets')
      or (select count(*) from jsonb_object_keys(book)) <> 2
      or jsonb_typeof(book->'sets') is distinct from 'array'
  ) then
    raise exception 'WCT standard quiz synchronization requires complete book sets';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_books) entry(book)
    where jsonb_array_length(book->'sets') < 1
  ) then
    raise exception 'WCT standard quiz synchronization requires complete book sets';
  end if;

  if (
    select count(*) <> count(distinct quiz_set->>'lessonKey')
      or count(*) <> count(distinct quiz_set->>'sourceId')
    from jsonb_array_elements(p_books) entry(book)
    cross join lateral jsonb_array_elements(book->'sets') sets(quiz_set)
  ) then
    raise exception 'WCT standard quiz synchronization has duplicate set identity';
  end if;

  -- Validate the entire batch, including immutable collisions, before mutation.
  for v_book in
    select book
    from jsonb_array_elements(p_books) entry(book)
  loop
    v_book_id := (v_book->>'bookId')::uuid;
    select title
    into v_book_title
    from public.wct_books
    where id = v_book_id
      and owner_id = p_owner_id;
    if not found then
      raise exception 'WCT book does not belong to WCT quiz owner';
    end if;

    select count(*)::integer
    into v_day_count
    from public.wct_days
    where book_id = v_book_id;
    if v_day_count < 1
      or jsonb_array_length(v_book->'sets') <> v_day_count then
      raise exception 'WCT standard quiz synchronization requires exact Day coverage';
    end if;

    if exists (
      select 1
      from public.wct_days day
      where day.book_id = v_book_id
        and not exists (
          select 1
          from jsonb_array_elements(v_book->'sets') sets(quiz_set)
          where quiz_set->>'sourceId' = day.id::text
        )
    ) then
      raise exception 'WCT standard quiz synchronization requires exact Day coverage';
    end if;

    for v_set in
      select quiz_set
      from jsonb_array_elements(v_book->'sets') sets(quiz_set)
    loop
      if jsonb_typeof(v_set) is distinct from 'object'
        or not (
          v_set ? 'lessonKey'
          and v_set ? 'sourceKind'
          and v_set ? 'sourceId'
          and v_set ? 'generatorVersion'
          and v_set ? 'sourceHash'
          and v_set ? 'questions'
        )
        or (select count(*) from jsonb_object_keys(v_set)) <> 6
        or jsonb_typeof(v_set->'lessonKey') is distinct from 'string'
        or jsonb_typeof(v_set->'sourceKind') is distinct from 'string'
        or jsonb_typeof(v_set->'sourceId') is distinct from 'string'
        or jsonb_typeof(v_set->'generatorVersion') is distinct from 'string'
        or jsonb_typeof(v_set->'sourceHash') is distinct from 'string'
        or nullif(btrim(v_set->>'lessonKey'), '') is null
        or length(btrim(v_set->>'lessonKey')) > 240
        or v_set->>'sourceKind' is distinct from 'wct_day'
        or nullif(v_set->>'sourceId', '') is null
        or v_set->>'generatorVersion' is distinct from 'wct-review-v2'
        or coalesce(v_set->>'sourceHash', '') !~ '^[0-9a-f]{64}$'
        or jsonb_typeof(v_set->'questions') is distinct from 'array' then
        raise exception 'WCT standard quiz synchronization has an invalid WCT standard quiz set';
      end if;

      v_source_id := (v_set->>'sourceId')::uuid;
      select 'wct-book:'
        || regexp_replace(
          regexp_replace(
            regexp_replace(lower(btrim(v_book_title)), '[[:space:]]+', ' ', 'g'),
            '[^a-z0-9가-힣]+',
            '-',
            'g'
          ),
          '^-+|-+$',
          '',
          'g'
        )
        || ':day:' || day.day_number::text
      into v_expected_lesson_key
      from public.wct_days day
      where day.id = v_source_id
        and day.book_id = v_book_id;
      if not found
        or v_set->>'lessonKey' is distinct from v_expected_lesson_key then
        raise exception 'WCT standard quiz synchronization has wrong lesson or Day identity';
      end if;

      v_questions := v_set->'questions';
      if jsonb_array_length(v_questions) <> 5 then
        raise exception 'WCT standard quiz synchronization has an invalid WCT standard quiz set';
      end if;

      if exists (
        select 1
        from jsonb_array_elements(v_questions) question
        where jsonb_typeof(question) is distinct from 'object'
          or not (
            question ? 'id'
            and question ? 'kind'
            and question ? 'format'
            and question ? 'prompt'
            and question ? 'choices'
            and question ? 'correctChoiceId'
            and question ? 'explanation'
            and question ? 'feedback'
          )
          or (select count(*) from jsonb_object_keys(question)) <> 8
          or jsonb_typeof(question->'id') is distinct from 'string'
          or jsonb_typeof(question->'kind') is distinct from 'string'
          or jsonb_typeof(question->'format') is distinct from 'string'
          or jsonb_typeof(question->'prompt') is distinct from 'string'
          or jsonb_typeof(question->'correctChoiceId') is distinct from 'string'
          or jsonb_typeof(question->'explanation') is distinct from 'string'
          or nullif(btrim(question->>'id'), '') is null
          or length(question->>'id') > 160
          or nullif(btrim(question->>'prompt'), '') is null
          or length(btrim(question->>'prompt')) > 2000
          or nullif(btrim(question->>'explanation'), '') is null
          or length(btrim(question->>'explanation')) > 2000
          or question->>'kind' not in ('translation', 'pattern')
          or question->>'format' not in (
            'multiple_choice', 'fill_blank', 'true_false'
          )
          or jsonb_typeof(question->'choices') is distinct from 'array'
          or jsonb_typeof(question->'feedback') is distinct from 'object'
      ) then
        raise exception 'WCT standard quiz synchronization has an invalid WCT standard quiz set';
      end if;

      if exists (
        select 1
        from jsonb_array_elements(v_questions) question
        where (select count(*) from jsonb_object_keys(question->'feedback')) <> 3
          or not (
            question->'feedback' ? 'correctSentence'
            and question->'feedback' ? 'pattern'
            and question->'feedback' ? 'reason'
          )
          or jsonb_typeof(question->'feedback'->'correctSentence')
            is distinct from 'string'
          or jsonb_typeof(question->'feedback'->'pattern')
            is distinct from 'string'
          or jsonb_typeof(question->'feedback'->'reason')
            is distinct from 'string'
          or nullif(btrim(question->'feedback'->>'correctSentence'), '') is null
          or length(btrim(question->'feedback'->>'correctSentence')) > 2000
          or nullif(btrim(question->'feedback'->>'pattern'), '') is null
          or length(btrim(question->'feedback'->>'pattern')) > 2000
          or nullif(btrim(question->'feedback'->>'reason'), '') is null
          or length(btrim(question->'feedback'->>'reason')) > 2000
          or jsonb_array_length(question->'choices')
            <> case when question->>'format' = 'true_false' then 2 else 4 end
      ) then
        raise exception 'WCT standard quiz synchronization has invalid choices or feedback';
      end if;

      if exists (
        select 1
        from jsonb_array_elements(v_questions) question
        cross join lateral jsonb_array_elements(question->'choices') choice
        where jsonb_typeof(choice) is distinct from 'object'
          or not (choice ? 'id' and choice ? 'text')
          or (select count(*) from jsonb_object_keys(choice)) <> 2
          or jsonb_typeof(choice->'id') is distinct from 'string'
          or jsonb_typeof(choice->'text') is distinct from 'string'
          or nullif(btrim(choice->>'id'), '') is null
          or length(choice->>'id') > 160
          or nullif(btrim(choice->>'text'), '') is null
          or length(btrim(choice->>'text')) > 2000
      ) then
        raise exception 'WCT standard quiz synchronization has invalid choices or feedback';
      end if;

      if exists (
        select 1
        from jsonb_array_elements(v_questions) question
        where (
          select count(*) <> count(distinct choice->>'id')
            or count(*) <> count(distinct lower(btrim(choice->>'text')))
          from jsonb_array_elements(question->'choices') choice
        )
          or not exists (
            select 1
            from jsonb_array_elements(question->'choices') choice
            where choice->>'id' = question->>'correctChoiceId'
          )
      ) then
        raise exception 'WCT standard quiz synchronization has invalid choices or feedback';
      end if;

      select
        count(*)::integer,
        count(*) filter (where question->>'format' = 'multiple_choice')::integer,
        count(*) filter (where question->>'format' = 'fill_blank')::integer,
        count(*) filter (where question->>'format' = 'true_false')::integer,
        count(*) filter (where question->>'kind' = 'translation')::integer,
        count(*) filter (where question->>'kind' = 'pattern')::integer
      into
        v_question_count,
        v_multiple_choice_count,
        v_fill_blank_count,
        v_true_false_count,
        v_translation_count,
        v_pattern_count
      from jsonb_array_elements(v_questions) question;

      if v_question_count <> 5
        or v_multiple_choice_count <> 2
        or v_fill_blank_count <> 2
        or v_true_false_count <> 1
        or v_translation_count <> 3
        or v_pattern_count <> 2
        or (
          select count(distinct question->>'id') <> 5
            or count(distinct lower(btrim(question->>'prompt'))) <> 5
          from jsonb_array_elements(v_questions) question
        )
        or exists (
          select 1
          from (
            select
              question->>'format' as format,
              lag(question->>'format') over (order by position) as prior_format
            from jsonb_array_elements(v_questions)
              with ordinality source(question, position)
          ) ordered
          where format = prior_format
        ) then
        raise exception 'WCT standard quiz synchronization has an invalid v2 format or kind mix';
      end if;

      if (
        select count(*)
        from public.wct_quiz_sets quiz
        where quiz.owner_id = p_owner_id
          and (
            quiz.lesson_key = v_set->>'lessonKey'
            or quiz.source_id = v_set->>'sourceId'
          )
      ) > 1 then
        raise exception 'WCT quiz generator/version integrity collision';
      end if;

      select quiz.*
      into v_existing
      from public.wct_quiz_sets quiz
      where quiz.owner_id = p_owner_id
        and (
          quiz.lesson_key = v_set->>'lessonKey'
          or quiz.source_id = v_set->>'sourceId'
        )
      limit 1;
      if found then
        select day.book_id
        into v_existing_book_id
        from public.wct_days day
        where day.id::text = v_existing.source_id;
        if v_existing.lesson_key is distinct from v_set->>'lessonKey'
          or v_existing.source_kind is distinct from v_set->>'sourceKind'
          or v_existing.source_id is distinct from v_set->>'sourceId'
          or v_existing_book_id is distinct from v_book_id
          or (
            v_existing.generator_version = v_set->>'generatorVersion'
            and v_existing.source_hash = v_set->>'sourceHash'
            and v_existing.questions is distinct from v_questions
          ) then
          raise exception 'WCT quiz generator/version integrity collision';
        end if;
      end if;
    end loop;
  end loop;

  for v_book in
    select book
    from jsonb_array_elements(p_books) entry(book)
  loop
    v_book_id := (v_book->>'bookId')::uuid;
    v_book_changed := false;
    for v_set in
      select quiz_set
      from jsonb_array_elements(v_book->'sets') sets(quiz_set)
    loop
      select id
      into v_existing_id
      from public.wct_quiz_sets
      where owner_id = p_owner_id
        and lesson_key = v_set->>'lessonKey';

      v_changed_id := null;
      insert into public.wct_quiz_sets (
        owner_id,
        lesson_key,
        source_kind,
        source_id,
        generator_version,
        source_hash,
        questions
      ) values (
        p_owner_id,
        v_set->>'lessonKey',
        v_set->>'sourceKind',
        v_set->>'sourceId',
        v_set->>'generatorVersion',
        v_set->>'sourceHash',
        v_set->'questions'
      )
      on conflict (owner_id, lesson_key) do update
      set generator_version = excluded.generator_version,
          source_hash = excluded.source_hash,
          questions = excluded.questions
      where wct_quiz_sets.generator_version is distinct from excluded.generator_version
         or wct_quiz_sets.source_hash is distinct from excluded.source_hash
      returning id into v_changed_id;

      if v_changed_id is null then
        v_unchanged_count := v_unchanged_count + 1;
      elsif v_existing_id is null then
        v_created_count := v_created_count + 1;
        v_book_changed := true;
      else
        v_updated_count := v_updated_count + 1;
        v_book_changed := true;
        delete from public.wct_quiz_progress
        where quiz_set_id = v_changed_id;
        get diagnostics v_deleted_count = row_count;
        v_reset_quiz_progress_count :=
          v_reset_quiz_progress_count + v_deleted_count;
      end if;
    end loop;

    if v_book_changed then
      delete from public.wct_pop_quiz_progress
      where owner_id = p_owner_id
        and book_id = v_book_id;
      get diagnostics v_deleted_count = row_count;
      v_reset_pop_progress_count :=
        v_reset_pop_progress_count + v_deleted_count;
    end if;
  end loop;

  return jsonb_build_object(
    'createdCount', v_created_count,
    'updatedCount', v_updated_count,
    'unchangedCount', v_unchanged_count,
    'resetQuizProgressCount', v_reset_quiz_progress_count,
    'resetPopProgressCount', v_reset_pop_progress_count
  );
end;
$$;

create or replace function public.start_wct_pop_quiz(
  p_book_id uuid,
  p_seed text,
  p_questions jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_attempt public.wct_pop_quiz_progress%rowtype;
  v_book_level text;
  v_day_count integer;
  v_question_count integer;
  v_question_day_count integer;
  v_source_set_count integer;
  v_source_version_count integer;
  v_source_version text;
  v_multiple_choice_count integer;
  v_fill_blank_count integer;
  v_true_false_count integer;
  v_requested_signature text;
  v_existing_signature text;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select regexp_replace(
    lower(coalesce(level_label, '')),
    '[[:space:]]+',
    '',
    'g'
  )
  into v_book_level
  from public.wct_books
  where id = p_book_id
    and owner_id = v_user_id;
  if not found then
    raise exception 'WCT book not found';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(v_user_id::text || ':' || p_book_id::text, 0)
  );

  if v_book_level not in ('prenovice', 'novice') then
    raise exception 'Pop Quiz is only available for Prenovice and Novice';
  end if;
  if p_seed is null or length(btrim(p_seed)) not between 1 and 240 then
    raise exception 'Invalid WCT Pop Quiz seed';
  end if;

  select count(*)::integer
  into v_day_count
  from public.wct_days
  where book_id = p_book_id;
  if v_day_count not between 1 and 100
    or p_questions is null
    or jsonb_typeof(p_questions) is distinct from 'array' then
    raise exception 'One WCT Pop Quiz question per Day is required';
  end if;
  if jsonb_array_length(p_questions) <> v_day_count then
    raise exception 'One WCT Pop Quiz question per Day is required';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_questions) item
    where jsonb_typeof(item) is distinct from 'object'
      or nullif(item->>'sourceQuizSetId', '') is null
      or nullif(item->>'dayId', '') is null
      or nullif(item->>'dayNumber', '') is null
      or nullif(item->>'dayLabel', '') is null
      or nullif(item->>'band', '') is null
      or jsonb_typeof(item->'question') is distinct from 'object'
      or nullif(item->'question'->>'id', '') is null
  ) then
    raise exception 'Unknown WCT Pop Quiz source question';
  end if;

  select
    count(distinct item->'question'->>'id')::integer,
    count(distinct item->>'dayId')::integer
  into v_question_count, v_question_day_count
  from jsonb_array_elements(p_questions) item;
  if v_question_count <> v_day_count then
    raise exception 'WCT Pop Quiz question IDs must be distinct';
  end if;
  if v_question_day_count <> v_day_count
    or exists (
      select 1
      from public.wct_days day
      where day.book_id = p_book_id
        and not exists (
          select 1
          from jsonb_array_elements(p_questions) item
          where item->>'dayId' = day.id::text
        )
    ) then
    raise exception 'One WCT Pop Quiz question per Day is required';
  end if;

  if exists (
    with ordered_days as (
      select
        id,
        row_number() over (order by day_number) as day_position,
        count(*) over () as day_count
      from public.wct_days
      where book_id = p_book_id
    ),
    banded_days as (
      select
        id,
        case
          when day_position <= ceiling(day_count::numeric / 3) then 'early'
          when day_position <= (
            ceiling(day_count::numeric / 3)
            + ceiling(
              (day_count - ceiling(day_count::numeric / 3))::numeric / 2
            )
          ) then 'middle'
          else 'late'
        end as expected_band
      from ordered_days
    )
    select 1
    from jsonb_array_elements(p_questions) item
    join banded_days on banded_days.id::text = item->>'dayId'
    where item->>'band' is distinct from expected_band
  ) then
    raise exception 'WCT Pop Quiz bands do not match ordered Days';
  end if;

  select
    count(distinct quiz.id)::integer,
    count(distinct quiz.generator_version)::integer,
    min(quiz.generator_version)
  into v_source_set_count, v_source_version_count, v_source_version
  from (
    select distinct item->>'sourceQuizSetId' as source_quiz_set_id
    from jsonb_array_elements(p_questions) item
  ) requested
  left join public.wct_quiz_sets quiz
    on quiz.id::text = requested.source_quiz_set_id
   and quiz.owner_id = v_user_id;

  if v_source_set_count <> v_day_count then
    raise exception using
      errcode = 'P0001',
      message = 'WCT_POP_QUIZ_RESTART_REQUIRED';
  end if;
  if v_source_version_count <> 1
    or v_source_version not in ('wct-review-v1', 'wct-review-v2') then
    raise exception 'WCT Pop Quiz versions cannot be mixed';
  end if;

  -- Missing old question IDs identify an inventory reset, not forged same-ID JSON.
  if exists (
    select 1
    from jsonb_array_elements(p_questions) item
    where exists (
      select 1
      from public.wct_quiz_sets quiz
      join public.wct_days day
        on day.id::text = quiz.source_id
       and day.book_id = p_book_id
      where quiz.id::text = item->>'sourceQuizSetId'
        and quiz.owner_id = v_user_id
        and quiz.source_kind = 'wct_day'
        and day.id::text = item->>'dayId'
    )
      and not exists (
      select 1
      from public.wct_quiz_sets quiz
      join public.wct_days day
        on day.id::text = quiz.source_id
       and day.book_id = p_book_id
      cross join lateral jsonb_array_elements(quiz.questions) source_question
      where quiz.id::text = item->>'sourceQuizSetId'
        and quiz.owner_id = v_user_id
        and quiz.source_kind = 'wct_day'
        and day.id::text = item->>'dayId'
        and source_question->>'id' = item->'question'->>'id'
    )
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'WCT_POP_QUIZ_RESTART_REQUIRED';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_questions) item
    where coalesce(item->'question'->>'kind', '') not in ('translation', 'pattern')
      or not exists (
        select 1
        from public.wct_quiz_sets quiz
        join public.wct_days day
          on day.id::text = quiz.source_id
         and day.book_id = p_book_id
        cross join lateral jsonb_array_elements(quiz.questions) source_question
        where quiz.id::text = item->>'sourceQuizSetId'
          and quiz.owner_id = v_user_id
          and quiz.source_kind = 'wct_day'
          and day.id::text = item->>'dayId'
          and day.day_number::text = item->>'dayNumber'
          and format('Day %s (%s)', day.day_number, btrim(day.short_label)) = item->>'dayLabel'
          and day.short_label = item->>'dayTopic'
          and coalesce(source_question->>'format', 'multiple_choice')
            = coalesce(item->'question'->>'format', 'multiple_choice')
          and source_question = item->'question'
      )
  ) then
    raise exception 'Unknown WCT Pop Quiz source question';
  end if;

  if v_source_version = 'wct-review-v1' then
    if exists (
      select 1
      from jsonb_array_elements(p_questions) item
      where item->'question' ? 'format'
         or item->'question' ? 'feedback'
    ) then
      raise exception 'WCT Pop Quiz versions cannot be mixed';
    end if;
  else
    if exists (
      select 1
      from jsonb_array_elements(p_questions) item
      where item->'question'->>'format' not in (
        'multiple_choice', 'fill_blank', 'true_false'
      )
    ) then
      raise exception 'WCT Pop Quiz versions cannot be mixed';
    end if;
    select
      count(*) filter (where item->'question'->>'format' = 'multiple_choice')::integer,
      count(*) filter (where item->'question'->>'format' = 'fill_blank')::integer,
      count(*) filter (where item->'question'->>'format' = 'true_false')::integer
    into
      v_multiple_choice_count,
      v_fill_blank_count,
      v_true_false_count
    from jsonb_array_elements(p_questions) item;
    if greatest(
      v_multiple_choice_count,
      v_fill_blank_count,
      v_true_false_count
    ) - least(
      v_multiple_choice_count,
      v_fill_blank_count,
      v_true_false_count
    ) > 1 then
      raise exception 'WCT Pop Quiz formats must be balanced';
    end if;
  end if;

  select string_agg(signature, '|' order by signature)
  into v_requested_signature
  from (
    select concat(
      item->>'sourceQuizSetId',
      ':',
      item->'question'->>'id'
    ) as signature
    from jsonb_array_elements(p_questions) item
  ) requested;

  select *
  into v_attempt
  from public.wct_pop_quiz_progress
  where owner_id = v_user_id
    and book_id = p_book_id
  for update;

  if found then
    if v_attempt.status = 'in_progress' then
      return to_jsonb(v_attempt);
    end if;

    if v_source_version = 'wct-review-v1' then
      select string_agg(signature, '|' order by signature)
      into v_existing_signature
      from (
        select concat(
          item->>'sourceQuizSetId',
          ':',
          item->'question'->>'id'
        ) as signature
        from jsonb_array_elements(v_attempt.questions) item
      ) existing;
      if v_existing_signature = v_requested_signature then
        raise exception 'WCT Pop Quiz retake must use different questions';
      end if;
    elsif exists (
      select 1
      from jsonb_array_elements(p_questions) requested
      where not exists (
        select 1
        from jsonb_array_elements(v_attempt.questions) previous
        where previous->>'dayId' = requested->>'dayId'
          and previous->'question'->>'id'
            is distinct from requested->'question'->>'id'
          and requested->'question'->>'format' = case
            when previous->'question'->>'format' = 'multiple_choice' then 'fill_blank'
            when previous->'question'->>'format' = 'fill_blank' then 'true_false'
            when previous->'question'->>'format' = 'true_false' then 'multiple_choice'
          end
      )
    ) then
      raise exception 'WCT Pop Quiz retake must change every Day format and question';
    end if;
  end if;

  insert into public.wct_pop_quiz_progress (
    owner_id,
    book_id,
    attempt_id,
    seed,
    questions,
    answers,
    current_index,
    status,
    latest_score,
    incorrect_days,
    started_at,
    completed_at,
    updated_at
  ) values (
    v_user_id,
    p_book_id,
    gen_random_uuid(),
    btrim(p_seed),
    p_questions,
    '[]'::jsonb,
    0,
    'in_progress',
    null,
    '[]'::jsonb,
    clock_timestamp(),
    null,
    clock_timestamp()
  )
  on conflict (owner_id, book_id) do update
  set attempt_id = gen_random_uuid(),
      seed = excluded.seed,
      questions = excluded.questions,
      answers = '[]'::jsonb,
      current_index = 0,
      status = 'in_progress',
      latest_score = null,
      incorrect_days = '[]'::jsonb,
      started_at = excluded.started_at,
      completed_at = null,
      updated_at = excluded.updated_at
  where wct_pop_quiz_progress.status = 'completed'
  returning * into v_attempt;

  if not found then
    raise exception using
      errcode = 'P0001',
      message = 'WCT_POP_QUIZ_RESTART_REQUIRED';
  end if;
  return to_jsonb(v_attempt);
end;
$$;

create or replace function public.submit_wct_quiz_attempt(
  p_quiz_set_id uuid,
  p_answers jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_owner_id uuid;
  v_book_id uuid;
  v_source_kind text;
  v_questions jsonb;
  v_answer_count integer;
  v_question_count integer;
  v_score integer;
  v_completed_at timestamptz := clock_timestamp();
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select quiz.owner_id, quiz.source_kind, day.book_id
  into v_owner_id, v_source_kind, v_book_id
  from public.wct_quiz_sets quiz
  left join public.wct_days day on day.id::text = quiz.source_id
  where quiz.id = p_quiz_set_id
    and quiz.owner_id = v_user_id;
  if not found then
    raise exception 'WCT quiz not found';
  end if;

  if v_source_kind = 'wct_day' then
    if v_book_id is null then
      raise exception 'WCT quiz not found';
    end if;
    perform pg_advisory_xact_lock(
      hashtextextended(v_owner_id::text || ':' || v_book_id::text, 0)
    );
    select quiz.questions
    into v_questions
    from public.wct_quiz_sets quiz
    join public.wct_days day
      on day.id::text = quiz.source_id
     and day.book_id = v_book_id
    where quiz.id = p_quiz_set_id
      and quiz.owner_id = v_owner_id
      and quiz.source_kind = 'wct_day';
  else
    select quiz.questions
    into v_questions
    from public.wct_quiz_sets quiz
    where quiz.id = p_quiz_set_id
      and quiz.owner_id = v_user_id
      and quiz.source_kind = 'wct_premium';
  end if;
  if not found then
    raise exception 'WCT quiz not found';
  end if;

  if p_answers is null
    or jsonb_typeof(p_answers) is distinct from 'array' then
    raise exception 'Exactly five answers are required';
  end if;
  if jsonb_array_length(p_answers) <> 5 then
    raise exception 'Exactly five answers are required';
  end if;

  select count(distinct question->>'id')
  into v_question_count
  from jsonb_array_elements(v_questions) question;
  if v_question_count <> 5 then
    raise exception 'Stored WCT quiz is invalid';
  end if;

  select count(distinct answer->>'questionId')
  into v_answer_count
  from jsonb_array_elements(p_answers) answer;
  if v_answer_count <> 5 then
    raise exception 'Each question must be answered once';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_answers) answer
    where not exists (
      select 1
      from jsonb_array_elements(v_questions) question
      where question->>'id' = answer->>'questionId'
        and exists (
          select 1
          from jsonb_array_elements(question->'choices') choice
          where choice->>'id' = answer->>'choiceId'
        )
    )
  ) then
    raise exception 'Unknown WCT quiz question or choice';
  end if;

  select count(*)
  into v_score
  from jsonb_array_elements(p_answers) answer
  join jsonb_array_elements(v_questions) question
    on question->>'id' = answer->>'questionId'
  where question->>'correctChoiceId' = answer->>'choiceId';

  insert into public.wct_quiz_progress (
    quiz_set_id,
    user_id,
    latest_score,
    completed_at,
    updated_at
  ) values (
    p_quiz_set_id,
    v_user_id,
    v_score,
    v_completed_at,
    v_completed_at
  )
  on conflict (quiz_set_id, user_id) do update
  set latest_score = excluded.latest_score,
      completed_at = excluded.completed_at,
      updated_at = excluded.updated_at;

  return jsonb_build_object(
    'score', v_score,
    'total', 5,
    'completedAt', v_completed_at
  );
end;
$$;

revoke all on function public.sync_wct_standard_quiz_sets(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.sync_wct_standard_quiz_sets(uuid, jsonb) to service_role;

revoke all on function public.start_wct_pop_quiz(uuid, text, jsonb)
from public, anon, service_role;
grant execute on function public.start_wct_pop_quiz(uuid, text, jsonb)
to authenticated;

revoke all on function public.submit_wct_quiz_attempt(uuid, jsonb)
from public, anon, service_role;
grant execute on function public.submit_wct_quiz_attempt(uuid, jsonb)
to authenticated;

notify pgrst, 'reload schema';
