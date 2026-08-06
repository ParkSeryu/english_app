import { createHash } from "node:crypto";

import {
  normalizeWctIdentity,
  stableStringify
} from "../../normalization.ts";
import type { WctBook, WctDay } from "../../types.ts";
import { wctStandardQuizSetCreateSchema } from "../validation.ts";
import {
  auditStandardQuestionCandidate,
  buildFillBlankCandidates,
  buildMultipleChoiceCandidates,
  buildTrueFalseCandidate
} from "./candidates.ts";
import {
  STANDARD_WCT_DAY_OVERRIDES,
  type WctStandardDayOverride
} from "./overrides.ts";
import {
  eligibleStandardExampleIds,
  hasBalancedStandardSourceUsage,
  hasUniqueStandardLearningTargets,
  standardLearningTargetKey
} from "./diversity.ts";
import { buildStandardWctQuizSource } from "./source.ts";
import type {
  WctGeneratedStandardQuizBook,
  WctGeneratedStandardQuizSet,
  WctStandardLevel,
  WctStandardQuestionCandidate,
  WctStandardQuizSource
} from "./types.ts";

const GENERATOR_VERSION = "wct-review-v2" as const;
const PRODUCTION_STANDARD_BOOK_IDS = new Set([
  "4a71e072-96de-4722-8874-c35b3ca97ec1",
  "c4ab0760-3c31-4533-9631-0e2ead3bfe90"
]);
type StandardFormat = "multiple_choice" | "fill_blank" | "true_false";
type StandardKind = "translation" | "pattern";
type TruthState = "O" | "X";
type Slot = { format: StandardFormat; kind: StandardKind };

function sha256(...parts: string[]) {
  return createHash("sha256").update(parts.join("\0")).digest("hex");
}

export function orderStandardChoiceTexts(
  source: Pick<WctStandardQuizSource, "lessonKey" | "sourceHash">,
  slotIndex: number,
  texts: readonly string[]
) {
  return [...texts].sort((left, right) => (
    sha256(
      GENERATOR_VERSION,
      source.lessonKey,
      source.sourceHash,
      String(slotIndex),
      "choice-order",
      left
    ).localeCompare(sha256(
      GENERATOR_VERSION,
      source.lessonKey,
      source.sourceHash,
      String(slotIndex),
      "choice-order",
      right
    )) || left.localeCompare(right)
  ));
}

function uniquePermutations<T extends string>(values: readonly T[]) {
  const counts = new Map<T, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  const keys = [...counts.keys()].sort();
  const result: T[][] = [];
  const current: T[] = [];
  const visit = () => {
    if (current.length === values.length) {
      result.push([...current]);
      return;
    }
    for (const key of keys) {
      const count = counts.get(key) ?? 0;
      if (count === 0) continue;
      counts.set(key, count - 1);
      current.push(key);
      visit();
      current.pop();
      counts.set(key, count);
    }
  };
  visit();
  return result;
}

function slotPlansForSource(source: WctStandardQuizSource): Slot[][] {
  const formats = uniquePermutations<StandardFormat>([
    "multiple_choice", "multiple_choice", "fill_blank", "fill_blank", "true_false"
  ]).filter((permutation) => permutation.every((format, index) => (
    index === 0 || format !== permutation[index - 1]
  )));
  const kinds = uniquePermutations<StandardKind>([
    "translation", "translation", "translation", "pattern", "pattern"
  ]);
  return formats.flatMap((formatPlan) => kinds.map((kindPlan) => (
    formatPlan.map((format, index) => ({ format, kind: kindPlan[index] }))
  ))).sort((left, right) => {
    const leftKey = left.map((slot) => `${slot.format}:${slot.kind}`).join("\0");
    const rightKey = right.map((slot) => `${slot.format}:${slot.kind}`).join("\0");
    return sha256(source.lessonKey, source.sourceHash, "slots", leftKey)
      .localeCompare(sha256(source.lessonKey, source.sourceHash, "slots", rightKey))
      || leftKey.localeCompare(rightKey);
  });
}

function candidatesFor(
  source: WctStandardQuizSource,
  entryIndex: number,
  slot: Slot,
  state: TruthState
) {
  const entry = source.entries[entryIndex];
  if (slot.format === "multiple_choice") {
    return buildMultipleChoiceCandidates(entry, slot.kind);
  }
  if (slot.format === "fill_blank") {
    return buildFillBlankCandidates(entry, slot.kind);
  }
  const candidate = buildTrueFalseCandidate(entry, state, slot.kind);
  return candidate ? [candidate] : [];
}

