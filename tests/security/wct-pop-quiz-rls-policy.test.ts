import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migrationPath =
  "supabase/migrations/20260803120000_create_wct_pop_quiz.sql";
const sql = existsSync(migrationPath) ? readFileSync(migrationPath, "utf8") : "";

describe("WCT Pop Quiz Supabase migration", () => {
  it("stores one owner-scoped attempt per book behind forced RLS", () => {
    expect(existsSync(migrationPath)).toBe(true);
    expect(sql).toContain("primary key (owner_id, book_id)");
    expect(sql).toContain(
      "alter table public.wct_pop_quiz_progress enable row level security"
    );
    expect(sql).toContain(
      "alter table public.wct_pop_quiz_progress force row level security"
    );
    expect(sql).toContain('create policy "wct_pop_quiz_progress_select_own"');
    expect(sql).toContain("using (owner_id = auth.uid())");
  });

  it("validates the protected 20-question and 20-answer snapshots", () => {
    expect(sql).toContain("jsonb_array_length(questions) = 20");
    expect(sql).toContain("jsonb_array_length(p_questions) <> 20");
    expect(sql).toContain("current_index <> 20");
    expect(sql).toMatch(/jsonb_array_length\((?:v_attempt\.)?answers\) <> 20/);
  });

  it("allows authenticated RPC execution without direct writes", () => {
    expect(sql).toContain("revoke insert, update, delete");
    expect(sql).toContain("on public.wct_pop_quiz_progress");
    expect(sql).toContain("from authenticated");

    for (const signature of [
      "start_wct_pop_quiz(uuid, text, jsonb)",
      "confirm_wct_pop_quiz_answer(uuid, uuid, text, text)",
      "complete_wct_pop_quiz(uuid, uuid)"
    ]) {
      expect(sql).toContain(`grant execute on function public.${signature}`);
      expect(sql).toContain(`revoke all on function public.${signature}`);
    }
    expect(sql.match(/security definer/g)).toHaveLength(3);
  });
});
