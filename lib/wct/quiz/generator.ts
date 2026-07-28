import { createHash } from "node:crypto";

import { normalizeWctIdentity, stableStringify } from "@/lib/wct/normalization";
import {
  WCT_QUIZ_GENERATOR_VERSION,
  type WctQuizQuestionSeed,
  type WctQuizSetCreateInput,
  type WctQuizSource
} from "@/lib/wct/quiz/types";
import { wctQuizSetCreateSchema } from "@/lib/wct/quiz/validation";

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

export function generateWctQuizSetDraft(
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
    generatorVersion: WCT_QUIZ_GENERATOR_VERSION,
    sourceHash: stableRank(
      source.lessonKey,
      stableStringify(source.sourceHashInput)
    ),
    questions
  });
}