function candidateKey(candidate: WctStandardQuestionCandidate) {
  return [
    candidate.question.format,
    candidate.question.kind,
    candidate.provenance.patternId,
    candidate.provenance.exampleId,
    candidate.question.prompt,
    ...candidate.question.choices.map((choice) => choice.text)
  ].join("\0");
}

function candidateRuleFamily(candidate: WctStandardQuestionCandidate) {
  return candidate.provenance.statementMutation?.ruleFamily
    ?? candidate.provenance.choiceEvidence.find((evidence) => evidence.mutation)
      ?.mutation?.ruleFamily
    ?? "";
}

function whCandidateTier(slot: Slot, candidate: WctStandardQuestionCandidate) {
  if (!/\bwh\b/iu.test(candidate.question.feedback.pattern)) return 0;
  const family = candidateRuleFamily(candidate);
  if (slot.kind === "pattern") {
    if (family === "direct_question_order") return 0;
    if (family === "wh_auxiliary_form" || family === "wh_base_verb") return 1;
    if (family === "wh_question_word" || family === "wh_question_subject") return 3;
    return 2;
  }
  return family === "wh_question_word" || family === "wh_question_subject" ? 0 : 1;
}

function rankedCandidates(
  source: WctStandardQuizSource,
  slot: Slot,
  slotIndex: number,
  state: TruthState
) {
  return source.entries
    .flatMap((_entry, entryIndex) => candidatesFor(source, entryIndex, slot, state))
    .sort((left, right) => {
      const tier = whCandidateTier(slot, left) - whCandidateTier(slot, right);
      if (tier !== 0) return tier;
      const leftRank = sha256(
        GENERATOR_VERSION,
        source.lessonKey,
        source.sourceHash,
        String(slotIndex),
        slot.format,
        slot.kind,
        left.provenance.patternId,
        left.provenance.exampleId
      );
      const rightRank = sha256(
        GENERATOR_VERSION,
        source.lessonKey,
        source.sourceHash,
        String(slotIndex),
        slot.format,
        slot.kind,
        right.provenance.patternId,
        right.provenance.exampleId
      );
      return leftRank.localeCompare(rightRank)
        || candidateKey(left).localeCompare(candidateKey(right))
        || stableStringify(left).localeCompare(stableStringify(right));
    });
}

function materializeCandidate(
  source: WctStandardQuizSource,
  candidate: WctStandardQuestionCandidate,
  slotIndex: number
): WctStandardQuestionCandidate {
  const question = candidate.question;
  const correctText = question.choices.find(
    (choice) => choice.id === question.correctChoiceId
  )?.text;
  if (!correctText) throw new Error(`WCT v2 Day ${source.dayNumber} has no correct choice`);
  const evidenceByText = new Map(candidate.provenance.choiceEvidence.map((evidence) => (
    [evidence.choiceText, evidence] as const
  )));
  const orderedTexts = question.format === "true_false"
    ? question.choices.map((choice) => choice.text)
    : orderStandardChoiceTexts(
        source,
        slotIndex,
        question.choices.map((choice) => choice.text)
      );
  const displayedContent = stableStringify({
    kind: question.kind,
    format: question.format,
    prompt: question.prompt,
    choices: orderedTexts,
    correctText,
    explanation: question.explanation,
    feedback: question.feedback
  });
  const questionId = `qv2-${sha256(
    GENERATOR_VERSION,
    source.lessonKey,
    source.sourceHash,
    String(slotIndex),
    question.format,
    question.kind,
    candidate.provenance.patternId,
    candidate.provenance.exampleId,
    displayedContent
  )}`;
  const choices = orderedTexts.map((text) => ({
    id: `cv2-${sha256(questionId, text)}`,
    text
  }));
  const correctChoice = choices.find((choice) => (
    normalizeWctIdentity(choice.text) === normalizeWctIdentity(correctText)
  ));
  if (!correctChoice
    || new Set(choices.map((choice) => choice.id)).size !== choices.length) {
    throw new Error(`WCT v2 Day ${source.dayNumber} has a choice ID collision`);
  }
  return {
    question: {
      ...question,
      id: questionId,
      choices,
      correctChoiceId: correctChoice.id
    },
    provenance: {
      ...structuredClone(candidate.provenance),
      choiceEvidence: orderedTexts.map((text) => structuredClone(evidenceByText.get(text)!))
    }
  };
}

