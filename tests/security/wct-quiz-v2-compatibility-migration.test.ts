import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migrationPath =
  "supabase/migrations/20260805120000_add_wct_quiz_v2_compatibility.sql";
const checkpointBPath =
  "supabase/migrations/20260805130000_replace_wct_standard_quizzes_v2.sql";
const sql = existsSync(migrationPath) ? readFileSync(migrationPath, "utf8") : "";

describe("WCT quiz v2 compatibility migration", () => {
  it("installs a service-role-only atomic standard-set synchronization RPC", () => {
    expect(existsSync(migrationPath)).toBe(true);
    expect(existsSync(checkpointBPath)).toBe(true);
    expect(sql).toContain("sync_wct_standard_quiz_sets(uuid, jsonb)");
    expect(sql).toContain(
      "grant execute on function public.sync_wct_standard_quiz_sets(uuid, jsonb) to service_role"
    );
    expect(sql).toContain(
      "revoke all on function public.sync_wct_standard_quiz_sets(uuid, jsonb) from public, anon, authenticated"
    );
    expect(sql).toContain("security definer");
    expect(sql).toContain("set search_path = public, pg_temp");
    expect(sql).toContain("wct-review-v2");
  });

  it("serializes sync, Pop start, and standard submit on one documented key", () => {
    expect(sql.match(/pg_advisory_xact_lock/g)).toHaveLength(3);
    expect(sql.match(/hashtextextended\(p_owner_id::text \|\| ':' \|\| v_book_id::text, 0\)/g))
      .toHaveLength(1);
    expect(sql.match(/hashtextextended\(v_user_id::text \|\| ':' \|\| p_book_id::text, 0\)/g))
      .toHaveLength(1);
    expect(sql.match(/hashtextextended\(v_owner_id::text \|\| ':' \|\| v_book_id::text, 0\)/g))
      .toHaveLength(1);
    expect(sql).toContain("order by (book->>'bookId')::uuid");
  });

  it("guards immutable v2 identity and full question structure before mutation", () => {
    expect(sql).toContain("WCT quiz generator/version integrity collision");
    expect(sql).toContain("coalesce(source_question->>'format', 'multiple_choice')");
    expect(sql).toContain("jsonb_array_length(v_questions) <> 5");
    expect(sql).toContain("v_multiple_choice_count <> 2");
    expect(sql).toContain("v_fill_blank_count <> 2");
    expect(sql).toContain("v_true_false_count <> 1");
    expect(sql).toContain("v_translation_count <> 3");
    expect(sql).toContain("v_pattern_count <> 2");
    expect(sql).toContain("question->'feedback'->>'correctSentence'");
    expect(sql).toContain("where wct_quiz_sets.generator_version is distinct from excluded.generator_version");
  });

  it("branches Pop validation by version without rewriting legacy JSON", () => {
    expect(sql).toContain("WCT Pop Quiz versions cannot be mixed");
    expect(sql).toContain(
      "WCT Pop Quiz retake must change every Day format and question"
    );
    expect(sql).toContain("WCT_POP_QUIZ_RESTART_REQUIRED");
    expect(sql).toContain("errcode = 'P0001'");
    expect(sql).toContain("source_question = item->'question'");
    expect(sql).not.toContain("jsonb_set(p_questions");
  });

  it("does not loosen direct table-write or RLS policy boundaries", () => {
    expect(sql).not.toMatch(/grant\s+(insert|update|delete|all)\s+on\s+public\.wct_/i);
    expect(sql).not.toMatch(/alter table[\s\S]*disable row level security/i);
    expect(sql).not.toMatch(/drop policy/i);
  });
});
