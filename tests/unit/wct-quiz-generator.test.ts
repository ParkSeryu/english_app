import { describe, expect, it } from "vitest";

import {
  buildPremiumWctQuizSource,
  buildStandardWctQuizSource
} from "@/lib/wct/quiz/adapters";
import { generateWctQuizSetDraft } from "@/lib/wct/quiz/generator";
import {
  premiumWctLessonKey,
  standardWctLessonKey
} from "@/lib/wct/quiz/keys";
import type { WctQuizSource } from "@/lib/wct/quiz/types";
import {
  getWctPremiumLesson,
  type WctPremiumLesson
} from "@/lib/wct/premium-lessons";
import type { WctBook, WctDay, WctExample, WctPattern } from "@/lib/wct/types";

function example(
  id: string,
  englishText: string,
  meaningKo: string
): WctExample {
  return {
    id,
    englishText,
    meaningKo,
    sourcePage: null,
    sourceNeedsReview: false,
    sortOrder: Number(id.replace(/\D/g, "")) || 0
  };
}

function pattern(
  id: string,
  patternText: string,
  meaningKo: string,
  examples: WctExample[]
): WctPattern {
  return {
    id,
    patternText,
    meaningKo,
    usageNote: `${patternText} 사용법`,
    usageSource: "book",
    sourcePage: null,
    sourceNeedsReview: false,
    sortOrder: Number(id.replace(/\D/g, "")) || 0,
    examples
  };
}

function day(
  id: string,
  dayNumber: number,
  shortLabel: string,
  patterns: WctPattern[]
): WctDay {
  return {
    id,
    bookId: "book-1",
    dayNumber,
    shortLabel,
    displayLabel: `Day ${dayNumber} (${shortLabel})`,
    sourcePageStart: null,
    sourcePageEnd: null,
    sourceNeedsReview: false,
    learningSummary: null,
    concepts: [],
    patterns,
    importantNotes: [],
    practicePrompts: []
  };
}

const dayOne = day("day-1", 1, "요청하기", [
  pattern("pattern-1", "I want to + verb", "~하고 싶어요", [
    example("example-1", "I want to book a table.", "테이블을 예약하고 싶어요."),
    example("example-2", "I want to change my seat.", "자리를 바꾸고 싶어요.")
  ]),
  pattern("pattern-2", "Could you + verb?", "~해 주시겠어요?", [
    example("example-3", "Could you open the window?", "창문을 열어 주시겠어요?"),
    example("example-4", "Could you speak slowly?", "천천히 말해 주시겠어요?")
  ])
]);

const dayTwo = day("day-2", 2, "경험 말하기", [
  pattern("pattern-3", "I'm going to + verb", "~할 예정이에요", [
    example("example-5", "I'm going to call her.", "그녀에게 전화할 예정이에요."),
    example("example-6", "I'm going to leave early.", "일찍 떠날 예정이에요.")
  ]),
  pattern("pattern-4", "Have you ever + p.p.?", "~해 본 적 있나요?", [
    example("example-7", "Have you ever tried surfing?", "서핑을 해 본 적 있나요?"),
    example("example-8", "Have you ever visited Jeju?", "제주에 가 본 적 있나요?")
  ])
]);

const book: WctBook = {
  id: "book-1",
  title: "WCT Prenovice",
  levelLabel: "Prenovice",
  dayCount: 2,
  sortOrder: 1,
  days: [dayOne, dayTwo]
};

function approvedPremiumChoiceText(lesson: WctPremiumLesson) {
  const choices = new Set<string>(lesson.patterns);
  for (const section of lesson.sections) {
    for (const block of section.blocks) {
      if (block.kind === "paragraph" || block.kind === "subheading") {
        choices.add(block.text);
      } else if (block.kind === "example" || block.kind === "rule") {
        block.lines.forEach((line) => choices.add(line));
      } else {
        block.items.forEach((item) => choices.add(item));
      }
    }
  }
  return choices;
}