function composeAutomaticDay(source: WctStandardQuizSource, state: TruthState) {
  const eligibleExamples = eligibleStandardExampleIds(source, state);
  const rankedCache = new Map<string, WctStandardQuestionCandidate[]>();
  const candidatesForSlot = (slot: Slot, slotIndex: number) => {
    const key = `${slotIndex}:${slot.format}:${slot.kind}`;
    const cached = rankedCache.get(key);
    if (cached) return cached;
    const ranked = rankedCandidates(source, slot, slotIndex, state);
    rankedCache.set(key, ranked);
    return ranked;
  };
  const sourceIdentity = (candidate: WctStandardQuestionCandidate) => (
    `${candidate.provenance.patternId}\0${candidate.provenance.exampleId}`
  );
  const isExactO = (candidate: WctStandardQuestionCandidate) => (
    candidate.question.format === "true_false"
    && truthState(candidate) === "O"
    && candidate.provenance.statementMutation === undefined
  );
  const exactOReuseCount = (candidates: readonly WctStandardQuestionCandidate[]) => {
    const exactO = candidates.find(isExactO);
    return exactO
      ? candidates.filter((candidate) => (
          sourceIdentity(candidate) === sourceIdentity(exactO)
        )).length - 1
      : 0;
  };
  for (let allowedExactOReuses = 0; allowedExactOReuses < 5; allowedExactOReuses += 1) {
    for (const slots of slotPlansForSource(source)) {
      const selected: WctStandardQuestionCandidate[] = [];
      const usedCandidates = new Set<string>();
      const usedLearningTargets = new Set<string>();
      const usedPrompts = new Set<string>();
      const visit = (slotIndex: number): boolean => {
        if (slotIndex === slots.length) {
          return hasBalancedStandardSourceUsage(source, selected, state, eligibleExamples);
        }
        for (const candidate of candidatesForSlot(slots[slotIndex], slotIndex)) {
          const key = candidateKey(candidate);
          const learningTarget = standardLearningTargetKey(candidate);
          const prompt = normalizeWctIdentity(candidate.question.prompt);
          if (usedCandidates.has(key)
            || usedLearningTargets.has(learningTarget)
            || usedPrompts.has(prompt)
            || exactOReuseCount([...selected, candidate]) > allowedExactOReuses
            || (eligibleExamples.size >= slots.length && selected.some((item) => (
              item.provenance.exampleId === candidate.provenance.exampleId
            )))) continue;
          usedCandidates.add(key);
          usedLearningTargets.add(learningTarget);
          usedPrompts.add(prompt);
          selected.push(candidate);
          if (visit(slotIndex + 1)) return true;
          selected.pop();
          usedCandidates.delete(key);
          usedLearningTargets.delete(learningTarget);
          usedPrompts.delete(prompt);
        }
        return false;
      };
      if (visit(0)) {
        return selected.map((candidate, index) => (
          materializeCandidate(source, candidate, index)
        ));
      }
    }
  }
  return null;
}

function truthState(candidate: WctStandardQuestionCandidate): TruthState | null {
  if (candidate.question.format !== "true_false") return null;
  const correct = candidate.question.choices.find(
    (choice) => choice.id === candidate.question.correctChoiceId
  )?.text;
  return correct === "O" || correct === "X" ? correct : null;
}

function expectedPrompt(
  candidate: WctStandardQuestionCandidate,
  sourceEntry: WctStandardQuizSource["entries"][number]
) {
  if (candidate.question.format !== "multiple_choice") return true;
  if (candidate.question.kind === "translation") {
    return sourceEntry.meaningKo !== null
      && candidate.question.prompt === `"${sourceEntry.meaningKo}"에 맞는 영어 문장을 고르세요.`;
  }
  return sourceEntry.meaningKo !== null
    && candidate.question.prompt
      === `"${sourceEntry.patternText}" 패턴을 사용해 "${sourceEntry.meaningKo}"에 맞는 영어 문장을 고르세요.`;
}

