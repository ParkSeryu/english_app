create or replace function public.import_wct_batch(
  p_owner_id uuid,
  p_idempotency_key text,
  p_payload_hash text,
  p_payload jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_receipt public.wct_import_receipts%rowtype;
  v_book public.wct_books%rowtype;
  v_day jsonb;
  v_day_id uuid;
  v_existing_day_id uuid;
  v_action text;
  v_operation text;
  v_item jsonb;
  v_pattern jsonb;
  v_example jsonb;
  v_pattern_id uuid;
  v_pattern_ids jsonb;
  v_index integer;
  v_child_index integer;
  v_sort integer;
  v_operations jsonb := '[]'::jsonb;
  v_receipt_id uuid;
begin
  select * into v_receipt
  from public.wct_import_receipts
  where owner_id = p_owner_id and idempotency_key = p_idempotency_key;

  if found then
    if v_receipt.payload_hash <> p_payload_hash then
      raise exception 'Idempotency key already used with a different payload';
    end if;
    return v_receipt.operation_summary || jsonb_build_object('replayed', true);
  end if;

  if p_payload ?| array['topics', 'rawOcr', 'raw_ocr', 'scan', 'scanFile'] then
    raise exception 'Topic, raw OCR, and scan fields are not accepted';
  end if;
  if jsonb_typeof(p_payload->'book') <> 'object'
    or jsonb_typeof(p_payload->'days') <> 'array'
    or jsonb_array_length(p_payload->'days') = 0 then
    raise exception 'A book and at least one Day are required';
  end if;

  insert into public.wct_books(owner_id, title, level_label, sort_order)
  values (
    p_owner_id,
    btrim(p_payload->'book'->>'title'),
    nullif(btrim(p_payload->'book'->>'levelLabel'), ''),
    coalesce((p_payload->'book'->>'sortOrder')::integer, 0)
  )
  on conflict (owner_id, normalized_title) do update
  set title = excluded.title,
      level_label = excluded.level_label,
      sort_order = excluded.sort_order,
      updated_at = now()
  returning * into v_book;

  for v_day, v_index in
    select value, (ordinality - 1)::integer
    from jsonb_array_elements(p_payload->'days') with ordinality
  loop
    v_action := v_day->>'duplicateAction';
    if v_action not in ('create', 'replace', 'merge', 'skip') then
      raise exception 'Unknown duplicate action: %', v_action;
    end if;

    select id into v_existing_day_id from public.wct_days
    where book_id = v_book.id and day_number = (v_day->>'dayNumber')::integer;

    if v_existing_day_id is null then
      if v_action <> 'create' then
        raise exception 'Day % does not exist for %', v_day->>'dayNumber', v_action;
      end if;
      insert into public.wct_days(
        book_id, day_number, short_label, learning_summary,
        source_page_start, source_page_end, source_needs_review
      ) values (
        v_book.id,
        (v_day->>'dayNumber')::integer,
        btrim(v_day->>'shortLabel'),
        nullif(btrim(v_day->>'learningSummary'), ''),
        (v_day->>'sourcePageStart')::integer,
        (v_day->>'sourcePageEnd')::integer,
        coalesce((v_day->>'sourceNeedsReview')::boolean, false)
      ) returning id into v_day_id;
      v_operation := 'created';
    else
      v_day_id := v_existing_day_id;
      if v_action = 'create' then
        raise exception 'Day % already exists', v_day->>'dayNumber';
      elsif v_action = 'skip' then
        v_operations := v_operations || jsonb_build_array(jsonb_build_object(
          'dayNumber', (v_day->>'dayNumber')::integer,
          'action', 'skipped',
          'dayId', v_day_id
        ));
        continue;
      elsif v_action = 'replace' then
        delete from public.wct_important_notes where day_id = v_day_id;
        delete from public.wct_practice_prompts where day_id = v_day_id;
        delete from public.wct_day_concepts where day_id = v_day_id;
        delete from public.wct_patterns where day_id = v_day_id;
        update public.wct_days set
          short_label = btrim(v_day->>'shortLabel'),
          learning_summary = nullif(btrim(v_day->>'learningSummary'), ''),
          source_page_start = (v_day->>'sourcePageStart')::integer,
          source_page_end = (v_day->>'sourcePageEnd')::integer,
          source_needs_review = coalesce((v_day->>'sourceNeedsReview')::boolean, false),
          updated_at = now()
        where id = v_day_id;
        v_operation := 'replaced';
      else
        update public.wct_days set
          short_label = btrim(v_day->>'shortLabel'),
          learning_summary = coalesce(nullif(btrim(v_day->>'learningSummary'), ''), learning_summary),
          source_page_start = coalesce((v_day->>'sourcePageStart')::integer, source_page_start),
          source_page_end = coalesce((v_day->>'sourcePageEnd')::integer, source_page_end),
          source_needs_review = source_needs_review or coalesce((v_day->>'sourceNeedsReview')::boolean, false),
          updated_at = now()
        where id = v_day_id;
        v_operation := 'merged';
      end if;
    end if;

    for v_item, v_child_index in
      select value, (ordinality - 1)::integer
      from jsonb_array_elements(coalesce(v_day->'concepts', '[]'::jsonb)) with ordinality
    loop
      if v_action <> 'merge' or not exists (
        select 1 from public.wct_day_concepts
        where day_id = v_day_id
          and regexp_replace(lower(btrim(text)), '\s+', ' ', 'g')
            = regexp_replace(lower(btrim(v_item->>'text')), '\s+', ' ', 'g')
      ) then
        select coalesce(max(sort_order) + 1, 0) into v_sort
        from public.wct_day_concepts where day_id = v_day_id;
        insert into public.wct_day_concepts(day_id, text, source_kind, sort_order)
        values (v_day_id, btrim(v_item->>'text'), v_item->>'sourceKind', v_sort);
      end if;
    end loop;

    v_pattern_ids := '{}'::jsonb;
    for v_pattern, v_child_index in
      select value, (ordinality - 1)::integer
      from jsonb_array_elements(coalesce(v_day->'patterns', '[]'::jsonb)) with ordinality
    loop
      v_pattern_id := null;
      if v_action = 'merge' then
        select id into v_pattern_id from public.wct_patterns
        where day_id = v_day_id
          and regexp_replace(lower(btrim(pattern_text)), '\s+', ' ', 'g')
            = regexp_replace(lower(btrim(v_pattern->>'patternText')), '\s+', ' ', 'g')
        order by sort_order
        limit 1;
      end if;
      if v_pattern_id is null then
        select coalesce(max(sort_order) + 1, 0) into v_sort
        from public.wct_patterns where day_id = v_day_id;
        insert into public.wct_patterns(
          day_id, pattern_text, meaning_ko, usage_note, usage_source,
          source_page, source_needs_review, sort_order
        ) values (
          v_day_id,
          btrim(v_pattern->>'patternText'),
          nullif(btrim(v_pattern->>'meaningKo'), ''),
          nullif(btrim(v_pattern->>'usageNote'), ''),
          v_pattern->>'usageSource',
          (v_pattern->>'sourcePage')::integer,
          coalesce((v_pattern->>'sourceNeedsReview')::boolean, false),
          v_sort
        ) returning id into v_pattern_id;
      end if;
      v_pattern_ids := jsonb_set(v_pattern_ids, array[v_child_index::text], to_jsonb(v_pattern_id::text));

      for v_example, v_index in
        select value, (ordinality - 1)::integer
        from jsonb_array_elements(coalesce(v_pattern->'examples', '[]'::jsonb)) with ordinality
      loop
        if v_action <> 'merge' or not exists (
          select 1 from public.wct_examples
          where pattern_id = v_pattern_id
            and regexp_replace(lower(btrim(english_text)), '\s+', ' ', 'g')
              = regexp_replace(lower(btrim(v_example->>'englishText')), '\s+', ' ', 'g')
        ) then
          select coalesce(max(sort_order) + 1, 0) into v_sort
          from public.wct_examples where pattern_id = v_pattern_id;
          insert into public.wct_examples(
            pattern_id, english_text, meaning_ko, source_page, source_needs_review, sort_order
          ) values (
            v_pattern_id,
            btrim(v_example->>'englishText'),
            nullif(btrim(v_example->>'meaningKo'), ''),
            (v_example->>'sourcePage')::integer,
            coalesce((v_example->>'sourceNeedsReview')::boolean, false),
            v_sort
          );
        end if;
      end loop;
    end loop;

    for v_item, v_child_index in
      select value, (ordinality - 1)::integer
      from jsonb_array_elements(coalesce(v_day->'importantNotes', '[]'::jsonb)) with ordinality
    loop
      if v_action <> 'merge' or not exists (
        select 1 from public.wct_important_notes
        where day_id = v_day_id
          and regexp_replace(lower(btrim(note_text)), '\s+', ' ', 'g')
            = regexp_replace(lower(btrim(v_item->>'noteText')), '\s+', ' ', 'g')
      ) then
        select coalesce(max(sort_order) + 1, 0) into v_sort
        from public.wct_important_notes where day_id = v_day_id;
        insert into public.wct_important_notes(day_id, pattern_id, note_text, source_page, sort_order)
        values (
          v_day_id,
          case when v_item->>'patternIndex' is null then null
            else (v_pattern_ids->>(v_item->>'patternIndex'))::uuid end,
          btrim(v_item->>'noteText'),
          (v_item->>'sourcePage')::integer,
          v_sort
        );
      end if;
    end loop;

    for v_item, v_child_index in
      select value, (ordinality - 1)::integer
      from jsonb_array_elements(coalesce(v_day->'practicePrompts', '[]'::jsonb)) with ordinality
    loop
      if v_action <> 'merge' or not exists (
        select 1 from public.wct_practice_prompts
        where day_id = v_day_id
          and regexp_replace(lower(btrim(prompt_text)), '\s+', ' ', 'g')
            = regexp_replace(lower(btrim(v_item->>'promptText')), '\s+', ' ', 'g')
      ) then
        select coalesce(max(sort_order) + 1, 0) into v_sort
        from public.wct_practice_prompts where day_id = v_day_id;
        insert into public.wct_practice_prompts(
          day_id, pattern_id, prompt_text, meaning_ko, source_page, sort_order
        ) values (
          v_day_id,
          case when v_item->>'patternIndex' is null then null
            else (v_pattern_ids->>(v_item->>'patternIndex'))::uuid end,
          btrim(v_item->>'promptText'),
          nullif(btrim(v_item->>'meaningKo'), ''),
          (v_item->>'sourcePage')::integer,
          v_sort
        );
      end if;
    end loop;

    v_operations := v_operations || jsonb_build_array(jsonb_build_object(
      'dayNumber', (v_day->>'dayNumber')::integer,
      'action', v_operation,
      'dayId', v_day_id
    ));
  end loop;

  insert into public.wct_import_receipts(
    owner_id, book_id, idempotency_key, payload_hash, operation_summary
  ) values (
    p_owner_id,
    v_book.id,
    p_idempotency_key,
    p_payload_hash,
    jsonb_build_object(
      'bookId', v_book.id, 'receiptId', null, 'replayed', false, 'operations', v_operations
    )
  ) returning id into v_receipt_id;

  update public.wct_import_receipts
  set operation_summary = operation_summary || jsonb_build_object('receiptId', v_receipt_id)
  where id = v_receipt_id;

  return jsonb_build_object(
    'bookId', v_book.id,
    'receiptId', v_receipt_id,
    'replayed', false,
    'operations', v_operations
  );
end;
$$;

revoke all on function public.import_wct_batch(uuid, text, text, jsonb)
from public, anon, authenticated;
grant execute on function public.import_wct_batch(uuid, text, text, jsonb)
to service_role;

notify pgrst, 'reload schema';
