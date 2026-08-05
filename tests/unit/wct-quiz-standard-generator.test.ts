import { describe, expect, it } from "vitest";

import { stableStringify } from "@/lib/wct/normalization";
import {
  buildFillBlankCandidate,
  buildMultipleChoiceCandidate,
  buildTrueFalseCandidate
} from "@/lib/wct/quiz/standard/candidates";
import {
  generateStandardWctQuizBook
} from "@/lib/wct/quiz/standard/generator";
import {
  STANDARD_WCT_DAY_OVERRIDES,
  type WctStandardDayOverride
} from "@/lib/wct/quiz/standard/overrides";
import { buildStandardWctQuizSource } from "@/lib/wct/quiz/standard/source";
import type {
  WctStandardQuestionCandidate,
  WctStandardQuizSource
} from "@/lib/wct/quiz/standard/types";
import { wctStandardQuizSetCreateSchema } from "@/lib/wct/quiz/validation";
import type { WctBook, WctDay, WctPattern } from "@/lib/wct/types";

const FORMAT_COUNTS = {
  multiple_choice: 2,
  fill_blank: 2,
  true_false: 1
};
const KIND_COUNTS = { translation: 3, pattern: 2 };

function countBy(
  items: readonly { format?: string; kind: string }[],
  key: "format" | "kind"
) {
  const values = items.map((item) => item[key]).filter(
    (value): value is string => value !== undefined
  );
  return Object.fromEntries(
    [...new Set(values)]
      .map((value) => [value, values.filter((item) => item === value).length])
  );
}

function pattern(dayNumber: number, index: number): WctPattern {
  const letter = String.fromCharCode(65 + index);
  return {
    id: `pattern-${dayNumber}-${index}`,
    patternText: `can + base verb (${letter})`,
    meaningKo: `가능 표현 ${dayNumber}-${letter}`,
    usageNote: "Use can before a base verb.",
    usageSource: "book",
    sourcePage: null,
    sourceNeedsReview: false,
    sortOrder: index,
    examples: [{
      id: `example-${dayNumber}-${index}`,
      englishText: `I can finish task ${dayNumber}-${letter} today.`,
      meaningKo: `나는 오늘 과제 ${dayNumber}-${letter}를 끝낼 수 있다.`,
      sourcePage: null,
      sourceNeedsReview: false,
      sortOrder: 1
    }]
  };
}

function detailedDay(bookId: string, dayNumber: number): WctDay {
  return {
    id: `${bookId}-source-${dayNumber}`,
    bookId,
    dayNumber,
    shortLabel: `가능성 연습 ${dayNumber}`,
    displayLabel: `수업 ${dayNumber}`,
    sourcePageStart: null,
    sourcePageEnd: null,
    sourceNeedsReview: false,
    learningSummary: null,
    concepts: [],
    patterns: Array.from({ length: 5 }, (_, index) => pattern(dayNumber, index)),
    importantNotes: [],
    practicePrompts: []
  };
}

function fixture(level: "prenovice" | "novice") {
  const count = level === "prenovice" ? 16 : 28;
  const bookId = `book-${level}`;
  const days = Array.from({ length: count }, (_, index) => (
    detailedDay(bookId, index + 1)
  ));
  const titleLevel = level === "prenovice" ? "Prenovice" : "Novice";
  const labelLevel = level === "prenovice" ? "Pre Novice" : "Novice";
  const book: WctBook = {
    id: bookId,
    title: `WCT Pattern Book ${titleLevel}`,
    levelLabel: labelLevel,
    dayCount: count,
    sortOrder: level === "prenovice" ? 1 : 2,
    days: days.map(({ learningSummary: _learningSummary, concepts: _concepts,
      patterns: _patterns, importantNotes: _importantNotes,
      practicePrompts: _practicePrompts, ...summary }) => summary)
  };
  return { book, days };
}

function hasAdjacentEqual(items: readonly string[]) {
  return items.some((item, index) => index > 0 && item === items[index - 1]);
}

function trueFalseState(candidate: WctStandardQuestionCandidate) {
  const correct = candidate.question.choices.find(
    (choice) => choice.id === candidate.question.correctChoiceId
  );
  return correct?.text;
}