function overrideMatchesSource(
  source: WctStandardQuizSource,
  candidate: WctStandardQuestionCandidate
) {
  const entry = source.entries.find((item) => (
    item.patternId === candidate.provenance.patternId
    && item.exampleId === candidate.provenance.exampleId
  ));
  if (!entry
    || candidate.provenance.sourceSentence !== entry.englishText
    || candidate.question.feedback.correctSentence !== entry.englishText
    || candidate.question.feedback.pattern !== entry.patternText
    || !expectedPrompt(candidate, entry)
    || !auditStandardQuestionCandidate(candidate)) return false;
  const correctText = candidate.question.choices.find(
    (choice) => choice.id === candidate.question.correctChoiceId
  )?.text;
  if (candidate.question.format === "multiple_choice") {
    return correctText === entry.englishText;
  }
  if (candidate.question.format === "fill_blank") {
    return Boolean(candidate.provenance.blankSpan
      && correctText === candidate.provenance.blankSpan.correctText);
  }
  return correctText === "O" || correctText === "X";
}

function materializeOverride(
  source: WctStandardQuizSource,
  override: WctStandardDayOverride
) {
  if (override.expectedSourceHash !== source.sourceHash) {
    throw new Error("WCT v2 override source hash mismatch");
  }
  if (override.questions.length !== 5
    || override.questions.some((candidate) => !overrideMatchesSource(source, candidate))) {
    throw new Error("WCT v2 override target source mismatch");
  }
  const materialized = override.questions.map((candidate, index) => (
    materializeCandidate(source, candidate, index)
  ));
  const formats = materialized.map((candidate) => candidate.question.format);
  const kinds = materialized.map((candidate) => candidate.question.kind);
  const prompts = materialized.map((candidate) => normalizeWctIdentity(
    candidate.question.prompt
  ));
  const overrideState = truthState(materialized.find((candidate) => (
    candidate.question.format === "true_false"
  ))!)!;
  const eligibleExamples = eligibleStandardExampleIds(source, overrideState);
  const draft = {
    lessonKey: source.lessonKey,
    sourceKind: "wct_day" as const,
    sourceId: source.sourceId,
    generatorVersion: GENERATOR_VERSION,
    sourceHash: source.sourceHash,
    questions: materialized.map((candidate) => candidate.question)
  };
  if (!wctStandardQuizSetCreateSchema.safeParse(draft).success
    || formats.filter((format) => format === "multiple_choice").length !== 2
    || formats.filter((format) => format === "fill_blank").length !== 2
    || formats.filter((format) => format === "true_false").length !== 1
    || kinds.filter((kind) => kind === "translation").length !== 3
    || kinds.filter((kind) => kind === "pattern").length !== 2
    || formats.some((format, index) => index > 0 && format === formats[index - 1])
    || new Set(prompts).size !== prompts.length
    || !hasBalancedStandardSourceUsage(
      source,
      materialized,
      overrideState,
      eligibleExamples
    )
    || !hasUniqueStandardLearningTargets(materialized)
    || materialized.filter((candidate) => truthState(candidate) !== null).length !== 1) {
    throw new Error("WCT v2 override must provide one compliant five-question Day");
  }
  return materialized;
}

function indexOverrides(
  sources: readonly WctStandardQuizSource[],
  overrides: readonly WctStandardDayOverride[]
) {
  const sourceByKey = new Map<string, WctStandardQuizSource>(sources.map((source) => (
    [`${source.level}:${source.dayNumber}`, source] as const
  )));
  const indexed = new Map<string, WctStandardQuestionCandidate[]>();
  const level = sources[0]?.level;
  for (const override of overrides.filter((item) => item.level === level)) {
    const key = `${override.level}:${override.dayNumber}`;
    const source = sourceByKey.get(key);
    if (!source || indexed.has(key)) {
      throw new Error("WCT v2 override targets an ineligible or duplicate Day");
    }
    indexed.set(key, materializeOverride(source, override));
  }
  return indexed;
}

function truthStatesForPhases(
  dayCount: number,
  phases: readonly TruthState[]
) {
  const states = Array<TruthState>(dayCount);
  for (let residue = 0; residue < 3; residue += 1) {
    const positions = Array.from({ length: dayCount }, (_item, index) => index)
      .filter((index) => index % 3 === residue);
    for (const [index, position] of positions.entries()) {
      states[position] = index % 2 === 0
        ? phases[residue]
        : phases[residue] === "O" ? "X" : "O";
    }
  }
  return states;
}

