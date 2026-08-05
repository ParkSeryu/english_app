import { normalizeWctIdentity } from "../normalization.ts";
import type {
  WctPremiumContentBlock,
  WctPremiumLesson
} from "../premium-lessons.ts";
import type { WctBook, WctDay, WctExample, WctPattern } from "../types.ts";
import { premiumWctLessonKey, standardWctLessonKey } from "./keys.ts";
import type {
  WctQuizQuestionSeed,
  WctQuizSource
} from "./types.ts";

type StandardExampleSource = {
  day: WctDay;
  pattern: WctPattern;
  example: WctExample;
};

type PremiumSectionFact = {
  sectionId: string;
  sectionTitle: string;
  text: string;
};

type PremiumHeadedExample = {
  sectionId: string;
  heading: string;
  example: string;
};

function bySortOrder<T extends { sortOrder: number }>(left: T, right: T) {
  return left.sortOrder - right.sortOrder;
}

function flattenStandardExamples(day: WctDay): StandardExampleSource[] {
  return [...day.patterns].sort(bySortOrder).flatMap((pattern) => (
    [...pattern.examples].sort(bySortOrder).map((example) => ({
      day,
      pattern,
      example
    }))
  ));
}

function standardCorpus(target: WctDay, allDays: readonly WctDay[]) {
  return [...allDays]
    .sort((left, right) => {
      if (left.id === target.id) return -1;
      if (right.id === target.id) return 1;
      const distance = Math.abs(left.dayNumber - target.dayNumber)
        - Math.abs(right.dayNumber - target.dayNumber);
      return distance || left.dayNumber - right.dayNumber;
    })
    .flatMap(flattenStandardExamples);
}

function translationPrompt(
  source: StandardExampleSource,
  questionIndex: number
) {
  const meaning = source.example.meaningKo?.trim();
  if (!meaning) throw new Error("WCT quiz needs translated examples");
  if (questionIndex === 0) {
    return `"${meaning}"에 맞는 영어 문장을 고르세요.`;
  }
  if (questionIndex === 1) {
    return `"${source.pattern.patternText}" 패턴으로 "${meaning}"를 말한 문장을 고르세요.`;
  }
  return `${source.day.displayLabel}의 "${source.pattern.patternText}" 예문 중 "${meaning}"에 맞는 문장을 고르세요.`;
}

function standardTranslationSeeds(
  target: WctDay,
  corpus: StandardExampleSource[]
) {
  const translated = flattenStandardExamples(target).filter((source) => (
    Boolean(source.example.meaningKo?.trim())
  ));
  if (translated.length === 0) {
    throw new Error(`WCT quiz needs translated examples for ${target.displayLabel}`);
  }

  return Array.from({ length: 3 }, (_, questionIndex) => {
    const source = translated[questionIndex % translated.length];
    const meaning = source.example.meaningKo?.trim() ?? "";
    return {
      seedKey: [
        "translation",
        questionIndex,
        normalizeWctIdentity(source.pattern.patternText),
        normalizeWctIdentity(meaning)
      ].join(":"),
      kind: "translation" as const,
      prompt: translationPrompt(source, questionIndex),
      correctText: source.example.englishText,
      explanation: [
        source.pattern.patternText,
        source.pattern.meaningKo,
        meaning
      ].filter(Boolean).join(" · "),
      distractorPool: corpus.map((candidate) => candidate.example.englishText)
    };
  });
}

function standardPatternSeeds(
  target: WctDay,
  corpus: StandardExampleSource[]
) {
  const patterns = [...target.patterns]
    .sort(bySortOrder)
    .filter((pattern) => pattern.examples.length > 0);
  if (patterns.length === 0) {
    throw new Error(`WCT quiz needs pattern examples for ${target.displayLabel}`);
  }

  return Array.from({ length: 2 }, (_, questionIndex) => {
    const pattern = patterns[questionIndex % patterns.length];
    const examples = [...pattern.examples].sort(bySortOrder);
    const example = examples[
      Math.floor(questionIndex / patterns.length) % examples.length
    ];
    const source = { day: target, pattern, example };
    const repeated = questionIndex >= patterns.length;
    return {
      seedKey: [
        "pattern",
        questionIndex,
        normalizeWctIdentity(source.pattern.patternText),
        normalizeWctIdentity(source.example.englishText)
      ].join(":"),
      kind: "pattern" as const,
      prompt: repeated
        ? `${target.displayLabel}의 "${source.pattern.patternText}" 패턴과 연결된 "${source.example.meaningKo ?? source.example.englishText}" 예문을 고르세요.`
        : `"${source.pattern.patternText}" 패턴에 맞는 영어 문장을 고르세요.`,
      correctText: source.example.englishText,
      explanation: [
        source.pattern.patternText,
        source.pattern.meaningKo,
        source.pattern.usageNote,
        source.example.meaningKo
      ].filter(Boolean).join(" · "),
      distractorPool: corpus.map((candidate) => candidate.example.englishText)
    };
  });
}

