import { createHash } from "node:crypto";

import {
  normalizeWctIdentity,
  stableStringify
} from "../../normalization.ts";
import type { WctBook, WctDay } from "../../types.ts";
import { wctStandardQuizSetCreateSchema } from "../validation.ts";
import {
  auditStandardQuestionCandidate,
  buildFillBlankCandidate,
  buildMultipleChoiceCandidate,
  buildTrueFalseCandidate
} from "./candidates.ts";
import {
  STANDARD_WCT_DAY_OVERRIDES,
  type WctStandardDayOverride
} from "./overrides.ts";
import { buildStandardWctQuizSource } from "./source.ts";
import type {
  WctGeneratedStandardQuizBook,
  WctGeneratedStandardQuizSet,
  WctStandardLevel,
  WctStandardQuestionCandidate,
  WctStandardQuizSource
} from "./types.ts";

const GENERATOR_VERSION = "wct-review-v2" as const;
type StandardFormat = "multiple_choice" | "fill_blank" | "true_false";
type StandardKind = "translation" | "pattern";
type TruthState = "O" | "X";
type Slot = { format: StandardFormat; kind: StandardKind };

function sha256(...parts: string[]) {
  return createHash("sha256").update(parts.join("\0")).digest("hex");
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

function hashRankedPermutation<T extends string>(
  values: readonly T[],
  seed: string,
  accept: (permutation: readonly T[]) => boolean = () => true
) {
  const eligible = uniquePermutations(values).filter(accept);
  if (eligible.length === 0) throw new Error("WCT v2 has no valid slot permutation");
  return eligible.sort((left, right) => (
    sha256(seed, left.join("\0")).localeCompare(sha256(seed, right.join("\0")))
      || left.join("\0").localeCompare(right.join("\0"))
  ))[0];
}

function slotsForSource(source: WctStandardQuizSource): Slot[] {
  const formats = hashRankedPermutation<StandardFormat>(
    ["multiple_choice", "multiple_choice", "fill_blank", "fill_blank", "true_false"],
    `${source.lessonKey}\0${source.sourceHash}\0formats`,
    (permutation) => permutation.every((format, index) => (
      index === 0 || format !== permutation[index - 1]
    ))
  );
  const kinds = hashRankedPermutation<StandardKind>(
    ["translation", "translation", "translation", "pattern", "pattern"],
    `${source.lessonKey}\0${source.sourceHash}\0kinds`
  );
  return formats.map((format, index) => ({ format, kind: kinds[index] }));
}

function candidateFor(
  source: WctStandardQuizSource,
  entryIndex: number,
  slot: Slot,
  state: TruthState
) {
  const entry = source.entries[entryIndex];
  if (slot.format === "multiple_choice") {
    return buildMultipleChoiceCandidate(entry, slot.kind);
  }
  if (slot.format === "fill_blank") {
    return buildFillBlankCandidate(entry, slot.kind);
  }
  return buildTrueFalseCandidate(entry, state, slot.kind);
}

function candidateKey(candidate: WctStandardQuestionCandidate) {
  return [
    candidate.question.format,
    candidate.question.kind,
    candidate.provenance.patternId,
    candidate.provenance.exampleId
  ].join("\0");
}

function rankedCandidates(
  source: WctStandardQuizSource,
  slot: Slot,
  slotIndex: number,
  state: TruthState
) {
  return source.entries
    .map((_entry, entryIndex) => candidateFor(source, entryIndex, slot, state))
    .filter((candidate): candidate is WctStandardQuestionCandidate => candidate !== null)
    .sort((left, right) => {
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
  const displayedContent = stableStringify({
    kind: question.kind,
    format: question.format,
    prompt: question.prompt,
    choices: question.choices.map((choice) => choice.text),
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
  const choices = question.choices.map((choice) => ({
    id: `cv2-${sha256(questionId, choice.text)}`,
    text: choice.text
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
    provenance: structuredClone(candidate.provenance)
  };
}

function composeAutomaticDay(source: WctStandardQuizSource, state: TruthState) {
  const selected: WctStandardQuestionCandidate[] = [];
  const usedCandidates = new Set<string>();
  const usedPrompts = new Set<string>();
  for (const [slotIndex, slot] of slotsForSource(source).entries()) {
    const candidate = rankedCandidates(source, slot, slotIndex, state).find((item) => {
      const key = candidateKey(item);
      const prompt = normalizeWctIdentity(item.question.prompt);
      return !usedCandidates.has(key) && !usedPrompts.has(prompt);
    });
    if (!candidate) return null;
    usedCandidates.add(candidateKey(candidate));
    usedPrompts.add(normalizeWctIdentity(candidate.question.prompt));
    selected.push(materializeCandidate(source, candidate, slotIndex));
  }
  return selected;
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
  return candidate.question.prompt
    === `"${sourceEntry.patternText}" 패턴에 맞는 영어 문장을 고르세요.`;
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
  const draft = {
    lessonKey: source.lessonKey,
    sourceKind: "wct_day" as const,
    sourceId: source.sourceId,
    generatorVersion: GENERATOR_VERSION,
    sourceHash: source.sourceHash,
    questions: materialized.map((candidate) => candidate.question)
  };
  if (!wctStandardQuizSetCreateSchema.safeParse(draft).success
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
  for (const override of overrides) {
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
  overrides: ReadonlyMap<string, readonly WctStandardQuestionCandidate[]>
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
      : composeAutomaticDay(source, state) !== null;
    supportCache.set(cacheKey, supported);
    return supported;
  };
  const preferredPhases = ["O", "O", "X"] as const;
  for (let mask = 0; mask < 8; mask += 1) {
    const phases = preferredPhases.map((preferred, residue): TruthState => (
      mask & (1 << residue) ? preferred === "O" ? "X" : "O" : preferred
    ));
    const states = truthStatesForPhases(sources.length, phases);
    const trueCount = states.filter((state) => state === "O").length;
    const validTotals = trueCount === sources.length / 2;
    if (validTotals && states.every((state, index) => supports(index, state))) {
      return states;
    }
  }
  const unsafeIndex = sources.findIndex((_source, index) => (
    !supports(index, "X") || overrides.has(`${sources[index].level}:${sources[index].dayNumber}`)
  ));
  const failed = unsafeIndex === -1 ? 0 : unsafeIndex;
  throw new Error(
    `WCT v2 Day ${sources[failed].dayNumber} cannot satisfy alternating O/X allocation`
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
  const required = Array.from({ length: expected }, (_item, index) => index + 1);
  if (actual.length !== required.length
    || actual.some((dayNumber, index) => dayNumber !== required[index])) {
    throw new Error(`WCT v2 requires complete Day numbers 1-${expected}`);
  }
  return level;
}

export function generateStandardWctQuizBook(
  book: WctBook,
  days: readonly WctDay[],
  overrides: readonly WctStandardDayOverride[] = STANDARD_WCT_DAY_OVERRIDES
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
  const indexedOverrides = indexOverrides(sources, overrides);
  const states = allocateTruthStates(sources, indexedOverrides);
  const sets: WctGeneratedStandardQuizSet[] = sources.map((source, index) => {
    const candidates = indexedOverrides.get(`${source.level}:${source.dayNumber}`)
      ?? composeAutomaticDay(source, states[index]);
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
