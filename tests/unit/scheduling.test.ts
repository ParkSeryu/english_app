import { describe, expect, it } from "vitest";

import { nextDueAtForKnown, nextExpressionReviewSchedule, nextHardIntervalDays, nextKnownIntervalDays, nextOkayIntervalDays, scheduleMemorizationQueue } from "@/lib/scheduling";
import type { ExpressionCard } from "@/lib/types";

function card(overrides: Partial<ExpressionCard>): ExpressionCard {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    expression_day_id: "day-a",
    owner_id: "user-a",
    english: "have to ~",
    korean_prompt: "~해야 한다",
    nuance_note: null,
    structure_note: null,
    grammar_note: null,
    user_memo: null,
    source_order: 0,
    known_count: 0,
    unknown_count: 0,
    hard_count: 0,
    okay_count: 0,
    easy_count: 0,
    review_count: 0,
    last_result: null,
    last_reviewed_at: null,
    due_at: null,
    interval_days: 0,
    created_at: "2026-04-28T00:00:00.000Z",
    updated_at: "2026-04-28T00:00:00.000Z",
    examples: [],
    ...overrides
  };
}

const now = new Date("2026-04-28T12:00:00.000Z");

describe("scheduleMemorizationQueue", () => {
  it("only includes new or due expressions", () => {
    const queue = scheduleMemorizationQueue(
      [
        card({ id: "new", last_reviewed_at: null, due_at: null }),
        card({ id: "due", last_reviewed_at: "2026-04-27T12:00:00.000Z", due_at: "2026-04-28T11:59:00.000Z" }),
        card({ id: "future", last_reviewed_at: "2026-04-28T11:00:00.000Z", due_at: "2026-04-29T11:00:00.000Z" })
      ],
      10,
      now
    );
    expect(queue.map((candidate) => candidate.id)).toEqual(["new", "due"]);
  });

  it("honors future due_at for remembered cards even after the Korean day changes", () => {
    const queue = scheduleMemorizationQueue(
      [
        card({ id: "known-future", known_count: 3, last_result: "known", last_reviewed_at: "2026-04-28T14:50:00.000Z", due_at: "2026-05-05T15:00:00.000Z", interval_days: 7 }),
        card({ id: "known-due", known_count: 3, last_result: "known", last_reviewed_at: "2026-04-21T14:50:00.000Z", due_at: "2026-04-28T11:00:00.000Z", interval_days: 7 }),
        card({ id: "forgotten", unknown_count: 1, last_result: "unknown", last_reviewed_at: "2026-04-28T11:30:00.000Z", due_at: null, interval_days: 7 })
      ],
      10,
      new Date("2026-04-29T15:01:00.000Z")
    );
    expect(queue.map((candidate) => candidate.id)).toEqual(["forgotten", "known-due"]);
  });

  it("keeps old remembered rows without due_at out until the next Korean day", () => {
    const sameDayQueue = scheduleMemorizationQueue(
      [card({ id: "same-day-known", known_count: 1, last_result: "known", last_reviewed_at: "2026-04-28T11:30:00.000Z", due_at: null, interval_days: 1 })],
      10,
      now
    );
    expect(sameDayQueue).toEqual([]);

    const nextDayQueue = scheduleMemorizationQueue(
      [card({ id: "previous-day-known", known_count: 1, last_result: "known", last_reviewed_at: "2026-04-28T14:50:00.000Z", due_at: null, interval_days: 1 })],
      10,
      new Date("2026-04-28T15:01:00.000Z")
    );
    expect(nextDayQueue.map((candidate) => candidate.id)).toEqual(["previous-day-known"]);
  });

  it("prioritizes higher cumulative unknown_count first among due cards", () => {
    const queue = scheduleMemorizationQueue(
      [
        card({ id: "low", unknown_count: 1, due_at: "2026-04-28T11:50:00.000Z", last_reviewed_at: "2026-04-28T10:00:00.000Z" }),
        card({ id: "high", unknown_count: 3, due_at: "2026-04-28T11:55:00.000Z", last_reviewed_at: "2026-04-28T10:00:00.000Z" }),
        card({ id: "none", unknown_count: 0, due_at: "2026-04-28T11:00:00.000Z", last_reviewed_at: "2026-04-28T10:00:00.000Z" })
      ],
      10,
      now
    );
    expect(queue.map((candidate) => candidate.id)).toEqual(["high", "low", "none"]);
  });

  it("boosts never-reviewed expressions, then due time, then known_count", () => {
    const queue = scheduleMemorizationQueue(
      [
        card({ id: "known-many", known_count: 4, last_reviewed_at: "2026-04-27T00:00:00.000Z", due_at: "2026-04-28T11:00:00.000Z" }),
        card({ id: "never", known_count: 0, last_reviewed_at: null, due_at: null }),
        card({ id: "known-once", known_count: 1, last_reviewed_at: "2026-04-26T00:00:00.000Z", due_at: "2026-04-28T10:00:00.000Z" })
      ],
      10,
      now
    );
    expect(queue.map((candidate) => candidate.id)).toEqual(["never", "known-once", "known-many"]);
  });

  it("uses source order as the final stable tie-breaker", () => {
    const queue = scheduleMemorizationQueue([card({ id: "second", source_order: 2 }), card({ id: "first", source_order: 1 })], 10, now);
    expect(queue.map((candidate) => candidate.id)).toEqual(["first", "second"]);
  });

  it("keeps queues small and configurable", () => {
    const cards = Array.from({ length: 312 }, (_, index) => card({ id: String(index), source_order: index }));
    expect(scheduleMemorizationQueue(cards, 5, now)).toHaveLength(5);
    expect(scheduleMemorizationQueue(cards, undefined, now)).toHaveLength(300);
  });
});

