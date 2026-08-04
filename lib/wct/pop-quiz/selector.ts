import { createHash } from "node:crypto";

import type { WctDaySummary } from "@/lib/wct/types";

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

function selectForSeed(input: WctPopQuizSelectionInput, seed: string) {
  const bandByDayId = buildBandByDayId(input.book.days);
  const orderedDays = [...input.book.days].sort((left, right) => left.dayNumber - right.dayNumber);
  return orderedDays.map((day) => {
    const eligible = input.candidates
      .filter((candidate) => candidate.dayId === day.id && candidate.question.kind !== "concept")
      .sort((left, right) => rank(seed, left).localeCompare(rank(seed, right)));
    const candidate = eligible[0];
    if (!candidate) throw new Error("Pop Quiz needs one eligible question per Day");
    return { ...candidate, band: bandByDayId.get(day.id)! };
  });
}

export function selectWctPopQuizQuestions(input: WctPopQuizSelectionInput): WctPopQuizQuestion[] {
  const level = input.book.levelLabel?.replace(/\s/g, "").toLowerCase();
  if (level !== "prenovice" && level !== "novice") {
    throw new Error("Pop Quiz is only available for Prenovice and Novice");
  }

  for (let retry = 0; retry <= 10; retry += 1) {
    const seed = retry === 0 ? input.seed : `${input.seed}:${retry}`;
    const selected = selectForSeed(input, seed);
    if (signature(selected) !== input.previousSignature) {
      return wctPopQuizQuestionsSchema.parse(selected);
    }
  }

  throw new Error("Pop Quiz needs one eligible question per Day");
}
