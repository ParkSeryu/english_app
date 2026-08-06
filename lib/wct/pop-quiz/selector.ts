import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

import type { WctDaySummary } from "@/lib/wct/types";
import type { WctQuizQuestionFormat } from "@/lib/wct/quiz/types";

import {
  type WctPopQuizBand,
  type WctPopQuizCandidate,
  type WctPopQuizQuestion,
  type WctPopQuizSelectionInput
} from "./types";
import { wctPopQuizQuestionsSchema } from "./validation";

function rank(seed: string, candidate: WctPopQuizCandidate) {
  return createHash("sha256")
    .update(`${seed}\0${candidate.sourceQuizSetId}\0${candidate.question.id}`)
    .digest("hex");
}

function buildBandByDayId(days: WctDaySummary[]) {
  const orderedDays = [...days].sort((left, right) => left.dayNumber - right.dayNumber);
  const earlyLength = Math.ceil(orderedDays.length / 3);
  const middleLength = Math.ceil((orderedDays.length - earlyLength) / 2);
  const bandByDayId = new Map<string, WctPopQuizBand>();

  orderedDays.forEach((day, index) => {
    bandByDayId.set(day.id, index < earlyLength ? "early" : index < earlyLength + middleLength ? "middle" : "late");
  });
  return bandByDayId;
}

function signature(questions: WctPopQuizQuestion[]) {
  return questions
    .map((item) => `${item.sourceQuizSetId}:${item.question.id}`)
    .sort()
    .join("|");
}

function orderedDays(input: WctPopQuizSelectionInput) {
  const days = [...input.book.days].sort((left, right) => left.dayNumber - right.dayNumber);
  if (
    new Set(days.map((day) => day.id)).size !== days.length
    || new Set(days.map((day) => day.dayNumber)).size !== days.length
    || days.some((day) => !Number.isInteger(day.dayNumber) || day.dayNumber <= 0)
  ) {
    throw new Error("Pop Quiz needs one complete quiz version");
  }
  return days;
}

function selectLegacyForSeed(input: WctPopQuizSelectionInput, seed: string) {
  const bandByDayId = buildBandByDayId(input.book.days);
  return orderedDays(input).map((day) => {
    const eligible = input.candidates
      .filter((candidate) => candidate.dayId === day.id && candidate.question.kind !== "concept")
      .sort((left, right) => rank(seed, left).localeCompare(rank(seed, right)));
    const candidate = eligible[0];
    if (!candidate) throw new Error("Pop Quiz needs one eligible question per Day");
    return { ...candidate, band: bandByDayId.get(day.id)! };
  });
}

const formatSchedule: WctQuizQuestionFormat[] = [
  "multiple_choice",
  "fill_blank",
  "true_false"
];

export function nextWctQuizFormat(
  format: WctQuizQuestionFormat
): WctQuizQuestionFormat {
  if (format === "multiple_choice") return "fill_blank";
  if (format === "fill_blank") return "true_false";
  return "multiple_choice";
}

function seedOffset(seed: string) {
  return createHash("sha256").update(seed).digest()[0] % formatSchedule.length;
}

function previousV2QuestionsByDay(
  input: WctPopQuizSelectionInput,
  days: WctDaySummary[]
) {
  const previousQuestions = input.previousQuestions;
  if (!previousQuestions) return new Map<string, WctPopQuizQuestion>();
  const previousDayIds = previousQuestions.map((item) => item.dayId);
  if (
    previousQuestions.length !== days.length
    || new Set(previousDayIds).size !== previousQuestions.length
  ) {
    throw new Error("Pop Quiz needs one complete quiz version");
  }

  const dayById = new Map(days.map((day) => [day.id, day]));
  for (const previous of previousQuestions) {
    const day = dayById.get(previous.dayId);
    const matchesCandidate = input.candidates.some((candidate) => (
      candidate.sourceQuizSetId === previous.sourceQuizSetId
      && candidate.dayId === previous.dayId
      && candidate.dayNumber === previous.dayNumber
      && candidate.dayLabel === previous.dayLabel
      && candidate.dayTopic === previous.dayTopic
      && isDeepStrictEqual(candidate.question, previous.question)
    ));
    if (
      !day
      || previous.dayNumber !== day.dayNumber
      || previous.dayLabel !== day.displayLabel
      || previous.dayTopic !== day.shortLabel
      || !previous.question.format
      || !matchesCandidate
    ) {
      throw new Error("Pop Quiz needs one complete quiz version");
    }
  }
  if (days.some((day) => !previousDayIds.includes(day.id))) {
    throw new Error("Pop Quiz needs one complete quiz version");
  }
  return new Map(previousQuestions.map((item) => [item.dayId, item]));
}

function selectV2(input: WctPopQuizSelectionInput) {
  const days = orderedDays(input);
  const bandByDayId = buildBandByDayId(days);
  const previousByDayId = previousV2QuestionsByDay(input, days);
  const offset = seedOffset(input.seed);

  return days.map((day, index) => {
    const previous = previousByDayId.get(day.id);
    const targetFormat = previous?.question.format
      ? nextWctQuizFormat(previous.question.format)
      : formatSchedule[(index + offset) % formatSchedule.length];
    const candidate = input.candidates
      .filter((item) => (
        item.dayId === day.id
        && item.question.format === targetFormat
        && item.question.id !== previous?.question.id
      ))
      .sort((left, right) => rank(input.seed, left).localeCompare(rank(input.seed, right)))[0];
    if (!candidate) {
      throw new Error(`Pop Quiz needs ${targetFormat} question for Day ${day.dayNumber}`);
    }
    return { ...candidate, band: bandByDayId.get(day.id)! };
  });
}

export function selectWctPopQuizQuestions(input: WctPopQuizSelectionInput): WctPopQuizQuestion[] {
  const level = input.book.levelLabel?.replace(/\s/g, "").toLowerCase();
  if (level !== "prenovice" && level !== "novice") {
    throw new Error("Pop Quiz is only available for Prenovice and Novice");
  }

  const isV2 = input.sourceVersion === "wct-review-v2";
  if (input.candidates.some((candidate) => (
    isV2 ? candidate.question.format === undefined : candidate.question.format !== undefined
  ))) {
    throw new Error("Pop Quiz needs one complete quiz version");
  }
  if (isV2) {
    return wctPopQuizQuestionsSchema.parse(selectV2(input));
  }

  const previousSignature = input.previousQuestions
    ? signature(input.previousQuestions)
    : null;

  for (let retry = 0; retry <= 10; retry += 1) {
    const seed = retry === 0 ? input.seed : `${input.seed}:${retry}`;
    const selected = selectLegacyForSeed(input, seed);
    if (signature(selected) !== previousSignature) {
      return wctPopQuizQuestionsSchema.parse(selected);
    }
  }

  throw new Error("Pop Quiz needs one eligible question per Day");
}