function standardSourceHashInput(
  book: WctBook,
  target: WctDay,
  allDays: readonly WctDay[]
) {
  return {
    bookTitle: normalizeWctIdentity(book.title),
    targetDayNumber: target.dayNumber,
    days: [...allDays]
      .sort((left, right) => left.dayNumber - right.dayNumber)
      .map((day) => ({
        dayNumber: day.dayNumber,
        displayLabel: day.displayLabel,
        patterns: [...day.patterns].sort(bySortOrder).map((pattern) => ({
          patternText: pattern.patternText,
          meaningKo: pattern.meaningKo,
          usageNote: pattern.usageNote,
          examples: [...pattern.examples].sort(bySortOrder).map((example) => ({
            englishText: example.englishText,
            meaningKo: example.meaningKo
          }))
        }))
      }))
  };
}

export function buildLegacyStandardWctQuizSource(
  book: WctBook,
  target: WctDay,
  allDays: readonly WctDay[]
): WctQuizSource {
  const corpus = standardCorpus(target, allDays);
  return {
    lessonKey: standardWctLessonKey(book.title, target.dayNumber),
    sourceKind: "wct_day",
    sourceId: target.id,
    sourceHashInput: standardSourceHashInput(book, target, allDays),
    seeds: [
      ...standardTranslationSeeds(target, corpus),
      ...standardPatternSeeds(target, corpus)
    ]
  };
}

function firstFact(blocks: readonly WctPremiumContentBlock[]) {
  for (const block of blocks) {
    if (block.kind === "paragraph" || block.kind === "subheading") {
      if (block.text.trim()) return block.text.trim();
    } else if (block.kind === "rule" || block.kind === "example") {
      const text = block.lines.find((line) => line.trim());
      if (text) return text.trim();
    } else {
      const text = block.items.find((item) => item.trim());
      if (text) return text.trim();
    }
  }
  return null;
}

function premiumSectionFacts(lesson: WctPremiumLesson): PremiumSectionFact[] {
  return lesson.sections.flatMap((section) => {
    const text = firstFact(section.blocks);
    return text ? [{
      sectionId: section.id,
      sectionTitle: section.title,
      text
    }] : [];
  });
}

function finalExampleLine(lines: readonly string[]) {
  return [...lines].reverse().find((line) => line.trim().startsWith("→"))
    ?? [...lines].reverse().find((line) => line.trim())
    ?? null;
}

function premiumHeadedExamples(
  lesson: WctPremiumLesson
): PremiumHeadedExample[] {
  return lesson.sections.flatMap((section) => {
    const pairs: PremiumHeadedExample[] = [];
    for (let index = 0; index < section.blocks.length - 1; index += 1) {
      const heading = section.blocks[index];
      const next = section.blocks[index + 1];
      if (heading.kind !== "subheading" || next.kind !== "example") continue;
      const example = finalExampleLine(next.lines);
      if (example) {
        pairs.push({
          sectionId: section.id,
          heading: heading.text,
          example
        });
      }
    }
    return pairs;
  });
}

function premiumExamplePool(lesson: WctPremiumLesson) {
  return lesson.sections.flatMap((section) => (
    section.blocks.flatMap((block) => {
      if (block.kind === "example") {
        return block.lines.map((line) => line.trim()).filter(Boolean);
      }
      if (block.kind === "list") {
        return block.items.map((item) => item.trim()).filter(Boolean);
      }
      return [];
    })
  ));
}

function premiumConceptSeeds(
  facts: PremiumSectionFact[]
): WctQuizQuestionSeed[] {
  if (facts.length < 4) {
    throw new Error("WCT Premium quiz needs four distinct section facts");
  }
  return facts.slice(0, 3).map((fact, questionIndex) => ({
    seedKey: [
      "concept",
      questionIndex,
      normalizeWctIdentity(fact.sectionTitle)
    ].join(":"),
    kind: "concept",
    prompt: `다음 중 "${fact.sectionTitle}"에서 설명한 내용은 무엇인가요?`,
    correctText: fact.text,
    explanation: fact.text,
    distractorPool: facts
      .filter((candidate) => candidate.sectionId !== fact.sectionId)
      .map((candidate) => candidate.text)
  }));
}

function premiumPatternSeeds(
  lesson: WctPremiumLesson,
  pairs: PremiumHeadedExample[]
): WctQuizQuestionSeed[] {
  if (pairs.length < 2) {
    throw new Error("WCT Premium quiz needs two headed examples");
  }
  const distractorPool = premiumExamplePool(lesson);
  return pairs.slice(0, 2).map((pair, questionIndex) => ({
    seedKey: [
      "pattern",
      questionIndex,
      normalizeWctIdentity(pair.heading),
      normalizeWctIdentity(pair.example)
    ].join(":"),
    kind: "pattern",
    prompt: `"${pair.heading}"에 맞는 예문을 고르세요.`,
    correctText: pair.example,
    explanation: `${pair.heading} · ${pair.example}`,
    distractorPool
  }));
}

export function buildPremiumWctQuizSource(
  lesson: WctPremiumLesson
): WctQuizSource {
  const facts = premiumSectionFacts(lesson);
  const pairs = premiumHeadedExamples(lesson);
  return {
    lessonKey: premiumWctLessonKey(lesson.id),
    sourceKind: "wct_premium",
    sourceId: lesson.id,
    sourceHashInput: lesson,
    seeds: [
      ...premiumConceptSeeds(facts),
      ...premiumPatternSeeds(lesson, pairs)
    ]
  };
}
