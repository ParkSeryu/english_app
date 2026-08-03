import { createHash } from "node:crypto";

import type { WctDaySummary } from "@/lib/wct/types";

import {
  WCT_POP_QUIZ_TOTAL,
  type WctPopQuizBand,
  type WctPopQuizCandidate,
  type WctPopQuizQuestion,
  type WctPopQuizSelectionInput
} from "./types";
import { wctPopQuizQuestionsSchema } from "./validation";

const cellQuota = {
  early: { translation: 4, pattern: 3 },
  middle: { translation: 4, pattern: 3 },
  late: { translation: 4, pattern: 2 }
} as const;

const bands: WctPopQuizBand[] = ["early", "middle", "late"];
const kinds = ["translation", "pattern"] as const;
const MAX_BACKTRACK_STEPS = 50_000;

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
  const eligible = input.candidates.filter((candidate) => (
    bandByDayId.has(candidate.dayId)
    && candidate.question.kind !== "concept"
  ));
  if (eligible.length < WCT_POP_QUIZ_TOTAL) {
    return null;
  }

  const cells = bands.flatMap((band) => kinds.map((kind) => ({ band, kind, quota: cellQuota[band][kind] })));
  const candidatesByCell = new Map(cells.map((cell) => [
    `${cell.band}:${cell.kind}`,
    eligible
      .filter((candidate) => bandByDayId.get(candidate.dayId) === cell.band && candidate.question.kind === cell.kind)
      .sort((left, right) => rank(seed, left).localeCompare(rank(seed, right)))
  ]));

  if (cells.some((cell) => (candidatesByCell.get(`${cell.band}:${cell.kind}`)?.length ?? 0) < cell.quota)) {
    return null;
  }

  const selected: WctPopQuizQuestion[] = [];
  const usedQuestionIds = new Set<string>();
  const dayCounts = new Map<string, number>();
  let steps = 0;

  function choose(cellIndex: number, candidateIndex: number, remaining: number): boolean {
    if (++steps > MAX_BACKTRACK_STEPS) return false;
    if (cellIndex === cells.length) return selected.length === WCT_POP_QUIZ_TOTAL;

    const cell = cells[cellIndex];
    const candidates = candidatesByCell.get(`${cell.band}:${cell.kind}`) ?? [];
    if (remaining === 0) return choose(cellIndex + 1, 0, cells[cellIndex + 1]?.quota ?? 0);
    if (candidates.length - candidateIndex < remaining) return false;

    for (let index = candidateIndex; index < candidates.length; index += 1) {
      const candidate = candidates[index];
      if (usedQuestionIds.has(candidate.question.id) || (dayCounts.get(candidate.dayId) ?? 0) >= 2) continue;

      usedQuestionIds.add(candidate.question.id);
      dayCounts.set(candidate.dayId, (dayCounts.get(candidate.dayId) ?? 0) + 1);
      selected.push({ ...candidate, band: cell.band });
      if (choose(cellIndex, index + 1, remaining - 1)) return true;
      selected.pop();
      usedQuestionIds.delete(candidate.question.id);
      const nextDayCount = (dayCounts.get(candidate.dayId) ?? 1) - 1;
      if (nextDayCount === 0) dayCounts.delete(candidate.dayId);
      else dayCounts.set(candidate.dayId, nextDayCount);
    }
    return false;
  }

  return choose(0, 0, cells[0].quota) ? selected : null;
}

export function selectWctPopQuizQuestions(input: WctPopQuizSelectionInput): WctPopQuizQuestion[] {
  for (let retry = 0; retry <= 10; retry += 1) {
    const seed = retry === 0 ? input.seed : `${input.seed}:${retry}`;
    const selected = selectForSeed(input, seed);
    if (!selected) break;
    if (signature(selected) !== input.previousSignature) {
      return wctPopQuizQuestionsSchema.parse(selected);
    }
  }

  throw new Error("Pop Quiz needs 20 eligible questions");
}
