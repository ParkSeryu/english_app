import { describe, expect, it } from "vitest";

import { auditStandardWctQuizInventory } from "@/lib/wct/quiz/standard/audit";
import { buildTrueFalseCandidate } from "@/lib/wct/quiz/standard/candidates";
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

function auditRuntimeInput(input: unknown) {
  return auditStandardWctQuizInventory(
    input as readonly WctGeneratedStandardQuizBook[]
  );
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

function replaceTrueFalseState(
  generated: WctGeneratedStandardQuizBook[],
  dayNumber: number,
  state: "O" | "X"
) {
  const set = generated[0].sets[dayNumber - 1];
  const question = set.draft.questions.find((item) => item.format === "true_false")!;
  const candidate = set.candidates.find((item) => item.question.id === question.id)!;
  const entry = set.source.entries.find((item) => (
    item.patternId === candidate.provenance.patternId
    && item.exampleId === candidate.provenance.exampleId
  ))!;
  const replacement = buildTrueFalseCandidate(
    entry,
    state,
    question.kind as "translation" | "pattern"
  )!;
  const correctText = replacement.question.choices.find((choice) => (
    choice.id === replacement.question.correctChoiceId
  ))!.text;
  question.prompt = replacement.question.prompt;
  question.explanation = replacement.question.explanation;
  question.feedback = replacement.question.feedback;
  question.correctChoiceId = question.choices.find((choice) => choice.text === correctText)!.id;
  candidate.provenance = replacement.provenance;
}

function residueTruthRows(
  generated: WctGeneratedStandardQuizBook[],
  residue: number
) {
  return generated[0].sets
    .filter((_set, index) => index % 3 === residue)
    .map((set) => {
      const question = set.draft.questions.find((item) => item.format === "true_false")!;
      return {
        dayNumber: set.source.dayNumber,
        state: question.choices.find((choice) => choice.id === question.correctChoiceId)!
          .text as "O" | "X"
      };
    });
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

  it("independently reports duplicate normalized prompts and question IDs", () => {
    const generated = cloneInventory(inventory());
    const set = generated[0].sets[0];
    const multipleChoice = set.draft.questions.filter((question) => (
      question.format === "multiple_choice"
    ));
    multipleChoice[1].prompt = ` ${multipleChoice[0].prompt.toUpperCase()} `;
    multipleChoice[1].id = multipleChoice[0].id;
    const audit = auditStandardWctQuizInventory(generated);

    expect(audit.failures).toContainEqual(expect.objectContaining({
      level: "prenovice",
      dayNumber: 1,
      questionId: multipleChoice[0].id,
      rule: "prompt_uniqueness"
    }));
    expect(audit.failures).toContainEqual(expect.objectContaining({
      level: "prenovice",
      dayNumber: 1,
      questionId: multipleChoice[0].id,
      rule: "question_id_uniqueness"
    }));
  });

  it("translates complete schema issues into audit failures", () => {
    const generated = cloneInventory(inventory());
    const question = generated[0].sets[0].draft.questions[0];
    question.choices = question.choices.slice(0, 2);

    expectFailure(generated, "prenovice", 1, question.id, "schema_validation");
  });

  it.each([
    ["missing questions", (draft: Record<string, unknown>) => {
      delete draft.questions;
    }],
    ["wrong-typed questions", (draft: Record<string, unknown>) => {
      draft.questions = "five";
    }]
  ])("fails closed when a set has %s and continues the valid inventory", (_name, mutate) => {
    const generated: unknown = cloneInventory(inventory());
    const books = generated as Array<{ sets: Array<{ draft: Record<string, unknown> }> }>;
    mutate(books[0].sets[0].draft);

    expect(() => auditRuntimeInput(generated)).not.toThrow();
    const audit = auditRuntimeInput(generated);
    expect(audit.failures).toContainEqual(expect.objectContaining({
      level: "prenovice",
      dayNumber: 1,
      questionId: "invalid-question",
      rule: "schema_validation"
    }));
    expect(audit.rows).toHaveLength(215);
    expect(audit.rows.some((row) => row.level === "prenovice" && row.dayNumber === 2))
      .toBe(true);
  });

  it("records every available schema issue for one malformed question", () => {
    const generated: unknown = cloneInventory(inventory());
    const books = generated as Array<{
      sets: Array<{ draft: { questions: Array<Record<string, unknown>> } }>;
    }>;
    const question = books[0].sets[0].draft.questions[0];
    const questionId = question.id as string;
    delete question.prompt;
    delete question.choices;
    delete question.explanation;

    const audit = auditRuntimeInput(generated);
    expect(audit.failures.filter((failure) => (
      failure.level === "prenovice"
      && failure.dayNumber === 1
      && failure.questionId === questionId
      && failure.rule === "schema_validation"
    )).length).toBeGreaterThanOrEqual(3);
  });

  it.each([
    ["missing prompt", (question: Record<string, unknown>) => {
      delete question.prompt;
    }],
    ["wrong-typed prompt", (question: Record<string, unknown>) => {
      question.prompt = 7;
    }],
    ["missing choices", (question: Record<string, unknown>) => {
      delete question.choices;
    }],
    ["wrong-typed choices", (question: Record<string, unknown>) => {
      question.choices = "O/X";
    }],
    ["missing explanation", (question: Record<string, unknown>) => {
      delete question.explanation;
    }],
    ["wrong-typed explanation", (question: Record<string, unknown>) => {
      question.explanation = false;
    }]
  ])("fails closed on a question with %s", (_name, mutate) => {
    const generated: unknown = cloneInventory(inventory());
    const books = generated as Array<{
      sets: Array<{ draft: { questions: Array<Record<string, unknown>> } }>;
    }>;
    const question = books[0].sets[0].draft.questions[0];
    const questionId = question.id as string;
    mutate(question);

    expect(() => auditRuntimeInput(generated)).not.toThrow();
    const audit = auditRuntimeInput(generated);
    expect(audit.failures).toContainEqual(expect.objectContaining({
      level: "prenovice",
      dayNumber: 1,
      questionId,
      rule: "schema_validation"
    }));
    expect(audit.rows.some((row) => row.level === "prenovice" && row.dayNumber === 2))
      .toBe(true);
  });

  it("requires exact MC and O/X prompt derivation without foreign affixes", () => {
    const generated = cloneInventory(inventory());
    const set = generated[0].sets[0];
    const multipleChoice = set.draft.questions.find((question) => (
      question.format === "multiple_choice"
    ))!;
    const trueFalseOSet = generated[0].sets.find((item) => item.draft.questions.some(
      (question) => question.format === "true_false"
        && question.choices.find((choice) => choice.id === question.correctChoiceId)?.text === "O"
    ))!;
    const trueFalseXSet = generated[0].sets.find((item) => item.draft.questions.some(
      (question) => question.format === "true_false"
        && question.choices.find((choice) => choice.id === question.correctChoiceId)?.text === "X"
    ))!;
    const trueFalseO = trueFalseOSet.draft.questions.find((question) => (
      question.format === "true_false"
    ))!;
    const trueFalseX = trueFalseXSet.draft.questions.find((question) => (
      question.format === "true_false"
    ))!;
    multipleChoice.prompt = `Foreign ${multipleChoice.prompt}`;
    trueFalseO.prompt = `Foreign ${trueFalseO.prompt}`;
    trueFalseX.prompt = `${trueFalseX.prompt} suffix`;
    const audit = auditStandardWctQuizInventory(generated);

    for (const [targetSet, question] of [
      [set, multipleChoice],
      [trueFalseOSet, trueFalseO],
      [trueFalseXSet, trueFalseX]
    ] as const) {
      expect(audit.failures).toContainEqual(expect.objectContaining({
        level: "prenovice",
        dayNumber: targetSet.source.dayNumber,
        questionId: question.id,
        rule: "prompt_provenance"
      }));
    }
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

  it("hashes complete displayed questions, feedback, and provenance", () => {
    const good = inventory();
    const baseline = auditStandardWctQuizInventory(good).questionArtifactHash;
    const explanationOnly = cloneInventory(good);
    explanationOnly[0].sets[0].draft.questions[0].explanation += " Extra explanation.";
    const feedbackOnly = cloneInventory(good);
    feedbackOnly[0].sets[0].draft.questions[0].feedback!.correctSentence += " altered";
    const provenanceOnly = cloneInventory(good);
    const provenanceCandidate = provenanceOnly[0].sets[0].candidates.find((candidate) => (
      candidate.provenance.choiceEvidence.some((evidence) => evidence.role === "distractor")
    ))!;
    provenanceCandidate.provenance.choiceEvidence.find((evidence) => (
      evidence.role === "distractor"
    ))!.role = "correct";

    expect(auditStandardWctQuizInventory(explanationOnly).questionArtifactHash).not.toBe(baseline);
    expect(auditStandardWctQuizInventory(feedbackOnly).questionArtifactHash).not.toBe(baseline);
    expect(auditStandardWctQuizInventory(provenanceOnly).questionArtifactHash).not.toBe(baseline);
  });

  it("rejects a missing complete provenance candidate", () => {
    const generated = cloneInventory(inventory());
    const set = generated[0].sets[0];
    const question = set.draft.questions[0];
    set.candidates = set.candidates.filter((candidate) => (
      candidate.question.id !== question.id
    ));

    expectFailure(generated, "prenovice", 1, question.id, "provenance_presence");
  });

  it("totally orders duplicate source keys and rejects them independent of input order", () => {
    const forward = cloneInventory(inventory());
    const source = forward[0].sets[0].source;
    const original = source.entries[0];
    const duplicate = {
      ...original,
      englishText: original.englishText.replace("today", "outside")
    };
    source.entries = [original, duplicate, ...source.entries.slice(1)];
    const reverse = cloneInventory(forward);
    reverse[0].sets[0].source.entries = [
      duplicate,
      original,
      ...source.entries.slice(2)
    ];
    const first = auditStandardWctQuizInventory(forward);
    const second = auditStandardWctQuizInventory(reverse);

    expect(first.failures).toContainEqual(expect.objectContaining({
      level: "prenovice",
      dayNumber: 1,
      rule: "source_identity_uniqueness"
    }));
    expect(second.failures).toContainEqual(expect.objectContaining({
      level: "prenovice",
      dayNumber: 1,
      rule: "source_identity_uniqueness"
    }));
    expect(second.sourceInventoryHash).toBe(first.sourceInventoryHash);
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

  it("release-blocks count-preserving corruption of residue alternation", () => {
    const generated = cloneInventory(inventory());
    const group = residueTruthRows(generated, 0);
    const left = group[0];
    const right = group[1];
    replaceTrueFalseState(generated, left.dayNumber, right.state);
    replaceTrueFalseState(generated, right.dayNumber, left.state);
    const audit = auditStandardWctQuizInventory(generated);

    expect(audit.summary.prenoviceTrue).toBe(8);
    expect(audit.summary.prenoviceFalse).toBe(8);
    expect(audit.failures).toContainEqual(expect.objectContaining({
      level: "prenovice",
      rule: "true_false_alternation"
    }));
  });
});
