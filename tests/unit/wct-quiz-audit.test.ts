import { describe, expect, it } from "vitest";

import { auditStandardWctQuizInventory } from "@/lib/wct/quiz/standard/audit";
import { generateStandardWctQuizBook } from "@/lib/wct/quiz/standard/generator";
import type { WctGeneratedStandardQuizBook } from "@/lib/wct/quiz/standard/types";
import type { WctBook, WctDay, WctPattern } from "@/lib/wct/types";

function pattern(level: string, dayNumber: number, index: number): WctPattern {
  const suffix = `${level}-${dayNumber}-${index}`;
  return {
    id: `pattern-${suffix}`,
    patternText: `can + base verb (${dayNumber}-${index})`,
    meaningKo: `가능 표현 ${dayNumber}-${index}`,
    usageNote: "Use can before a base verb.",
    usageSource: "book",
    sourcePage: null,
    sourceNeedsReview: false,
    sortOrder: index,
    examples: [{
      id: `example-${suffix}`,
      englishText: `I can finish task ${dayNumber}-${index} today.`,
      meaningKo: `나는 오늘 과제 ${dayNumber}-${index}를 끝낼 수 있다.`,
      sourcePage: null,
      sourceNeedsReview: false,
      sortOrder: 1
    }]
  };
}

function bookFixture(level: "prenovice" | "novice") {
  const dayCount = level === "prenovice" ? 16 : 28;
  const bookId = `audit-${level}`;
  const days: WctDay[] = Array.from({ length: dayCount }, (_, index) => {
    const dayNumber = index + 1;
    return {
      id: `${bookId}-source-${dayNumber}`,
      bookId,
      dayNumber,
      shortLabel: `문장 연습 ${dayNumber}`,
      displayLabel: `수업 ${dayNumber}`,
      sourcePageStart: null,
      sourcePageEnd: null,
      sourceNeedsReview: false,
      learningSummary: null,
      concepts: [],
      patterns: Array.from({ length: 5 }, (_item, patternIndex) => (
        pattern(level, dayNumber, patternIndex)
      )),
      importantNotes: [],
      practicePrompts: []
    };
  });
  const label = level === "prenovice" ? "Prenovice" : "Novice";
  const book: WctBook = {
    id: bookId,
    title: `WCT Audit ${label}`,
    levelLabel: level === "prenovice" ? "Pre Novice" : "Novice",
    dayCount,
    sortOrder: level === "prenovice" ? 1 : 2,
    days: days.map(({ learningSummary: _learningSummary, concepts: _concepts,
      patterns: _patterns, importantNotes: _importantNotes,
      practicePrompts: _practicePrompts, ...summary }) => summary)
  };
  return generateStandardWctQuizBook(book, days);
}

function inventory() {
  return [bookFixture("prenovice"), bookFixture("novice")];
}

function cloneInventory(input: readonly WctGeneratedStandardQuizBook[]) {
  return structuredClone(input) as WctGeneratedStandardQuizBook[];
}

function expectFailure(
  generated: WctGeneratedStandardQuizBook[],
  level: "prenovice" | "novice",
  dayNumber: number,
  questionId: string,
  rule: string
) {
  const audit = auditStandardWctQuizInventory(generated);
  expect(audit.ok).toBe(false);
  expect(audit.failures).toContainEqual(expect.objectContaining({
    level,
    dayNumber,
    questionId,
    rule
  }));
}

describe("standard WCT release audit", () => {
  it("emits the complete canonical 44-Day/220-question inventory and stable hashes", () => {
    const generated = inventory();
    const audit = auditStandardWctQuizInventory(generated);
    const repeated = auditStandardWctQuizInventory(generated);

    expect(audit.ok).toBe(true);
    expect(audit.failures).toEqual([]);
    expect(audit.summary).toEqual({
      books: 2,
      days: 44,
      questions: 220,
      prenoviceTrue: 8,
      prenoviceFalse: 8,
      noviceTrue: 14,
      noviceFalse: 14
    });
    expect(audit.rows).toHaveLength(220);
    expect(audit.sourceInventory).toHaveLength(220);
    expect(audit.sourceInventoryHash).toMatch(/^[a-f0-9]{64}$/);
    expect(audit.questionArtifactHash).toMatch(/^[a-f0-9]{64}$/);
    expect(repeated).toEqual(audit);
    expect(audit.rows[0]).toEqual(expect.objectContaining({
      level: "prenovice",
      dayNumber: 1,
      topic: expect.any(String),
      prompt: expect.any(String),
      choices: expect.any(Array),
      correctAnswer: expect.any(String),
      patternId: expect.any(String),
      exampleId: expect.any(String),
      sourceSentence: expect.any(String),
      pattern: expect.any(String),
      reason: expect.any(String)
    }));
  });

  it("reports a distractor mutation that lacks exact evidence", () => {
    const generated = cloneInventory(inventory());
    const set = generated[0].sets[0];
    const candidate = set.candidates.find((item) => (
      item.question.format === "multiple_choice"
    ))!;
    const evidence = candidate.provenance.choiceEvidence.find((item) => (
      item.role === "distractor"
    ))!;
    delete evidence.mutation;

    expectFailure(generated, "prenovice", 1, candidate.question.id, "mutation_evidence");
  });

  it("reports learner-facing Day metadata from the actual displayed prompt", () => {
    const generated = cloneInventory(inventory());
    const set = generated[0].sets[1];
    const question = set.draft.questions[0];
    question.prompt = `Day 2 ${question.prompt}`;

    expectFailure(generated, "prenovice", 2, question.id, "forbidden_text");
  });

  it("reports duplicate normalized displayed choices", () => {
    const generated = cloneInventory(inventory());
    const set = generated[0].sets[0];
    const question = set.draft.questions.find((item) => (
      item.format === "multiple_choice"
    ))!;
    question.choices[1].text = ` ${question.choices[0].text.toUpperCase()} `;

    expectFailure(
      generated,
      "prenovice",
      1,
      question.id,
      "normalized_choice_uniqueness"
    );
  });

  it("reports a displayed blank that cannot reconstruct the source sentence", () => {
    const generated = cloneInventory(inventory());
    const set = generated[0].sets[0];
    const question = set.draft.questions.find((item) => item.format === "fill_blank")!;
    question.prompt = "Broken ____ sentence.";

    expectFailure(generated, "prenovice", 1, question.id, "blank_reconstruction");
  });

  it("reports source-declared evidence that marks two answers correct", () => {
    const generated = cloneInventory(inventory());
    const set = generated[0].sets[0];
    const candidate = set.candidates.find((item) => (
      item.question.format === "multiple_choice"
    ))!;
    const distractor = candidate.provenance.choiceEvidence.find((item) => (
      item.role === "distractor"
    ))!;
    distractor.role = "correct";

    expectFailure(
      generated,
      "prenovice",
      1,
      candidate.question.id,
      "source_declared_answer_uniqueness"
    );
  });

  it("release-blocks a corrupted whole-book O/X allocation", () => {
    const generated = cloneInventory(inventory());
    const set = generated[0].sets.find((item) => {
      const candidate = item.candidates.find((question) => (
        question.question.format === "true_false"
      ));
      const correct = candidate?.question.choices.find((choice) => (
        choice.id === candidate.question.correctChoiceId
      ));
      return correct?.text === "X";
    })!;
    const question = set.draft.questions.find((item) => item.format === "true_false")!;
    question.correctChoiceId = question.choices.find((choice) => choice.text === "O")!.id;

    expectFailure(
      generated,
      "prenovice",
      set.source.dayNumber,
      question.id,
      "true_false_balance"
    );
  });
});
