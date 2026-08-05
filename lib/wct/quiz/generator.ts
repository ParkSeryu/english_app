import { createHash } from "node:crypto";

import { normalizeWctIdentity, stableStringify } from "../normalization.ts";
import {
  WCT_PREMIUM_QUIZ_GENERATOR_VERSION,
  type WctQuizQuestionSeed,
  type WctQuizSetCreateInput,
  type WctQuizSource
} from "./types.ts";
import { wctQuizSetCreateSchema } from "./validation.ts";

function stableRank(scope: string, value: string) {
  return createHash("sha256").update(`${scope}\0${value}`).digest("hex");
}

function distinctText(values: readonly string[]) {
  const distinct = new Map<string, string>();
  for (const value of values) {
    const trimmed = value.trim();
    const normalized = normalizeWctIdentity(trimmed);
    if (trimmed && !distinct.has(normalized)) {
      distinct.set(normalized, trimmed);
    }
  }
  return [...distinct.values()];
}

function buildQuestion(
  source: WctQuizSource,
  seed: WctQuizQuestionSeed,
  questionIndex: number
) {
  const correctText = seed.correctText.trim();
  const normalizedCorrect = normalizeWctIdentity(correctText);
  const distractors = distinctText(seed.distractorPool)
    .filter((value) => normalizeWctIdentity(value) !== normalizedCorrect)
    .sort((left, right) => (
      stableRank(seed.seedKey, left)
        .localeCompare(stableRank(seed.seedKey, right))
    ))
    .slice(0, 3);

  if (distractors.length !== 3) {
    throw new Error("WCT quiz needs four distinct choices");
  }

  const questionId = `q-${stableRank(
    source.lessonKey,
    `${questionIndex}:${seed.seedKey}`
  ).slice(0, 16)}`;
  const choices = [correctText, ...distractors]
    .sort((left, right) => (
      stableRank(questionId, left).localeCompare(stableRank(questionId, right))
    ))
    .map((text) => ({
      id: `c-${stableRank(questionId, text).slice(0, 16)}`,
      text
    }));
  const correctChoice = choices.find((choice) => (
    normalizeWctIdentity(choice.text) === normalizedCorrect
  ));
  if (!correctChoice) {
    throw new Error("WCT quiz correct choice is missing");
  }

  return {
    id: questionId,
    kind: seed.kind,
    prompt: seed.prompt.trim(),
    choices,
    correctChoiceId: correctChoice.id,
    explanation: seed.explanation.trim()
  };
}

export function generateLegacyWctQuizSetDraft(
  source: WctQuizSource
): WctQuizSetCreateInput {
  if (source.seeds.length !== 5) {
    throw new Error("WCT quiz needs exactly five questions");
  }
  const questions = source.seeds.map((seed, questionIndex) => (
    buildQuestion(source, seed, questionIndex)
  ));

  return wctQuizSetCreateSchema.parse({
    lessonKey: source.lessonKey,
    sourceKind: source.sourceKind,
    sourceId: source.sourceId,
    generatorVersion: WCT_PREMIUM_QUIZ_GENERATOR_VERSION,
    sourceHash: stableRank(
      source.lessonKey,
      stableStringify(source.sourceHashInput)
    ),
    questions
  });
}

export function generatePremiumWctQuizSetDraft(
  source: WctQuizSource
): WctQuizSetCreateInput {
  if (source.sourceKind !== "wct_premium") {
    throw new Error("Premium v1 generator requires a Premium source");
  }
  return generateLegacyWctQuizSetDraft(source);
}

export const generateWctQuizSetDraft = generateLegacyWctQuizSetDraft;
