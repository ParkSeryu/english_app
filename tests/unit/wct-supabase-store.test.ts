import { describe, expect, it, vi } from "vitest";

import { SupabaseWctStore } from "@/lib/wct-store/supabase-store";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const DAY_IDS = ["day-2", "day-1"];

const fullDayRow = {
  id: "day-1",
  book_id: "book-1",
  day_number: 1,
  short_label: "Topic 1",
  learning_summary: null,
  source_page_start: null,
  source_page_end: null,
  source_needs_review: false,
  wct_day_concepts: [{
    id: "concept-1", text: "Concept 1", source_kind: "book", sort_order: 0
  }],
  wct_patterns: [{
    id: "pattern-1",
    pattern_text: "I can + verb",
    meaning_ko: "할 수 있다",
    usage_note: null,
    usage_source: "book",
    source_page: null,
    source_needs_review: false,
    sort_order: 0,
    wct_examples: [{
      id: "example-1",
      english_text: "I can swim.",
      meaning_ko: "나는 수영할 수 있다.",
      source_page: null,
      source_needs_review: false,
      sort_order: 0
    }]
  }],
  wct_important_notes: [{
    id: "note-1", pattern_id: "pattern-1", note_text: "Use a base verb.",
    source_page: null, sort_order: 0
  }],
  wct_practice_prompts: [{
    id: "prompt-1", pattern_id: "pattern-1", prompt_text: "나는 수영할 수 있다.",
    meaning_ko: null, source_page: null, sort_order: 0
  }]
};

describe("SupabaseWctStore bulk Day reads", () => {
  it("returns empty input without opening a query", async () => {
    const createClient = vi.fn();
    const store = new SupabaseWctStore({ id: USER_ID }, createClient as never);

    await expect(store.getDays([])).resolves.toEqual([]);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("loads and maps all requested Days through one IN query", async () => {
    const inFilter = vi.fn().mockResolvedValue({ data: [fullDayRow], error: null });
    const select = vi.fn().mockReturnValue({ in: inFilter });
    const from = vi.fn().mockReturnValue({ select });
    const store = new SupabaseWctStore(
      { id: USER_ID },
      () => ({ from } as never)
    );

    await expect(store.getDays(DAY_IDS)).resolves.toEqual([
      expect.objectContaining({
        id: "day-1",
        bookId: "book-1",
        dayNumber: 1,
        concepts: [expect.objectContaining({ id: "concept-1" })],
        patterns: [expect.objectContaining({
          id: "pattern-1",
          examples: [expect.objectContaining({ id: "example-1" })]
        })],
        importantNotes: [expect.objectContaining({ id: "note-1" })],
        practicePrompts: [expect.objectContaining({ id: "prompt-1" })]
      })
    ]);
    expect(from).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith("wct_days");
    expect(select).toHaveBeenCalledTimes(1);
    expect(inFilter).toHaveBeenCalledTimes(1);
    expect(inFilter).toHaveBeenCalledWith("id", DAY_IDS);
  });

  it("keeps the existing WCT Day query error contract", async () => {
    const inFilter = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "database unavailable" }
    });
    const store = new SupabaseWctStore(
      { id: USER_ID },
      () => ({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({ in: inFilter })
        })
      } as never)
    );

    await expect(store.getDays(DAY_IDS))
      .rejects.toThrow("WCT Day query failed: database unavailable");
  });
});