function allocateTruthStates(
  sources: readonly WctStandardQuizSource[],
  overrides: ReadonlyMap<string, readonly WctStandardQuestionCandidate[]>,
  compose: (
    source: WctStandardQuizSource,
    state: TruthState
  ) => readonly WctStandardQuestionCandidate[] | null
) {
  const supportCache = new Map<string, boolean>();
  const supports = (index: number, state: TruthState) => {
    const cacheKey = `${index}:${state}`;
    const cached = supportCache.get(cacheKey);
    if (cached !== undefined) return cached;
    const source = sources[index];
    const fixed = overrides.get(`${source.level}:${source.dayNumber}`);
    const supported = fixed
      ? truthState(fixed.find((candidate) => candidate.question.format === "true_false")!) === state
      : compose(source, state) !== null;
    supportCache.set(cacheKey, supported);
    return supported;
  };
  const preferred = truthStatesForPhases(sources.length, ["O", "O", "X"]);
  const residuePositions = [0, 1, 2].map((residue) => (
    Array.from({ length: sources.length }, (_item, index) => index)
      .filter((index) => index % 3 === residue)
  ));
  const targetOptions = residuePositions.map((positions) => {
    const floor = Math.floor(positions.length / 2);
    const ceil = Math.ceil(positions.length / 2);
    const preferredCount = positions.filter((position) => preferred[position] === "O").length;
    return [...new Set([preferredCount, floor, ceil])];
  });
  const groupCache = new Map<string, { states: TruthState[]; cost: number } | null>();
  const bestGroup = (residue: number, targetO: number) => {
    const cacheKey = `${residue}:${targetO}`;
    if (groupCache.has(cacheKey)) return groupCache.get(cacheKey)!;
    const positions = residuePositions[residue];
    let best: { states: TruthState[]; cost: number; key: string } | null = null;
    const states: TruthState[] = [];
    const visit = (offset: number, countO: number, cost: number) => {
      const remaining = positions.length - offset;
      if (countO > targetO || countO + remaining < targetO) return;
      if (offset === positions.length) {
        const key = states.join("");
        if (!best || cost < best.cost || (cost === best.cost && key < best.key)) {
          best = { states: [...states], cost, key };
        }
        return;
      }
      const position = positions[offset];
      const preferredState = preferred[position];
      const alternatives: TruthState[] = [
        preferredState,
        preferredState === "O" ? "X" : "O"
      ];
      for (const state of alternatives) {
        if (!supports(position, state)) continue;
        states.push(state);
        visit(
          offset + 1,
          countO + (state === "O" ? 1 : 0),
          cost
            + (state === preferredState ? 0 : 1)
            + (states.length > 1 && states[states.length - 2] === state
              ? sources.length + 1
              : 0)
        );
        states.pop();
      }
    };
    visit(0, 0, 0);
    const selected = best as { states: TruthState[]; cost: number; key: string } | null;
    const result = selected ? { states: selected.states, cost: selected.cost } : null;
    groupCache.set(cacheKey, result);
    return result;
  };
  let bestAllocation: { states: TruthState[]; cost: number; key: string } | null = null;
  for (const residue0 of targetOptions[0]) {
    for (const residue1 of targetOptions[1]) {
      for (const residue2 of targetOptions[2]) {
        if (residue0 + residue1 + residue2 !== sources.length / 2) continue;
        const groups = [
          bestGroup(0, residue0),
          bestGroup(1, residue1),
          bestGroup(2, residue2)
        ];
        if (groups.some((group) => group === null)) continue;
        const states = Array<TruthState>(sources.length);
        for (let residue = 0; residue < groups.length; residue += 1) {
          residuePositions[residue].forEach((position, index) => {
            states[position] = groups[residue]!.states[index];
          });
        }
        const cost = groups.reduce((total, group) => total + group!.cost, 0);
        const key = states.join("");
        if (!bestAllocation
          || cost < bestAllocation.cost
          || (cost === bestAllocation.cost && key < bestAllocation.key)) {
          bestAllocation = { states, cost, key };
        }
      }
    }
  }
  if (bestAllocation) return bestAllocation.states;
  const unsupported = sources.flatMap((source, index) => {
    const supportsO = supports(index, "O");
    const supportsX = supports(index, "X");
    return supportsO && supportsX
      ? []
      : [`${source.level} Day ${source.dayNumber} (O=${supportsO}, X=${supportsX})`];
  });
  const unsafeIndex = sources.findIndex((_source, index) => (
    !supports(index, "X") || overrides.has(`${sources[index].level}:${sources[index].dayNumber}`)
  ));
  const failed = unsafeIndex === -1 ? 0 : unsafeIndex;
  throw new Error(
    `WCT v2 ${sources[failed].level} Day ${sources[failed].dayNumber} cannot satisfy balanced O/X allocation `
    + `(O=${supports(failed, "O")}, X=${supports(failed, "X")}); `
    + `unsupported=${unsupported.join(", ") || "balance-only"}`
  );
}

