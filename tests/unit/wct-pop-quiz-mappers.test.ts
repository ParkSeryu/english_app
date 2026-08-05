import { describe, expect, it } from "vitest";

import {
  mapWctPopQuizAttempt,
  mapWctPopQuizResult,
  mapWctPopQuizSummary
} from "@/lib/wct-pop-quiz-store/mappers";

const ATTEMPT_ID = "00000000-0000-4000-8000-000000000001";
const BOOK_ID = "00000000-0000-4000-8000-000000000010";
const STARTED_AT = "2026-08-04T00:00:00.000Z";
const COMPLETED_AT = "2026-08-04T01:00:00.000Z";

function questions(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const dayNumber = index + 1;
    const questionId = `question-${dayNumber}`;
    return {
      sourceQuizSetId: `set-${dayNumber}`,
      dayId: `day-${dayNumber}`,
      dayNumber,
      dayLabel: `Day ${dayNumber}`,
      band: "early",
      question: {
        id: questionId,
        kind: "translation",
        prompt: `Prompt ${dayNumber}`,
        choices: [1, 2, 3, 4].map((choice) => ({
          id: `${questionId}-choice-${choice}`,
          text: `Choice ${choice}`
        })),
        correctChoiceId: `${questionId}-choice-1`,
        explanation: `Explanation ${dayNumber}`
      }
    };
  });
}

function row(questionCount: number) {
  const snapshot = questions(questionCount);
  return {
    attempt_id: ATTEMPT_ID,
    book_id: BOOK_ID,
    seed: "seed-a",
    questions: snapshot,
    answers: snapshot.slice(0, 3).map((item) => ({
      questionId: item.question.id,
      choiceId: item.question.correctChoiceId,
      confirmedAt: STARTED_AT
    })),
    current_index: 3,
    status: "in_progress",
    latest_score: null,
    incorrect_days: [],
    started_at: STARTED_AT,
    completed_at: null
  };
}

describe("WCT Pop Quiz storage mappers", () => {
  it("derives a summary total from its stored question snapshot", () => {
    expect(mapWctPopQuizSummary(row(16))).toMatchObject({
      currentIndex: 3,
      total: 16
    });
  });

  it("accepts legacy 20-question snapshots without Day topics", () => {
    const mapped = mapWctPopQuizAttempt(row(20));

    expect(mapped.questions).toHaveLength(20);
    expect("format" in mapped.questions[0].question).toBe(false);
  });

  it("preserves a dynamic completion total", () => {
    expect(mapWctPopQuizResult({
      score: 26,
      total: 28,
      incorrectDays: [],
      completedAt: COMPLETED_AT
    })).toMatchObject({
      score: 26,
      total: 28
    });
  });

  it.each([
    ["current index", { current_index: 17 }],
    ["answer count", { answers: Array.from({ length: 17 }, () => ({
      questionId: "question-1",
      choiceId: "question-1-choice-1",
      confirmedAt: COMPLETED_AT
    })) }]
  ])("rejects an attempt whose %s exceeds the question count", (_label, changes) => {
    expect(() => mapWctPopQuizAttempt({ ...row(16), ...changes })).toThrow(
      "Invalid stored WCT Pop Quiz attempt"
    );
  });

  it("rejects an attempt whose answer count does not match its current index", () => {
    expect(() => mapWctPopQuizAttempt({ ...row(16), current_index: 4 })).toThrow(
      "Invalid stored WCT Pop Quiz attempt"
    );
  });

  it("rejects an answer that is not part of its immutable question snapshot", () => {
    const stored = row(16);
    stored.answers[0] = {
      ...stored.answers[0],
      choiceId: "missing-choice"
    };

    expect(() => mapWctPopQuizAttempt(stored)).toThrow(
      "Invalid stored WCT Pop Quiz attempt"
    );
  });

  it("rejects completed status without completed score fields", () => {
    expect(() => mapWctPopQuizAttempt({ ...row(16), status: "completed" })).toThrow(
      "Invalid stored WCT Pop Quiz attempt"
    );
  });

  it("rejects a result score above its total", () => {
    expect(() => mapWctPopQuizResult({
      score: 17,
      total: 16,
      incorrectDays: [],
      completedAt: COMPLETED_AT
    })).toThrow("Invalid WCT Pop Quiz result");
  });
});
