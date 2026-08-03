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

  it("enforces book eligibility, selector quotas, and contiguous Day bands", () => {
    expect(sql).toContain("v_book_level not in ('prenovice', 'novice')");
    expect(sql).toContain("v_translation_count <> 12");
    expect(sql).toContain("v_pattern_count <> 8");
    expect(sql).toContain("v_early_count <> 7");
    expect(sql).toContain("v_middle_count <> 7");
    expect(sql).toContain("v_late_count <> 6");
    expect(sql).toContain("v_max_day_count > 2");
    expect(sql).toContain("item->>'band' is distinct from expected_band");
  });

  it("rejects a completed retake with the same canonical source signature", () => {
    expect(sql).toContain("v_requested_signature");
    expect(sql).toContain("v_existing_signature");
    expect(sql).toContain("v_existing_signature = v_requested_signature");
    expect(sql).toContain("WCT Pop Quiz retake must use different questions");
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