describe("WCT quiz generator", () => {
  it("creates the fixed standard 3 translation and 2 pattern mix", () => {
    const source = buildStandardWctQuizSource(book, dayOne, [dayOne, dayTwo]);
    const draft = generateWctQuizSetDraft(source);

    expect(draft.lessonKey).toBe("wct-book:wct-prenovice:day:1");
    expect(draft.questions).toHaveLength(5);
    expect(draft.questions.map((question) => question.kind)).toEqual([
      "translation",
      "translation",
      "translation",
      "pattern",
      "pattern"
    ]);
    for (const question of draft.questions) {
      expect(question.choices).toHaveLength(4);
      expect(new Set(question.choices.map((choice) => choice.text)).size).toBe(4);
      expect(question.choices.filter(
        (choice) => choice.id === question.correctChoiceId
      )).toHaveLength(1);
      expect(question.explanation.trim()).not.toBe("");
    }
  });

  it("is byte-stable for the same source and generator version", () => {
    const source = buildStandardWctQuizSource(book, dayOne, [dayOne, dayTwo]);

    expect(generateWctQuizSetDraft(source))
      .toEqual(generateWctQuizSetDraft(source));
  });

  it("cycles a sparse Day while keeping five prompts distinct", () => {
    const sparseDay = day("day-3", 3, "하나의 패턴", [
      pattern("pattern-9", "Can I + verb?", "~해도 될까요?", [
        example("example-9", "Can I sit here?", "여기 앉아도 될까요?")
      ])
    ]);
    const sparseBook = {
      ...book,
      dayCount: 3,
      days: [...book.days, sparseDay]
    };

    const draft = generateWctQuizSetDraft(
      buildStandardWctQuizSource(sparseBook, sparseDay, [
        dayOne,
        dayTwo,
        sparseDay
      ])
    );

    expect(draft.questions).toHaveLength(5);
    expect(new Set(draft.questions.map((question) => question.prompt)).size)
      .toBe(5);
  });

  it("keeps translation prompts distinct when examples share a meaning", () => {
    const repeatedMeaningDay = day("day-4", 4, "같은 뜻", [
      pattern("pattern-10", "Would you + verb?", "~해 주시겠어요?", [
        example("example-10", "Would you wait here?", "여기서 기다려 주시겠어요?"),
        example("example-11", "Would you stay here?", "여기서 기다려 주시겠어요?")
      ]),
      pattern("pattern-11", "Please + verb", "~해 주세요", [
        example("example-12", "Please call me.", "전화해 주세요.")
      ])
    ]);
    const repeatedMeaningBook = {
      ...book,
      dayCount: 3,
      days: [...book.days, repeatedMeaningDay]
    };

    const draft = generateWctQuizSetDraft(
      buildStandardWctQuizSource(repeatedMeaningBook, repeatedMeaningDay, [
        dayOne,
        dayTwo,
        repeatedMeaningDay
      ])
    );

    expect(new Set(draft.questions.map((question) => question.prompt)).size)
      .toBe(5);
  });

  it("uses only Premium source text for answer choices", () => {
    const lesson = getWctPremiumLesson("day-1");
    expect(lesson).not.toBeNull();
    if (!lesson) return;

    const draft = generateWctQuizSetDraft(buildPremiumWctQuizSource(lesson));
    const approvedChoices = approvedPremiumChoiceText(lesson);

    expect(draft.questions.map((question) => question.kind)).toEqual([
      "concept",
      "concept",
      "concept",
      "pattern",
      "pattern"
    ]);
    for (const choice of draft.questions.flatMap((question) => question.choices)) {
      expect(approvedChoices.has(choice.text)).toBe(true);
    }
    expect(JSON.stringify(draft)).not.toContain("번역:");
  });

  it("rejects a source that cannot provide three distinct distractors", () => {
    const insufficientSource: WctQuizSource = {
      lessonKey: "wct-book:small:day:1",
      sourceKind: "wct_day",
      sourceId: "day-small",
      sourceHashInput: { day: "small" },
      seeds: Array.from({ length: 5 }, (_, index) => ({
        seedKey: `seed-${index}`,
        kind: "translation" as const,
        prompt: `질문 ${index + 1}`,
        correctText: "Only answer",
        explanation: "저장된 설명",
        distractorPool: ["Only answer", "One distractor"]
      }))
    };

    expect(() => generateWctQuizSetDraft(insufficientSource))
      .toThrow("WCT quiz needs four distinct choices");
  });

  it("normalizes stable standard and Premium lesson keys", () => {
    expect(standardWctLessonKey("  WCT   PRENOVICE ", 12))
      .toBe("wct-book:wct-prenovice:day:12");
    expect(premiumWctLessonKey(" Day-1 "))
      .toBe("wct-premium:day-1");
  });
});