function inferredLevel(book: WctBook): WctStandardLevel {
  const title = normalizeWctIdentity(book.title);
  const label = normalizeWctIdentity(book.levelLabel ?? "");
  const titleLevel = /(?:^|\s)pre\s*novice(?:$|\s)|(?:^|\s)prenovice(?:$|\s)/u.test(title)
    ? "prenovice"
    : /(?:^|\s)novice(?:$|\s)/u.test(title) ? "novice" : null;
  const labelLevel = /(?:^|\s)pre\s*novice(?:$|\s)|(?:^|\s)prenovice(?:$|\s)/u.test(label)
    ? "prenovice"
    : /(?:^|\s)novice(?:$|\s)/u.test(label) ? "novice" : null;
  if (!/(?:^|\s)wct(?:$|\s)/u.test(title)
    || !titleLevel
    || titleLevel !== labelLevel) {
    throw new Error("WCT v2 requires a matching Prenovice or Novice book");
  }
  return titleLevel;
}

function validateInventory(book: WctBook, days: readonly WctDay[]) {
  const level = inferredLevel(book);
  const expected = level === "prenovice" ? 16 : 28;
  const label = level === "prenovice" ? "Prenovice" : "Novice";
  if (book.dayCount !== expected) {
    throw new Error(`WCT v2 ${label} book must contain exactly ${expected} Days`);
  }
  const actual = [...days].map((day) => day.dayNumber).sort((a, b) => a - b);
  if (actual.length !== expected
    || new Set(actual).size !== expected
    || actual.some((dayNumber) => !Number.isInteger(dayNumber) || dayNumber < 1)) {
    throw new Error(`WCT v2 requires exactly ${expected} unique positive Day numbers`);
  }
  return level;
}

export function generateStandardWctQuizBook(
  book: WctBook,
  days: readonly WctDay[],
  overrides?: readonly WctStandardDayOverride[]
): WctGeneratedStandardQuizBook {
  const level = validateInventory(book, days);
  const sources = [...days]
    .sort((left, right) => left.dayNumber - right.dayNumber)
    .map((day) => buildStandardWctQuizSource(book, day));
  if (sources.some((source) => source.level !== level)) {
    throw new Error("WCT v2 source level mismatch");
  }
  for (const source of sources) {
    const identities = source.entries.map((entry) => (
      `${entry.patternId}\0${entry.exampleId}`
    ));
    if (new Set(identities).size !== identities.length) {
      throw new Error(`WCT v2 Day ${source.dayNumber} has duplicate source identities`);
    }
  }
  if (overrides !== undefined && overrides.some((override) => override.level !== level)) {
    throw new Error("WCT v2 explicit override level mismatch");
  }
  const effectiveOverrides = overrides ?? (
    PRODUCTION_STANDARD_BOOK_IDS.has(book.id)
      ? STANDARD_WCT_DAY_OVERRIDES
      : []
  );
  const indexedOverrides = indexOverrides(sources, effectiveOverrides);
  const compositionCache = new Map<string, readonly WctStandardQuestionCandidate[] | null>();
  const compose = (source: WctStandardQuizSource, state: TruthState) => {
    const key = `${source.sourceHash}:${state}`;
    if (compositionCache.has(key)) return compositionCache.get(key)!;
    const composed = composeAutomaticDay(source, state);
    compositionCache.set(key, composed);
    return composed;
  };
  const states = allocateTruthStates(sources, indexedOverrides, compose);
  const sets: WctGeneratedStandardQuizSet[] = sources.map((source, index) => {
    const candidates = indexedOverrides.get(`${source.level}:${source.dayNumber}`)
      ?? compose(source, states[index]);
    if (!candidates) {
      throw new Error(`WCT v2 Day ${source.dayNumber} cannot compose five questions`);
    }
    const questionIds = candidates.map((candidate) => candidate.question.id);
    if (new Set(questionIds).size !== questionIds.length) {
      throw new Error(`WCT v2 Day ${source.dayNumber} has a question ID collision`);
    }
    const draft = {
      lessonKey: source.lessonKey,
      sourceKind: "wct_day" as const,
      sourceId: source.sourceId,
      generatorVersion: GENERATOR_VERSION,
      sourceHash: source.sourceHash,
      questions: candidates.map((candidate) => candidate.question)
    };
    wctStandardQuizSetCreateSchema.parse(draft);
    return { source, draft, candidates };
  });
  return { bookId: book.id, level, sets };
}