describe("Anki-lite interval policy", () => {
  it("promotes immediate recalls through the bounded interval ladder", () => {
    expect(nextKnownIntervalDays(0)).toBe(3);
    expect(nextKnownIntervalDays(1)).toBe(3);
    expect(nextKnownIntervalDays(3)).toBe(7);
    expect(nextKnownIntervalDays(7)).toBe(14);
    expect(nextKnownIntervalDays(14)).toBe(30);
    expect(nextKnownIntervalDays(30)).toBe(60);
    expect(nextKnownIntervalDays(60)).toBe(90);
    expect(nextKnownIntervalDays(90)).toBe(180);
    expect(nextKnownIntervalDays(180)).toBe(365);
    expect(nextKnownIntervalDays(365)).toBe(365);
  });

  it("keeps again cards due without reducing their interval", () => {
    for (const intervalDays of [0, 1, 30, 90, 180, 365]) {
      expect(nextExpressionReviewSchedule(card({ interval_days: intervalDays }), "again", now)).toEqual({ intervalDays, dueAt: null });
    }
  });

  it("steps hard cards down one interval with a one-day minimum", () => {
    expect(nextHardIntervalDays(0)).toBe(1);
    expect(nextHardIntervalDays(1)).toBe(1);
    expect(nextHardIntervalDays(3)).toBe(1);
    expect(nextHardIntervalDays(7)).toBe(3);
    expect(nextHardIntervalDays(30)).toBe(14);
    expect(nextHardIntervalDays(90)).toBe(60);
    expect(nextHardIntervalDays(180)).toBe(90);
    expect(nextHardIntervalDays(365)).toBe(180);
    expect(nextExpressionReviewSchedule(card({ id: "hard-new" }), "hard", now)).toEqual({ intervalDays: 1, dueAt: "2026-04-28T15:00:00.000Z" });
    expect(nextExpressionReviewSchedule(card({ id: "hard-mature", last_result: "known", interval_days: 30 }), "hard", now)).toEqual({ intervalDays: 14, dueAt: "2026-05-11T15:00:00.000Z" });
  });

  it("keeps okay cards at the current interval with a one-day minimum", () => {
    expect(nextOkayIntervalDays(0)).toBe(1);
    expect(nextOkayIntervalDays(1)).toBe(1);
    expect(nextOkayIntervalDays(7)).toBe(7);
    expect(nextOkayIntervalDays(30)).toBe(30);
    expect(nextExpressionReviewSchedule(card({ id: "okay-new" }), "okay", now)).toEqual({ intervalDays: 1, dueAt: "2026-04-28T15:00:00.000Z" });
    expect(nextExpressionReviewSchedule(card({ id: "okay-mature", last_result: "known", interval_days: 30 }), "okay", now)).toEqual({ intervalDays: 30, dueAt: "2026-05-27T15:00:00.000Z" });
  });

  it("sets remembered cards due on the selected future Korean-midnight boundary", () => {
    expect(nextDueAtForKnown(1, new Date("2026-04-28T14:50:00.000Z"))).toBe("2026-04-28T15:00:00.000Z");
    expect(nextDueAtForKnown(3, new Date("2026-04-28T14:50:00.000Z"))).toBe("2026-04-30T15:00:00.000Z");
    expect(nextDueAtForKnown(7, new Date("2026-04-28T15:01:00.000Z"))).toBe("2026-05-05T15:00:00.000Z");
  });

  it("schedules easy recalls one ladder step out", () => {
    const direct = nextExpressionReviewSchedule(card({ id: "direct-new" }), "easy", now);
    expect(direct).toEqual({ intervalDays: 3, dueAt: "2026-04-30T15:00:00.000Z" });

    const recovered = nextExpressionReviewSchedule(card({ id: "recovered-new", last_result: "unknown", last_reviewed_at: "2026-04-28T11:30:00.000Z", interval_days: 0 }), "easy", now);
    expect(recovered).toEqual({ intervalDays: 3, dueAt: "2026-04-30T15:00:00.000Z" });
  });

  it("does not reduce again intervals and lets okay maintain lapsed intervals", () => {
    const firstAgain = nextExpressionReviewSchedule(card({ id: "mature", last_result: "known", interval_days: 14 }), "again", now);
    expect(firstAgain).toEqual({ intervalDays: 14, dueAt: null });

    const lapsedMatureCard = card({ id: "mature", last_result: "unknown", interval_days: 14 });

    const repeatedAgain = nextExpressionReviewSchedule(lapsedMatureCard, "again", now);
    expect(repeatedAgain).toEqual({ intervalDays: 14, dueAt: null });

    const okayRecovered = nextExpressionReviewSchedule(lapsedMatureCard, "okay", now);
    expect(okayRecovered).toEqual({ intervalDays: 14, dueAt: "2026-05-11T15:00:00.000Z" });

    const easyRecovered = nextExpressionReviewSchedule(lapsedMatureCard, "easy", now);
    expect(easyRecovered).toEqual({ intervalDays: 30, dueAt: "2026-05-27T15:00:00.000Z" });

    const hardRecovered = nextExpressionReviewSchedule(lapsedMatureCard, "hard", now);
    expect(hardRecovered).toEqual({ intervalDays: 7, dueAt: "2026-05-04T15:00:00.000Z" });
  });

  it("stretches mature cards through sixty, ninety, one-eighty, and yearly intervals", () => {
    const sixtyDay = nextExpressionReviewSchedule(card({ id: "mature-30", last_result: "known", last_reviewed_at: "2026-03-29T12:00:00.000Z", interval_days: 30 }), "easy", now);
    expect(sixtyDay).toEqual({ intervalDays: 60, dueAt: "2026-06-26T15:00:00.000Z" });

    const ninetyDay = nextExpressionReviewSchedule(card({ id: "mature-60", last_result: "known", last_reviewed_at: "2026-02-27T12:00:00.000Z", interval_days: 60 }), "easy", now);
    expect(ninetyDay).toEqual({ intervalDays: 90, dueAt: "2026-07-26T15:00:00.000Z" });

    const oneEightyDay = nextExpressionReviewSchedule(card({ id: "mature-90", last_result: "known", last_reviewed_at: "2026-01-28T12:00:00.000Z", interval_days: 90 }), "easy", now);
    expect(oneEightyDay).toEqual({ intervalDays: 180, dueAt: "2026-10-24T15:00:00.000Z" });

    const yearlyDay = nextExpressionReviewSchedule(card({ id: "mature-180", last_result: "known", last_reviewed_at: "2025-10-30T12:00:00.000Z", interval_days: 180 }), "easy", now);
    expect(yearlyDay).toEqual({ intervalDays: 365, dueAt: "2027-04-27T15:00:00.000Z" });

    const capped = nextExpressionReviewSchedule(card({ id: "mature-365", last_result: "known", last_reviewed_at: "2025-04-28T12:00:00.000Z", interval_days: 365 }), "easy", now);
    expect(capped).toEqual({ intervalDays: 365, dueAt: "2027-04-27T15:00:00.000Z" });

    const again = nextExpressionReviewSchedule(card({ id: "again-90", last_result: "known", last_reviewed_at: "2026-01-28T12:00:00.000Z", interval_days: 90 }), "again", now);
    expect(again).toEqual({ intervalDays: 90, dueAt: null });
  });
});