function residueStates(
  generated: ReturnType<typeof generateStandardWctQuizBook>,
  residue: number
) {
  return generated.sets
    .filter((_set, index) => index % 3 === residue)
    .map((set) => trueFalseState(set.candidates.find((candidate) => (
      candidate.question.format === "true_false"
    ))!));
}

function alternates(states: readonly (string | undefined)[]) {
  return states.every((state, index) => index === 0 || state !== states[index - 1]);
}

function manualOOverride(source: WctStandardQuizSource) {
  const candidates = [
    buildMultipleChoiceCandidate(source.entries[0], "translation"),
    buildFillBlankCandidate(source.entries[1], "translation"),
    buildMultipleChoiceCandidate(source.entries[0], "pattern"),
    buildTrueFalseCandidate(source.entries[2], "O", "pattern"),
    buildFillBlankCandidate(source.entries[3], "translation")
  ];
  expect(candidates.every(Boolean)).toBe(true);
  return candidates as WctStandardQuestionCandidate[];
}

describe("standard WCT quiz book generation", () => {
  it.each(["prenovice", "novice"] as const)(
    "composes every %s Day as an exact schema-valid five-question set",
    (level) => {
      const { book, days } = fixture(level);
      const generated = generateStandardWctQuizBook(book, days);

      expect(generated.sets).toHaveLength(level === "prenovice" ? 16 : 28);
      for (const set of generated.sets) {
        expect(countBy(set.draft.questions, "format")).toEqual(FORMAT_COUNTS);
        expect(countBy(set.draft.questions, "kind")).toEqual(KIND_COUNTS);
        expect(hasAdjacentEqual(set.draft.questions.map((question) => question.format!)))
          .toBe(false);
        expect(new Set(set.draft.questions.map((question) => question.prompt)).size).toBe(5);
        expect(new Set(set.draft.questions.map((question) => question.id)).size).toBe(5);
        expect(wctStandardQuizSetCreateSchema.safeParse(set.draft).success).toBe(true);
      }
    }
  );

  it("rejects incomplete, duplicate, extra, and wrong-sized standard inventories", () => {
    const { book, days } = fixture("prenovice");

    expect(() => generateStandardWctQuizBook(book, days.slice(0, 15)))
      .toThrow("WCT v2 requires complete Day numbers 1-16");
    expect(() => generateStandardWctQuizBook(book, [days[0], days[0], ...days.slice(2)]))
      .toThrow("WCT v2 requires complete Day numbers 1-16");
    expect(() => generateStandardWctQuizBook(book, [...days, detailedDay(book.id, 17)]))
      .toThrow("WCT v2 requires complete Day numbers 1-16");
    expect(() => generateStandardWctQuizBook({ ...book, dayCount: 15 }, days))
      .toThrow("WCT v2 Prenovice book must contain exactly 16 Days");

    const novice = fixture("novice");
    expect(() => generateStandardWctQuizBook(
      { ...novice.book, dayCount: 27 },
      novice.days
    )).toThrow("WCT v2 Novice book must contain exactly 28 Days");
  });

  it("is byte-deterministic, v2-ID isolated, varied, and local to the changed Day", () => {
    const { book, days } = fixture("prenovice");
    const first = generateStandardWctQuizBook(book, days);
    const repeated = generateStandardWctQuizBook(book, days);
    const baseCandidateIds = first.sets.flatMap((set) => set.source.entries.flatMap((entry) => [
      buildMultipleChoiceCandidate(entry, "translation")?.question.id,
      buildFillBlankCandidate(entry, "translation")?.question.id,
      buildTrueFalseCandidate(entry, "O", "pattern")?.question.id,
      buildTrueFalseCandidate(entry, "X", "pattern")?.question.id
    ].filter((id): id is string => Boolean(id))));

    expect(stableStringify(repeated)).toBe(stableStringify(first));
    expect(first.sets.flatMap((set) => set.draft.questions).every(
      (question) => question.id.startsWith("qv2-") && !baseCandidateIds.includes(question.id)
    )).toBe(true);
    expect(new Set(first.sets.map((set) => (
      set.draft.questions.map((question) => question.format).join(",")
    ))).size).toBeGreaterThan(1);
    expect(new Set(first.sets.map((set) => (
      set.draft.questions.map((question) => question.kind).join(",")
    ))).size).toBeGreaterThan(1);

    const changedDays = days.map((day) => day.dayNumber === 2
      ? {
          ...day,
          shortLabel: `${day.shortLabel} 변경`,
          patterns: day.patterns.map((item, index) => index === 0
            ? {
                ...item,
                examples: item.examples.map((example) => ({
                  ...example,
                  englishText: example.englishText.replace("today", "outside")
                }))
              }
            : item)
        }
      : day);
    const changed = generateStandardWctQuizBook(book, changedDays);

    expect(changed.sets[0]).toEqual(first.sets[0]);
    expect(changed.sets[1]).not.toEqual(first.sets[1]);
    expect(changed.sets.slice(2)).toEqual(first.sets.slice(2));
  });

  it("changes every Day question ID when only the source hash changes", () => {
    const { book, days } = fixture("prenovice");
    const original = generateStandardWctQuizBook(book, days);
    const topicOnly = days.map((day) => day.dayNumber === 2
      ? { ...day, shortLabel: `${day.shortLabel} 새 주제` }
      : day);
    const changed = generateStandardWctQuizBook(book, topicOnly);

    expect(changed.sets[1].source.sourceHash).not.toBe(original.sets[1].source.sourceHash);
    expect(changed.sets[1].source.entries).toEqual(original.sets[1].source.entries);
    expect(changed.sets[1].draft.questions.map((question) => question.id))
      .not.toEqual(original.sets[1].draft.questions.map((question) => question.id));
    expect(new Set([
      ...changed.sets[1].draft.questions.map((question) => question.id),
      ...original.sets[1].draft.questions.map((question) => question.id)
    ]).size).toBe(10);
  });

  it.each(["prenovice", "novice"] as const)(
    "allocates exact and residue-balanced alternating O/X states for %s",
    (level) => {
      const { book, days } = fixture(level);
      const generated = generateStandardWctQuizBook(book, days);
      const states = generated.sets.map((set) => trueFalseState(
        set.candidates.find((candidate) => candidate.question.format === "true_false")!
      ));
      const half = level === "prenovice" ? 8 : 14;

      expect(states.filter((state) => state === "O")).toHaveLength(half);
      expect(states.filter((state) => state === "X")).toHaveLength(half);
      for (let residue = 0; residue < 3; residue += 1) {
        const group = states.filter((_state, index) => index % 3 === residue);
        expect(group.every((state, index) => index === 0 || state !== group[index - 1]))
          .toBe(true);
        expect(Math.abs(
          group.filter((state) => state === "O").length
          - group.filter((state) => state === "X").length
        )).toBeLessThanOrEqual(1);
      }
    }
  );

  it("swaps an O-only override within its residue and keeps reused source IDs collision-safe", () => {
    const { book, days } = fixture("prenovice");
    const source = buildStandardWctQuizSource(book, days[2]);
    const override: WctStandardDayOverride = {
      level: "prenovice",
      dayNumber: 3,
      expectedSourceHash: source.sourceHash,
      questions: manualOOverride(source)
    };
    const generated = generateStandardWctQuizBook(book, days, [override]);
    const day3 = generated.sets[2];
    const day6 = generated.sets[5];
    const day3TrueFalse = day3.candidates.find(
      (candidate) => candidate.question.format === "true_false"
    )!;
    const day6TrueFalse = day6.candidates.find(
      (candidate) => candidate.question.format === "true_false"
    )!;
    const repeatedSource = day3.candidates.filter((candidate) => (
      candidate.provenance.exampleId === source.entries[0].exampleId
      && candidate.question.format === "multiple_choice"
    ));

    expect(trueFalseState(day3TrueFalse)).toBe("O");
    expect(trueFalseState(day6TrueFalse)).toBe("X");
    expect(residueStates(generated, 2)).toEqual(["O", "X", "O", "X", "O"]);
    expect(alternates(residueStates(generated, 2))).toBe(true);
    expect(repeatedSource).toHaveLength(2);
    expect(new Set(repeatedSource.map((candidate) => candidate.question.id)).size).toBe(2);
    expect(new Set(day3.draft.questions.flatMap((question) => (
      question.choices.map((choice) => choice.id)
    ))).size).toBe(day3.draft.questions.reduce(
      (total, question) => total + question.choices.length,
      0
    ));
  });

  it("chooses compatible alternating phases for multiple fixed O Days", () => {
    const { book, days } = fixture("prenovice");
    const overrides = [3, 9].map((dayNumber): WctStandardDayOverride => {
      const source = buildStandardWctQuizSource(book, days[dayNumber - 1]);
      return {
        level: "prenovice",
        dayNumber,
        expectedSourceHash: source.sourceHash,
        questions: manualOOverride(source)
      };
    });
    const generated = generateStandardWctQuizBook(book, days, overrides);
    const allStates = generated.sets.map((set) => trueFalseState(set.candidates.find(
      (candidate) => candidate.question.format === "true_false"
    )!));

    expect(residueStates(generated, 2)).toEqual(["O", "X", "O", "X", "O"]);
    expect([0, 1, 2].every((residue) => alternates(residueStates(generated, residue))))
      .toBe(true);
    expect(allStates.filter((state) => state === "O")).toHaveLength(8);
    expect(allStates.filter((state) => state === "X")).toHaveLength(8);
  });

  it("fails closed on incompatible fixed truth states in one residue", () => {
    const { book, days } = fixture("prenovice");
    const overrides = [3, 6].map((dayNumber): WctStandardDayOverride => {
      const source = buildStandardWctQuizSource(book, days[dayNumber - 1]);
      return {
        level: "prenovice",
        dayNumber,
        expectedSourceHash: source.sourceHash,
        questions: manualOOverride(source)
      };
    });

    expect(() => generateStandardWctQuizBook(book, days, overrides))
      .toThrow(/WCT v2 Day (3|6) cannot satisfy alternating O\/X allocation/u);
  });

  it("keeps overrides empty by default and rejects stale or foreign full-Day overrides", () => {
    const { book, days } = fixture("prenovice");
    const source = buildStandardWctQuizSource(book, days[6]);
    const questions = manualOOverride(source);

    expect(STANDARD_WCT_DAY_OVERRIDES).toEqual([]);
    expect(() => generateStandardWctQuizBook(book, days, [{
      level: "prenovice",
      dayNumber: 7,
      expectedSourceHash: "0".repeat(64),
      questions
    }])).toThrow("WCT v2 override source hash mismatch");

    const foreignPattern = questions.map((candidate, index) => index === 0
      ? {
          ...candidate,
          question: {
            ...candidate.question,
            feedback: { ...candidate.question.feedback, pattern: "foreign pattern" }
          }
        }
      : candidate);
    expect(() => generateStandardWctQuizBook(book, days, [{
      level: "prenovice",
      dayNumber: 7,
      expectedSourceHash: source.sourceHash,
      questions: foreignPattern
    }])).toThrow("WCT v2 override target source mismatch");

    const foreignAnswer = questions.map((candidate, index) => index === 0
      ? {
          ...candidate,
          question: {
            ...candidate.question,
            choices: candidate.question.choices.map((choice) => (
              choice.id === candidate.question.correctChoiceId
                ? { ...choice, text: "Foreign answer." }
                : choice
            ))
          }
        }
      : candidate);
    expect(() => generateStandardWctQuizBook(book, days, [{
      level: "prenovice",
      dayNumber: 7,
      expectedSourceHash: source.sourceHash,
      questions: foreignAnswer
    }])).toThrow("WCT v2 override target source mismatch");

    expect(() => generateStandardWctQuizBook(book, days, [{
      level: "prenovice",
      dayNumber: 7,
      expectedSourceHash: source.sourceHash,
      questions: questions.slice(0, 4)
    }])).toThrow("WCT v2 override target source mismatch");
  });

  it("deterministically rejects duplicate source identities in either input order", () => {
    const { book, days } = fixture("prenovice");
    const target = days[0];
    const duplicate = {
      ...target.patterns[0],
      examples: target.patterns[0].examples.map((example) => ({
        ...example,
        englishText: example.englishText.replace("today", "outside")
      }))
    };
    const forward = [target.patterns[0], duplicate, ...target.patterns.slice(1)];
    const reverse = [duplicate, target.patterns[0], ...target.patterns.slice(1)];

    for (const patterns of [forward, reverse]) {
      expect(() => generateStandardWctQuizBook(book, [
        { ...target, patterns },
        ...days.slice(1)
      ])).toThrow("WCT v2 Day 1 has duplicate source identities");
    }
  });
});
