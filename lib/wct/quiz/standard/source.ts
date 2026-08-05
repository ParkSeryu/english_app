import { createHash } from "node:crypto";

import {
  normalizeWctIdentity,
  stableStringify
} from "../../normalization.ts";
import type { WctBook, WctDay } from "../../types.ts";
import { standardWctLessonKey } from "../keys.ts";
import type {
  WctStandardLevel,
  WctStandardQuizSource,
  WctStandardSourceEntry
} from "./types.ts";

const forbiddenLearnerMetadata = /(?:^|[^a-z0-9])(?:wct|day\s*#?\s*\d+|course|pre\s*novice|prenovice|novice|premium)(?=$|[^a-z0-9])/iu;

function canonicalText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function nullableCanonicalText(value: string | null) {
  const canonical = value === null ? "" : canonicalText(value);
  return canonical || null;
}

function hasForbiddenMetadata(values: readonly (string | null)[]) {
  return values.some((value) => value !== null && forbiddenLearnerMetadata.test(value));
}

function identityLevel(value: string | null): WctStandardLevel | null {
  if (!value) return null;
  const normalized = normalizeWctIdentity(value);
  if (/(?:^|\s)pre\s*novice(?:$|\s)/u.test(normalized)
    || /(?:^|\s)prenovice(?:$|\s)/u.test(normalized)) {
    return "prenovice";
  }
  if (/(?:^|\s)novice(?:$|\s)/u.test(normalized)) return "novice";
  return null;
}

function hasPremiumIdentity(value: string | null) {
  if (!value) return false;
  return /(?:^|[^a-z0-9])premium(?:$|[^a-z0-9])/iu.test(normalizeWctIdentity(value));
}

export function resolveStandardWctLevel(book: WctBook): WctStandardLevel {
  const normalizedTitle = normalizeWctIdentity(book.title);
  const titleLevel = identityLevel(normalizedTitle);
  const labelLevel = identityLevel(book.levelLabel);
  const hasWctIdentity = /(?:^|\s)wct(?:$|\s)/u.test(normalizedTitle);

  if (hasPremiumIdentity(book.title)
    || hasPremiumIdentity(book.levelLabel)
    || !hasWctIdentity
    || !titleLevel
    || !labelLevel
    || titleLevel !== labelLevel) {
    throw new Error("WCT v2 requires a matching Prenovice or Novice book");
  }
  return titleLevel;
}

function canonicalEntries(day: WctDay): WctStandardSourceEntry[] {
  return [...day.patterns]
    .sort((left, right) => (
      left.sortOrder - right.sortOrder || left.id.localeCompare(right.id)
    ))
    .flatMap((pattern) => {
      const patternText = canonicalText(pattern.patternText);
      const patternMeaningKo = nullableCanonicalText(pattern.meaningKo);
      const usageNote = nullableCanonicalText(pattern.usageNote);
      if (!patternText || pattern.sourceNeedsReview || hasForbiddenMetadata([
        patternText,
        patternMeaningKo,
        usageNote
      ])) {
        return [];
      }

      return [...pattern.examples]
        .sort((left, right) => (
          left.sortOrder - right.sortOrder || left.id.localeCompare(right.id)
        ))
        .flatMap((example) => {
          const englishText = canonicalText(example.englishText);
          const meaningKo = nullableCanonicalText(example.meaningKo);
          if (!englishText || example.sourceNeedsReview || hasForbiddenMetadata([
            englishText,
            meaningKo
          ])) {
            return [];
          }
          return [{
            patternId: pattern.id,
            exampleId: example.id,
            patternText,
            patternMeaningKo,
            usageNote,
            englishText,
            meaningKo
          }];
        });
    });
}

function canonicalSourceInput(book: WctBook, day: WctDay) {
  const level = resolveStandardWctLevel(book);
  const topic = canonicalText(day.shortLabel);
  const lessonKey = standardWctLessonKey(book.title, day.dayNumber);
  const entries = canonicalEntries(day);

  if (day.sourceNeedsReview
    || !topic
    || hasForbiddenMetadata([topic])
    || entries.length === 0) {
    throw new Error("WCT v2 needs approved target-Day source");
  }

  return {
    lessonKey,
    sourceId: day.id,
    level,
    dayNumber: day.dayNumber,
    topic,
    entries
  };
}

function hashCanonicalSource(input: ReturnType<typeof canonicalSourceInput>) {
  const sourceHashInput = {
    lessonKey: input.lessonKey,
    sourceId: input.sourceId,
    level: input.level,
    dayNumber: input.dayNumber,
    topic: input.topic,
    entries: input.entries.map((entry) => ({
      patternId: entry.patternId,
      exampleId: entry.exampleId,
      patternText: entry.patternText,
      patternMeaningKo: entry.patternMeaningKo,
      usageNote: entry.usageNote,
      englishText: entry.englishText,
      meaningKo: entry.meaningKo
    }))
  };
  return createHash("sha256").update(stableStringify(sourceHashInput)).digest("hex");
}

export function computeStandardWctQuizSourceHash(book: WctBook, day: WctDay) {
  return hashCanonicalSource(canonicalSourceInput(book, day));
}

export function buildStandardWctQuizSource(
  book: WctBook,
  day: WctDay
): WctStandardQuizSource {
  const canonical = canonicalSourceInput(book, day);
  return {
    ...canonical,
    sourceHash: hashCanonicalSource(canonical)
  };
}
