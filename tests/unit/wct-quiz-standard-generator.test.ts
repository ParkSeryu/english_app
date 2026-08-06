import { describe, expect, it } from "vitest";

import { stableStringify } from "@/lib/wct/normalization";
import {
  auditStandardQuestionCandidate,
  buildFillBlankCandidate,
  buildMultipleChoiceCandidate,
  buildTrueFalseCandidate
} from "@/lib/wct/quiz/standard/candidates";
import {
  generateStandardWctQuizBook
} from "@/lib/wct/quiz/standard/generator";
import {
  eligibleStandardExampleIds,
  hasUniqueStandardLearningTargets
} from "@/lib/wct/quiz/standard/diversity";
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

function productionNoviceDayOne(bookId: string): WctDay {
  const patternRows = [{
    id: "289966a2-201d-4070-a5e5-8d0028957132",
    patternText: "do/does/did + 동사원형",
    meaningKo: "일반동사의 현재·과거 질문",
    examples: [
      ["0133dd4f-9e94-4db7-aad5-db580c4ed3a0", "Didn't you watch TV?", "TV를 보지 않았나요?"],
      ["1907c995-4dd5-46a8-ba34-1e3aa5937ffd", "Did you wash?", "씻었나요?"]
    ]
  }, {
    id: "8f09acbf-d7ab-4766-a272-cbdf0df7b749",
    patternText: "be + -ing",
    meaningKo: "현재·과거 진행형",
    examples: [
      ["a862a168-cedc-43aa-9518-f11ade12d907", "Are you meeting your friend?", "친구를 만나고 있나요?"],
      ["d227f812-0231-4093-aaf3-7c366ab4729b", "Were you walking?", "걷고 있었나요?"]
    ]
  }, {
    id: "c13d6c62-3580-48e4-b31c-a95fcb67de02",
    patternText: "can/might/should + 동사원형",
    meaningKo: "가능·추측·조언",
    examples: [
      ["4b15df3d-4f52-455e-9946-9a390eba3447", "He might come.", "그가 올지도 몰라요."],
      ["23bf6904-95d1-4ff2-81e6-c78c1e409bbd", "You shouldn't touch it.", "그것을 만지면 안 돼요."]
    ]
  }] as const;

  return {
    id: "e3f9a813-d116-4fe0-a005-d079020f3a53",
    bookId,
    dayNumber: 1,
    shortLabel: "시제·조동사 복습",
    displayLabel: "수업 1",
    sourcePageStart: null,
    sourcePageEnd: null,
    sourceNeedsReview: false,
    learningSummary: null,
    concepts: [],
    patterns: patternRows.map((row, patternIndex) => ({
      id: row.id,
      patternText: row.patternText,
      meaningKo: row.meaningKo,
      usageNote: null,
      usageSource: "book" as const,
      sourcePage: null,
      sourceNeedsReview: false,
      sortOrder: patternIndex,
      examples: row.examples.map(([id, englishText, meaningKo], exampleIndex) => ({
        id,
        englishText,
        meaningKo,
        sourcePage: null,
        sourceNeedsReview: false,
        sortOrder: exampleIndex
      }))
    })),
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
    buildMultipleChoiceCandidate(source.entries[2], "pattern"),
    buildTrueFalseCandidate(source.entries[3], "O", "pattern"),
    buildFillBlankCandidate(source.entries[4], "translation")
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
        expect(new Set(set.candidates.map((candidate) => candidate.provenance.exampleId)).size)
          .toBe(5);
        expect(wctStandardQuizSetCreateSchema.safeParse(set.draft).success).toBe(true);
      }
    }
  );

  it("rejects incomplete, duplicate, extra, and wrong-sized standard inventories", () => {
    const { book, days } = fixture("prenovice");

    expect(() => generateStandardWctQuizBook(book, days.slice(0, 15)))
      .toThrow("WCT v2 requires exactly 16 unique positive Day numbers");
    expect(() => generateStandardWctQuizBook(book, [days[0], days[0], ...days.slice(2)]))
      .toThrow("WCT v2 requires exactly 16 unique positive Day numbers");
    expect(() => generateStandardWctQuizBook(book, [...days, detailedDay(book.id, 17)]))
      .toThrow("WCT v2 requires exactly 16 unique positive Day numbers");
    expect(() => generateStandardWctQuizBook({ ...book, dayCount: 15 }, days))
      .toThrow("WCT v2 Prenovice book must contain exactly 16 Days");

    const novice = fixture("novice");
    expect(() => generateStandardWctQuizBook(
      { ...novice.book, dayCount: 27 },
      novice.days
    )).toThrow("WCT v2 Novice book must contain exactly 28 Days");
  });

  it("accepts the exact ordered 28-Day Novice curriculum even when source Day numbers have gaps", () => {
    const { book, days } = fixture("novice");
    const productionDayNumbers = [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
      13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
      27, 28, 29, 30, 31
    ];
    const gappedDays = days.map((sourceDay, index) => ({
      ...sourceDay,
      id: `${book.id}-source-${productionDayNumbers[index]}`,
      dayNumber: productionDayNumbers[index],
      patterns: sourceDay.patterns.map((sourcePattern) => ({
        ...sourcePattern,
        id: `${sourcePattern.id}-gapped`,
        examples: sourcePattern.examples.map((example) => ({
          ...example,
          id: `${example.id}-gapped`
        }))
      }))
    }));

    const generated = generateStandardWctQuizBook(book, gappedDays);

    expect(generated.sets.map((set) => set.source.dayNumber))
      .toEqual(productionDayNumbers);
  });

  it("backtracks across slot schedules to compose a sparse real-shaped Wh-question Day", () => {
    const { book, days } = fixture("novice");
    const sparseDay: WctDay = {
      ...days[6],
      shortLabel: "의문사+일반 의문문",
      patterns: [{
        id: "pattern-novice-7-wh",
        patternText: "Wh- + be/조동사 + 주어 ...?",
        meaningKo: "의문사 의문문",
        usageNote: "Wh- 뒤에 조동사와 주어 순서를 사용한다.",
        usageSource: "book",
        sourcePage: null,
        sourceNeedsReview: false,
        sortOrder: 0,
        examples: [{
          id: "example-novice-7-wh",
          englishText: "Why do you study English?",
          meaningKo: "왜 영어를 공부하나요?",
          sourcePage: null,
          sourceNeedsReview: false,
          sortOrder: 0
        }]
      }]
    };

    const generated = generateStandardWctQuizBook(book, [
      ...days.slice(0, 6),
      sparseDay,
      ...days.slice(7)
    ]);
    const questions = generated.sets[6].draft.questions;

    expect(countBy(questions, "format")).toEqual(FORMAT_COUNTS);
    expect(countBy(questions, "kind")).toEqual(KIND_COUNTS);
    expect(new Set(questions.map((question) => question.prompt)).size).toBe(5);
    expect(hasAdjacentEqual(questions.map((question) => question.format!))).toBe(false);
    expect(new Set(generated.sets[6].candidates.map((candidate) => (
      candidate.provenance.exampleId
    )))).toEqual(new Set(["example-novice-7-wh"]));
    const patternFamilies = generated.sets[6].candidates
      .filter((candidate) => candidate.question.kind === "pattern")
      .map((candidate) => candidate.provenance.statementMutation
        ?? candidate.provenance.choiceEvidence.find((evidence) => evidence.mutation)?.mutation)
      .map((mutation) => mutation?.ruleFamily);
    expect(patternFamilies).toHaveLength(2);
    expect(patternFamilies).not.toEqual(expect.arrayContaining([
      "wh_question_word", "wh_question_subject"
    ]));
    expect(patternFamilies).toContain("direct_question_order");
    const exactO = generated.sets[6].candidates.find((candidate) => (
      candidate.question.format === "true_false"
    ))!;
    expect(trueFalseState(exactO)).toBe("O");
    expect(generated.sets[6].candidates.filter((candidate) => (
      candidate.provenance.patternId === exactO.provenance.patternId
      && candidate.provenance.exampleId === exactO.provenance.exampleId
    ))).toHaveLength(5);
  });

  it("avoids reusing the exact-O source identity on production-shaped Novice Day 1", () => {
    const fixtureBook = fixture("novice");
    const productionBookId = "c4ab0760-3c31-4533-9631-0e2ead3bfe90";
    const book: WctBook = {
      ...fixtureBook.book,
      id: productionBookId,
      title: "WCT Novice",
      days: fixtureBook.book.days.map((day) => ({ ...day, bookId: productionBookId }))
    };
    const days = [
      productionNoviceDayOne(productionBookId),
      ...fixtureBook.days.slice(1).map((day) => ({ ...day, bookId: productionBookId }))
    ];

    const generated = generateStandardWctQuizBook(book, days, []);
    const dayOne = generated.sets[0];
    const exactO = dayOne.candidates.find((candidate) => (
      candidate.question.format === "true_false"
    ))!;

    expect(dayOne.source.sourceHash)
      .toBe("a39882507f97b25d64a1dd1cfa14657b0201fcca0484f4bc1c238df464c46a02");
    expect(trueFalseState(exactO)).toBe("O");
    expect(dayOne.candidates.filter((candidate) => (
      candidate.provenance.patternId === exactO.provenance.patternId
      && candidate.provenance.exampleId === exactO.provenance.exampleId
    ))).toHaveLength(1);
    expect(() => generateStandardWctQuizBook(book, days))
      .toThrow("WCT v2 override source hash mismatch");
  });

  it("minimizes unavoidable exact-O identity reuse on a two-example Wh Day", () => {
    const { book, days } = fixture("prenovice");
    const whDay: WctDay = {
      ...days[0],
      shortLabel: "의문사 연습",
      patterns: [{
        id: "wh-pattern",
        patternText: "Wh- + be/조동사 + 주어 ...?",
        meaningKo: "의문사 의문문",
        usageNote: "Wh- 뒤에 조동사와 주어 순서를 사용한다.",
        usageSource: "book",
        sourcePage: null,
        sourceNeedsReview: false,
        sortOrder: 0,
        examples: [{
          id: "wh-a",
          englishText: "Why do you study English?",
          meaningKo: "왜 영어를 공부하나요?",
          sourcePage: null,
          sourceNeedsReview: false,
          sortOrder: 0
        }, {
          id: "wh-b",
          englishText: "When did you study English?",
          meaningKo: "언제 영어를 공부했나요?",
          sourcePage: null,
          sourceNeedsReview: false,
          sortOrder: 1
        }]
      }]
    };
    const generated = generateStandardWctQuizBook(book, [whDay, ...days.slice(1)], []);
    const dayOne = generated.sets[0];
    const exactO = dayOne.candidates.find((candidate) => (
      candidate.question.format === "true_false"
    ))!;

    expect(trueFalseState(exactO)).toBe("O");
    expect(dayOne.candidates.filter((candidate) => (
      candidate.provenance.patternId === exactO.provenance.patternId
      && candidate.provenance.exampleId === exactO.provenance.exampleId
    ))).toHaveLength(2);
  }, 15_000);

  it("does not make O-only true/false examples mandatory for source diversity", () => {
    const { book, days } = fixture("novice");
    const sparseDay: WctDay = {
      ...days[5],
      shortLabel: "Yes/No 의문문",
      patterns: [
        {
          ...pattern(6, 0),
          patternText: "be/조동사 + 주어 ...?",
          examples: [
            { ...pattern(6, 0).examples[0], id: "d6-is", englishText: "Is she pretty?", meaningKo: "그녀는 예쁜가요?" },
            { ...pattern(6, 0).examples[0], id: "d6-can", englishText: "Can you play the piano?", meaningKo: "피아노를 칠 수 있나요?" }
          ]
        },
        {
          ...pattern(6, 1),
          patternText: "do/does/did + 주어 + 동사원형 ...?",
          examples: [
            { ...pattern(6, 1).examples[0], id: "d6-does", englishText: "Does he live in Suwon?", meaningKo: "그는 수원에 사나요?" },
            { ...pattern(6, 1).examples[0], id: "d6-did", englishText: "Did you have dinner?", meaningKo: "저녁을 먹었나요?" }
          ]
        }
      ]
    };
    const source = buildStandardWctQuizSource(book, sparseDay);

    expect([...eligibleStandardExampleIds(source, "O")].sort())
      .toEqual(["d6-can", "d6-did", "d6-does"]);
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

  it("deterministically varies correct-choice positions and keeps evidence in display order", () => {
    const { book, days } = fixture("prenovice");
    const first = generateStandardWctQuizBook(book, days);
    const repeated = generateStandardWctQuizBook(book, days);
    const selectable = first.sets.flatMap((set) => set.candidates).filter((candidate) => (
      candidate.question.format !== "true_false"
    ));
    const repeatedSelectable = repeated.sets.flatMap((set) => set.candidates).filter((candidate) => (
      candidate.question.format !== "true_false"
    ));
    const correctIndexes = selectable.map((candidate) => candidate.question.choices.findIndex(
      (choice) => choice.id === candidate.question.correctChoiceId
    ));

    expect(new Set(correctIndexes).size).toBeGreaterThan(1);
    expect(repeatedSelectable.map((candidate) => candidate.question.choices))
      .toEqual(selectable.map((candidate) => candidate.question.choices));
    for (const candidate of selectable) {
      expect(candidate.provenance.choiceEvidence.map((evidence) => evidence.choiceText))
        .toEqual(candidate.question.choices.map((choice) => choice.text));
      expect(candidate.provenance.choiceEvidence.findIndex((evidence) => (
        evidence.role === "correct"
      ))).toBe(candidate.question.choices.findIndex((choice) => (
        choice.id === candidate.question.correctChoiceId
      )));
    }
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
      const expectedStates = level === "prenovice"
        ? "OOXXXOOOXXXOOOXX"
        : "OOXXXOOOXXXOOOXXXOOOXXXOOOXX";

      expect(states.join("")).toBe(expectedStates);
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

    expect(trueFalseState(day3TrueFalse)).toBe("O");
    expect(trueFalseState(day6TrueFalse)).toBe("X");
    expect(residueStates(generated, 2)).toEqual(["O", "X", "O", "X", "O"]);
    expect(alternates(residueStates(generated, 2))).toBe(true);
    expect(new Set(day3.candidates.map((candidate) => candidate.provenance.exampleId)).size)
      .toBe(5);
    expect(new Set(day3.draft.questions.flatMap((question) => (
      question.choices.map((choice) => choice.id)
    ))).size).toBe(day3.draft.questions.reduce(
      (total, question) => total + question.choices.length,
      0
    ));
    for (const candidate of day3.candidates) {
      expect(candidate.provenance.choiceEvidence.map((evidence) => evidence.choiceText))
        .toEqual(candidate.question.choices.map((choice) => choice.text));
    }
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

  it("backtracks to keep residue balance with consecutive fixed truth states", () => {
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

    const generated = generateStandardWctQuizBook(book, days, overrides);
    const states = generated.sets.map((set) => trueFalseState(set.candidates.find(
      (candidate) => candidate.question.format === "true_false"
    )!));

    expect(states[2]).toBe("O");
    expect(states[5]).toBe("O");
    expect(states.filter((state) => state === "O")).toHaveLength(8);
    for (let residue = 0; residue < 3; residue += 1) {
      const group = states.filter((_state, index) => index % 3 === residue);
      expect(Math.abs(
        group.filter((state) => state === "O").length
        - group.filter((state) => state === "X").length
      )).toBeLessThanOrEqual(1);
    }
  });

  it("keeps overrides empty by default and rejects stale or foreign full-Day overrides", () => {
    const { book, days } = fixture("prenovice");
    const source = buildStandardWctQuizSource(book, days[6]);
    const questions = manualOOverride(source);
    const wrongLevel = STANDARD_WCT_DAY_OVERRIDES.find((override) => (
      override.level === "novice"
    ))!;

    expect(() => generateStandardWctQuizBook(book, days, [wrongLevel]))
      .toThrow("WCT v2 explicit override level mismatch");

    expect(STANDARD_WCT_DAY_OVERRIDES.map((override) => [
      override.level,
      override.dayNumber,
      override.expectedSourceHash
    ])).toEqual([
      ["prenovice", 3, "08452da167730596f1cdb1695050be5c4cc95d183766455878e6add15909bac2"],
      ["prenovice", 4, "d16a761206c45ce7804e20e3d5bafed2b9d9f0387ffcf78f7c02d6dd1f0cbde7"],
      ["prenovice", 5, "e94088e5680e3b3ef488628729e8ed0db489e8cd2ec9c07dddd0e0fc24fbb402"],
      ["prenovice", 7, "ce43040d5a4e657de7b6567524244d6a15f0fbf347b4d81e1aff9cc20e53d449"],
      ["prenovice", 10, "3705307cd378538ca409dd9c0f01425fff3a9b84dc5633f7b513233798a702cf"],
      ["prenovice", 12, "70d4e40951ae430485665477da8bc8180ebedbca1d28f594a050951dc48462a4"],
      ["prenovice", 15, "909d882fcef1e597d1b73c7f00817d30cd6ed5cdf7d6157812906179d45b2866"],
      ["novice", 2, "3105788c5a51f371f58631891de19ad85555006ddce2fdb1c22cb6e510b67c30"],
      ["novice", 3, "7c3b74be1a8f1d29703ab501f9de4419fe0ab0bab137b8ec8dd7e4fd6a9dd552"],
      ["novice", 4, "2378612873e3c9bbe25885f4bf091b36c7df8270b94842f3e6b31a78efbaf38f"],
      ["novice", 5, "e92f36992b9b3358d6b8c58c8a72f2a803ed936c671051e92c3d34e6cb620de4"],
      ["novice", 10, "ccad203f1a42440cf251760f50b1bf52c7f3d9fadc299b991bca47416a5ab598"],
      ["novice", 14, "2ecdfb7daa8b37f5b3c6d3938bd2813eed20db8fe06255258cb910c5332bcd21"],
      ["novice", 30, "7a22029211199ab9be909f57d4a75f6b8a49efd67f14543e76bf1a473d7a4037"],
      ["novice", 6, "f0d0405debf7ea5ce40dca2cef9b132df2d92492eaf432b0ac208f7de7121e86"],
      ["novice", 8, "87f2d6273f2d4d9b4f97f60d70f1e992b07248a94bba2f9a21a752b6eec6ec30"],
      ["novice", 19, "03f8082b768596e4071a10ad4588907a54202a852b513f8773ba824af087ce49"],
      ["novice", 20, "4d1bfcdaed66d6e6f727b2c563a8fb81fd849597ed12e65210b662cc965aa692"],
      ["novice", 28, "ff130b04dfa3957a021f6071a7ebf9724232ad11670f2aa70bc6bf87e09c158c"],
      ["novice", 7, "3d2524252d4506c505ac713059ee7b5fabb3481cda3ed2c655667552de59dfe0"],
      ["novice", 9, "1553505a6155126dda4dfe0cf5c4861cceb7463a0e7fa455f3fb1d3d93e21574"],
      ["novice", 11, "2cdf1fbc7a6f7653842c0f594f875dbee7d55f6f56ec4bad669880f9a603e64b"],
      ["novice", 13, "3e8cd3456d28d21e4db3de95a579510254640800f43798b5c6b4159b73f71e00"],
      ["novice", 22, "2b6639c1dd621c36833a19d87fa527aa8a3201ae1a614145c7b5aec9713b25c1"],
      ["novice", 23, "aafd4b70be2cf41b0475ca691a36b3a321590ced68bbcd33580b0bb4d303dfc8"],
      ["novice", 29, "f34a211fea5e8f30a0f30998a90e6e208851311154a56a9a90ee4ead29fcda25"],
      ["novice", 15, "acbae168a5069582b1e3681d4c9f69f4a994d11ab73b25d8133b6704c33797ad"],
      ["novice", 16, "47d86198f32cb3930bd12e64cd315a4d4cddad0022f1264c8e49d20b08193a6d"],
      ["novice", 17, "73aecaff8bfc8b21cee5843dc14b1f5fd4a57a5984bb7e6e94e9740903440060"],
      ["novice", 18, "85b1252c341bbd938eab4de04c9cf9f0ad2e9a920d0c299552cf6b8f8802849e"],
      ["novice", 24, "fa7cacae424fa23927b4a8089ebecb6aee2b8105ce98ec0dd1a06421e9c8e5ac"],
      ["prenovice", 1, "20a8519d9a9fb16a79e7abc197292a8cb0ca21707498a8559395d11e19f0875a"],
      ["prenovice", 6, "0cfda1b29f694d07fd0ada187a48b30605a73bb123756f270f399e94c1a3a006"],
      ["prenovice", 8, "799cacd857a4656ed0f8ad2ccfea813dacf868dbc855750954595d4daa2a86f2"],
      ["prenovice", 13, "14a18faf6f5f38f4f1a7a7372037ac96fbace1208ebe98622c348a1cd17a0fef"],
      ["prenovice", 14, "2d8cf56a37f03147c383bbff38afe4a81e3c3fcfd4ac605276df21170f10cdd4"],
      ["prenovice", 16, "8714e9ef97e0ccdc88275fb380622766b21afb6455ecea015df08ee6a0fe6fd9"],
      ["novice", 27, "0286533b809881bd642a6c2a5f4c49ca7e41ec4eab6a7cf9e3d54d5eac0dd868"],
      ["novice", 31, "2bb74ba7f67b324cfab87652b529ffd105d5fe6ed94109802449d69c323b58b3"]
    ]);
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

  it("pins the round-four editorial overrides to the approved formats, targets, and truth states", () => {
    const expected = {
      "prenovice:5": {
        formats: ["multiple_choice", "fill_blank", "true_false", "multiple_choice", "fill_blank"],
        kinds: ["translation", "pattern", "translation", "pattern", "translation"],
        state: "O",
        mutations: [
          ["students", "teachers", "friends", "children"],
          ["were", "was", "are", "weren't"],
          null,
          ["We were students.", "We are students.", "We weren't students.", "Were we students?"],
          ["a fool", "a student", "a teacher", "my friend"]
        ]
      },
      "prenovice:7": {
        formats: ["fill_blank", "multiple_choice", "true_false", "fill_blank", "multiple_choice"],
        kinds: ["pattern", "translation", "pattern", "translation", "translation"],
        state: "O",
        mutations: [
          ["Are", "Were", "Aren't", "Weren't"],
          ["singing", "dancing", "running", "talking"],
          null,
          ["cooking", "studying", "working", "eating"],
          ["going home", "going to work", "staying here", "visiting a friend"]
        ]
      },
      "prenovice:10": {
        formats: ["multiple_choice", "fill_blank", "multiple_choice", "fill_blank", "true_false"],
        kinds: ["translation", "pattern", "pattern", "translation", "translation"],
        state: "X",
        mutations: [
          ["your free time", "class", "the morning", "the office"],
          ["were you doing", "did you do", "are you doing", "have you done"],
          ["did you do", "do you do", "were you doing", "have you done"],
          ["doing", "reading", "watching", "studying"],
          ["did", "didn't"]
        ]
      },
      "novice:2": {
        formats: ["multiple_choice", "fill_blank", "true_false", "multiple_choice", "fill_blank"],
        kinds: ["translation", "pattern", "translation", "pattern", "translation"],
        state: "O",
        mutations: [
          ["has to", "might", "must not", "doesn't have to"],
          ["must not", "shouldn't", "don't have to", "must"],
          null,
          ["must", "should", "don't have to", "must not"],
          ["doesn't have to", "has to", "should", "must not"]
        ]
      },
      "novice:3": {
        formats: ["multiple_choice", "fill_blank", "true_false", "multiple_choice", "fill_blank"],
        kinds: ["translation", "pattern", "translation", "pattern", "translation"],
        state: "O",
        mutations: [
          ["She is", "He is", "We are", "They are"],
          ["Were you going to submit", "Are you going to submit", "Did you submit", "Were you able to submit"],
          null,
          ["was going to call", "called", "was talking to", "forgot to call"],
          ["an application", "the report", "your homework", "a complaint"]
        ]
      },
      "novice:4": {
        formats: ["multiple_choice", "fill_blank", "true_false", "multiple_choice", "fill_blank"],
        kinds: ["pattern", "translation", "translation", "pattern", "translation"],
        state: "X",
        mutations: [
          ["am going to go home", "am going home", "am going to stay home", "was going to go home"],
          ["Where", "When", "Why", "How"],
          ["home", "to school"],
          ["What are you going to do?", "Where is she going?", "What are you doing?", "What did you decide to do?"],
          ["go home", "stay home", "call her", "study tonight"]
        ]
      },
      "novice:5": {
        formats: ["multiple_choice", "fill_blank", "multiple_choice", "true_false", "fill_blank"],
        kinds: ["translation", "pattern", "pattern", "translation", "translation"],
        state: "X",
        mutations: [
          ["The class", "The movie", "The book", "The meeting"],
          ["depressing", "depressed", "frustrating", "frustrated"],
          ["I was frustrated with English.", "English was frustrating for beginners.", "The English class was depressing.", "I was satisfied with English."],
          ["you", "work"],
          ["boring", "interesting", "exciting", "relaxing"]
        ]
      },
      "novice:10": {
        formats: ["multiple_choice", "fill_blank", "true_false", "multiple_choice", "fill_blank"],
        kinds: ["pattern", "translation", "translation", "pattern", "translation"],
        state: "X",
        mutations: [
          ["a nurse", "nursing a patient", "very tired", "at the hospital"],
          ["studying English hard", "working at the office", "drawing a picture", "waiting for the bus"],
          ["tired", "busy"],
          ["has been drawing", "is drawing", "drew", "will draw"],
          ["always", "often", "sometimes", "recently"]
        ]
      },
      "novice:14": {
        formats: ["multiple_choice", "true_false", "fill_blank", "multiple_choice", "fill_blank"],
        kinds: ["pattern", "translation", "translation", "pattern", "translation"],
        state: "O",
        mutations: [
          ["harder", "hard", "less", "the hardest"],
          null,
          ["the fastest", "faster", "very fast", "much later"],
          ["faster", "fast", "the fastest", "more slowly"],
          ["study", "work", "practice", "train"]
        ]
      },
      "novice:30": {
        formats: ["multiple_choice", "fill_blank", "multiple_choice", "true_false", "fill_blank"],
        kinds: ["translation", "pattern", "pattern", "translation", "translation"],
        state: "X",
        mutations: [
          ["badminton", "tennis", "baseball", "chess"],
          ["to stop people", "related to stopping people", "to help people", "important to many people"],
          ["Being rich is good.", "Being rich was difficult.", "Getting rich takes time.", "Rich people can be generous."],
          ["your future", "your health"],
          ["My job", "Your job", "His job", "Their job"]
        ]
      }
    } as const;
    const overrides = STANDARD_WCT_DAY_OVERRIDES.filter((override) => (
      `${override.level}:${override.dayNumber}` in expected
    ));

    expect(overrides).toHaveLength(Object.keys(expected).length);
    for (const override of overrides) {
      const key = `${override.level}:${override.dayNumber}` as keyof typeof expected;
      const contract = expected[key];
      const mutationContract = override.questions.map((candidate) => {
        const mutations = candidate.provenance.statementMutation
          ? [candidate.provenance.statementMutation]
          : candidate.provenance.choiceEvidence.flatMap((evidence) => (
              evidence.mutation ? [evidence.mutation] : []
            ));
        return mutations.length === 0
          ? null
          : [mutations[0].changedFrom, ...mutations.map((mutation) => mutation.changedTo)];
      });
      const trueFalse = override.questions.find((candidate) => (
        candidate.question.format === "true_false"
      ))!;

      expect(override.questions.map((candidate) => candidate.question.format))
        .toEqual(contract.formats);
      expect(override.questions.map((candidate) => candidate.question.kind))
        .toEqual(contract.kinds);
      expect(mutationContract).toEqual(contract.mutations);
      expect(trueFalseState(trueFalse)).toBe(contract.state);
      expect(override.questions.every((candidate) => (
        (candidate.question.id === "pn5-mc-were-students"
          || candidate.question.id === "n2-mc-has-to"
          || candidate.question.id === "n10-tf-tired"
          || candidate.question.id === "n30-fill-stop-people"
          || candidate.question.explanation.includes('정답 표현은 "'))
        && candidate.question.feedback.reason === candidate.question.explanation
      ))).toBe(true);
      expect(hasAdjacentEqual(contract.formats)).toBe(false);
      expect(countBy(override.questions.map((candidate) => candidate.question), "format"))
        .toEqual(FORMAT_COUNTS);
      expect(countBy(override.questions.map((candidate) => candidate.question), "kind"))
        .toEqual(KIND_COUNTS);
    }

    for (const [key, exactSource] of [
      ["prenovice:5", "I wanted to be with you."],
      ["prenovice:7", "I'm not running."]
    ] as const) {
      const override = overrides.find((item) => `${item.level}:${item.dayNumber}` === key)!;
      expect(override.questions.filter((candidate) => (
        candidate.provenance.sourceSentence === exactSource
      ))).toHaveLength(1);
    }
    const novice30 = overrides.find((item) => (
      item.level === "novice" && item.dayNumber === 30
    ))!;
    expect(novice30.questions.flatMap((candidate) => [
      ...(candidate.provenance.statementMutation ? [candidate.provenance.statementMutation] : []),
      ...candidate.provenance.choiceEvidence.flatMap((evidence) => (
        evidence.mutation ? [evidence.mutation] : []
      ))
    ]).some((mutation) => mutation.changedFrom === "is")).toBe(false);
  });

  it("pins the six sparse production Days to compliant unique-target overrides", () => {
    const expectedStates = new Map([
      [5, "X"],
      [6, "X"],
      [8, "O"],
      [19, "O"],
      [20, "X"],
      [28, "X"]
    ]);
    const overrides = STANDARD_WCT_DAY_OVERRIDES.filter((override) => (
      override.level === "novice" && expectedStates.has(override.dayNumber)
    ));

    expect(overrides.map((override) => override.dayNumber))
      .toEqual([...expectedStates.keys()]);
    for (const override of overrides) {
      expect(countBy(override.questions.map((candidate) => candidate.question), "format"))
        .toEqual(FORMAT_COUNTS);
      expect(countBy(override.questions.map((candidate) => candidate.question), "kind"))
        .toEqual(KIND_COUNTS);
      expect(override.questions.map((candidate) => candidate.question.format))
        .toEqual([
          "multiple_choice",
          "fill_blank",
          "multiple_choice",
          "true_false",
          "fill_blank"
        ]);
      expect(hasUniqueStandardLearningTargets(override.questions)).toBe(true);
      expect(override.questions.every(auditStandardQuestionCandidate)).toBe(true);
      const trueFalse = override.questions.find((candidate) => (
        candidate.question.format === "true_false"
      ))!;
      expect(trueFalseState(trueFalse)).toBe(expectedStates.get(override.dayNumber));
    }
  });

  it("reconstructs complete natural sentences for phrase-level override choices", () => {
    const byId = new Map(STANDARD_WCT_DAY_OVERRIDES.flatMap((override) => (
      override.questions.map((candidate) => [candidate.question.id, candidate] as const)
    )));
    const reconstructedChoices = (questionId: string) => {
      const candidate = byId.get(questionId)!;
      const blank = candidate.provenance.blankSpan;
      return candidate.question.choices.map((choice) => blank
        ? `${candidate.provenance.sourceSentence.slice(0, blank.start)}${choice.text}${candidate.provenance.sourceSentence.slice(blank.end)}`
        : choice.text);
    };

    expect(reconstructedChoices("n5-mc-frustrated")).toEqual([
      "English was frustrating for beginners.",
      "I was frustrated with English.",
      "The English class was depressing.",
      "I was satisfied with English."
    ]);
    expect(reconstructedChoices("n6-fill-can-play")).toEqual([
      "Did you play the piano?",
      "Can you play the piano?",
      "Will you play the piano?",
      "Should you play the piano?"
    ]);
    expect(reconstructedChoices("n6-mc-does-live")).toEqual([
      "Is he living in Suwon?",
      "Does he live in Suwon?",
      "Did he live in Suwon?",
      "Does she live in Suwon?"
    ]);
    expect(reconstructedChoices("n8-fill-made")).toEqual([
      "Who taught you to like this?",
      "What made you like this?",
      "When did you start to like this?",
      "Where did you learn to like this?"
    ]);
    expect(reconstructedChoices("n8-mc-fought-subject")).toEqual([
      "Who did they fight?",
      "Who fought?",
      "What caused the fight?",
      "Why did they fight?"
    ]);
    expect(reconstructedChoices("n8-fill-this")).toEqual([
      "What made you like that?",
      "What made you like this?",
      "What made you like the movie?",
      "What made you like the song?"
    ]);
    expect(reconstructedChoices("pn10-fill-what-were")).toEqual([
      "What did you do?",
      "What were you doing?",
      "What are you doing?",
      "What have you done?"
    ]);

    const day8 = STANDARD_WCT_DAY_OVERRIDES.find((override) => (
      override.level === "novice" && override.dayNumber === 8
    ))!;
    const exactO = day8.questions.find((candidate) => (
      candidate.question.format === "true_false"
    ))!;
    for (const candidate of day8.questions) {
      if (candidate === exactO
        || candidate.provenance.sourceSentence !== exactO.provenance.sourceSentence) continue;
      const mutation = candidate.provenance.statementMutation
        ?? candidate.provenance.choiceEvidence.find((evidence) => evidence.mutation)?.mutation;
      expect(mutation?.changedFrom).not.toBe(candidate.provenance.sourceSentence);
    }
  });

  it("uses accurate, question-specific learner feedback for the Novice Day 24 override", () => {
    const override = STANDARD_WCT_DAY_OVERRIDES.find((item) => item.dayNumber === 24)!;
    const expectedReasons = new Map([
      ["d24-mc-good", "상대의 좋은 소식에 긍정적으로 반응"],
      ["d24-fill-listen-pattern", "be동사 뒤에 \"listening\""],
      ["d24-mc-lucky", "상대의 행운을 부러워하거나 축하"],
      ["d24-tf-bad", "안타까움이나 유감"],
      ["d24-fill-shame", "\"That's a shame.\" 형태"]
    ]);

    expect(override.questions.map((candidate) => candidate.question.id))
      .toEqual([...expectedReasons.keys()]);
    for (const candidate of override.questions) {
      const expected = expectedReasons.get(candidate.question.id)!;
      expect(candidate.question.explanation).toContain(expected);
      expect(candidate.question.feedback.reason).toBe(candidate.question.explanation);
      expect(candidate.question.explanation).not.toContain("전치사");
      for (const evidence of candidate.provenance.choiceEvidence) {
        if (evidence.mutation) {
          expect(evidence.mutation.reason).toBe(candidate.question.explanation);
        }
      }
      if (candidate.provenance.statementMutation) {
        expect(candidate.provenance.statementMutation.reason)
          .toBe(candidate.question.explanation);
      }
    }
    expect(override.questions.find((candidate) => candidate.question.id === "d24-fill-shame")
      ?.question.prompt).toContain("That's ____ shame.");
  });

  it("uses the reviewed truth states and whole pattern-bearing contrasts for Days 15-18", () => {
    const overrides = STANDARD_WCT_DAY_OVERRIDES.filter((item) => (
      item.level === "novice" && item.dayNumber >= 15 && item.dayNumber <= 18
    ));
    const expectedStates = new Map([[15, "O"], [16, "X"], [17, "O"], [18, "O"]]);

    expect(overrides.map((item) => item.dayNumber)).toEqual([15, 16, 17, 18]);
    for (const override of overrides) {
      expect(countBy(override.questions.map((candidate) => candidate.question), "format"))
        .toEqual(FORMAT_COUNTS);
      expect(countBy(override.questions.map((candidate) => candidate.question), "kind"))
        .toEqual(KIND_COUNTS);
      const trueFalse = override.questions.find((candidate) => (
        candidate.question.format === "true_false"
      ))!;
      expect(trueFalse.question.choices.find((choice) => (
        choice.id === trueFalse.question.correctChoiceId
      ))?.text).toBe(expectedStates.get(override.dayNumber));
      if (override.dayNumber === 16) {
        expect(trueFalse.provenance.statementMutation?.text)
          .toBe("I go on a hike in spring.");
      } else {
        expect(trueFalse.provenance.statementMutation).toBeUndefined();
        expect(trueFalse.question.prompt).toContain(`"${trueFalse.provenance.sourceSentence}"`);
      }
      expect(trueFalse.question.feedback.correctSentence)
        .toBe(trueFalse.provenance.sourceSentence);
      expect(trueFalse.question.feedback.pattern).toBeTruthy();
      const contrastSignatures = override.questions.flatMap((candidate) => {
        const mutations = candidate.provenance.choiceEvidence.flatMap((evidence) => (
          evidence.mutation ? [evidence.mutation] : []
        ));
        return mutations.length === 0 ? [] : [[
          candidate.provenance.sourceSentence,
          mutations[0].changedFrom,
          ...mutations.map((mutation) => mutation.changedTo).sort()
        ].join("\0")];
      });
      expect(new Set(contrastSignatures).size).toBe(contrastSignatures.length);
      for (const candidate of override.questions) {
        expect(auditStandardQuestionCandidate(candidate)).toBe(true);
        if (candidate.question.kind === "pattern"
          && candidate.question.format !== "true_false") {
          const mutation = candidate.provenance.choiceEvidence.find((evidence) => (
            evidence.mutation
          ))?.mutation;
          expect(mutation?.changedFrom).toMatch(/\s/u);
          expect(mutation?.changedFrom).toMatch(/\b(?:in|at|on|with|for|by|of|about|to|from)\b/iu);
        }
      }
    }
  });

  it("rejects a five-question override with invalid counts, adjacency, or duplicate prompts", () => {
    const { book, days } = fixture("prenovice");
    const source = buildStandardWctQuizSource(book, days[6]);
    const questions = manualOOverride(source);
    const invalidLists = [
      [questions[0], questions[0], questions[2], questions[3], questions[4]],
      [...questions].sort((left, right) => (
        left.question.format.localeCompare(right.question.format)
      ))
    ];

    for (const invalid of invalidLists) {
      expect(() => generateStandardWctQuizBook(book, days, [{
        level: "prenovice",
        dayNumber: 7,
        expectedSourceHash: source.sourceHash,
        questions: invalid
      }])).toThrow("WCT v2 override must provide one compliant five-question Day");
    }
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
