import { createHash } from "node:crypto";

import { normalizeWctIdentity } from "../../normalization.ts";
import {
  enumerateBlankCandidates,
  enumerateSentenceMutations
} from "./mutations.ts";
import type {
  WctMutationEvidence,
  WctStandardQuestionCandidate,
  WctStandardSourceEntry
} from "./types.ts";

type StandardQuestionKind = "translation" | "pattern";

const forbiddenPromptMetadata = /\bwct\b|\bday\s*#?\s*\d+\b|\bcourse\b|\b(?:pre\s*novice|prenovice|novice|premium)\b/iu;

function stableId(prefix: string, ...parts: string[]) {
  return `${prefix}-${createHash("sha256").update(parts.join("\0")).digest("hex").slice(0, 16)}`;
}

function canBuildKind(entry: WctStandardSourceEntry, kind: StandardQuestionKind) {
  return kind === "pattern" || Boolean(entry.meaningKo?.trim());
}

function choices(
  questionId: string,
  texts: readonly string[],
  correctText: string
) {
  const items = texts.map((text) => ({
    id: stableId("c", questionId, text),
    text
  }));
  const correct = items.find((item) => (
    normalizeWctIdentity(item.text) === normalizeWctIdentity(correctText)
  ));
  return correct ? { items, correctChoiceId: correct.id } : null;
}

function feedback(entry: WctStandardSourceEntry, reason: string) {
  return {
    correctSentence: entry.englishText,
    pattern: entry.patternText,
    reason
  };
}

function promptForKind(entry: WctStandardSourceEntry, kind: StandardQuestionKind) {
  return kind === "translation"
    ? `"${entry.meaningKo}"에 맞는 영어 문장을 고르세요.`
    : `"${entry.patternText}" 패턴에 맞는 영어 문장을 고르세요.`;
}

function baseProvenance(entry: WctStandardSourceEntry) {
  return {
    patternId: entry.patternId,
    exampleId: entry.exampleId,
    sourceSentence: entry.englishText
  };
}

function exactMutation(
  source: string,
  mutation: WctMutationEvidence
) {
  if (mutation.start < 0
    || mutation.end <= mutation.start
    || source.slice(mutation.start, mutation.end) !== mutation.changedFrom) {
    return false;
  }
  return mutation.text === `${source.slice(0, mutation.start)}${mutation.changedTo}${source.slice(mutation.end)}`;
}

export function auditStandardQuestionCandidate(
  candidate: WctStandardQuestionCandidate
) {
  const { question, provenance } = candidate;
  const expectedChoiceCount = question.format === "true_false" ? 2 : 4;
  if (forbiddenPromptMetadata.test(question.prompt)
    || question.choices.some((choice) => forbiddenPromptMetadata.test(choice.text))
    || question.choices.length !== expectedChoiceCount
    || provenance.choiceEvidence.length !== expectedChoiceCount
    || new Set(question.choices.map((choice) => normalizeWctIdentity(choice.text))).size
      !== expectedChoiceCount) {
    return false;
  }

  for (let index = 0; index < question.choices.length; index += 1) {
    const choice = question.choices[index];
    const evidence = provenance.choiceEvidence[index];
    const isCorrect = choice.id === question.correctChoiceId;
    if (!evidence
      || evidence.choiceText !== choice.text
      || evidence.role !== (isCorrect ? "correct" : "distractor")) return false;
  }

  if (question.format === "true_false") {
    if (question.choices[0].text !== "O" || question.choices[1].text !== "X") return false;
    if (provenance.statementMutation) {
      return exactMutation(provenance.sourceSentence, provenance.statementMutation)
        && question.correctChoiceId === question.choices[1].id
        && question.prompt.includes(provenance.statementMutation.text);
    }
    return question.correctChoiceId === question.choices[0].id
      && question.prompt.includes(provenance.sourceSentence);
  }

  const correctEvidence = provenance.choiceEvidence.filter((item) => item.role === "correct");
  const distractors = provenance.choiceEvidence.filter((item) => item.role === "distractor");
  if (correctEvidence.length !== 1
    || correctEvidence[0].mutation
    || distractors.length !== 3
    || distractors.some((item) => !item.mutation
      || !exactMutation(provenance.sourceSentence, item.mutation))) {
    return false;
  }

  const families = new Set(distractors.map((item) => item.mutation?.ruleFamily));
  if (families.size !== 1) return false;
  if (question.format === "multiple_choice") {
    return correctEvidence[0].choiceText === provenance.sourceSentence
      && distractors.every((item) => item.mutation?.text === item.choiceText);
  }

  const blank = provenance.blankSpan;
  const expectedPrompt = blank
    ? `${provenance.sourceSentence.slice(0, blank.start)}____${provenance.sourceSentence.slice(blank.end)}`
    : null;
  if (!blank
    || provenance.sourceSentence.slice(blank.start, blank.end) !== blank.correctText
    || question.prompt !== expectedPrompt
    || (question.prompt.match(/____/g) ?? []).length !== 1
    || correctEvidence[0].choiceText !== blank.correctText) return false;
  return distractors.every((item) => item.mutation?.start === blank.start
    && item.mutation.end === blank.end
    && item.mutation.changedTo === item.choiceText);
}

export function buildMultipleChoiceCandidate(
  entry: WctStandardSourceEntry,
  kind: StandardQuestionKind
): WctStandardQuestionCandidate | null {
  if (!canBuildKind(entry, kind)) return null;
  const families = new Map<string, WctMutationEvidence[]>();
  for (const mutation of enumerateSentenceMutations(entry)) {
    const group = families.get(mutation.ruleFamily) ?? [];
    group.push(mutation);
    families.set(mutation.ruleFamily, group);
  }
  const family = [...families.values()].find((items) => items.length >= 3);
  if (!family) return null;
  const mutations = family.slice(0, 3);
  const questionId = stableId("q", entry.patternId, entry.exampleId, kind, "multiple_choice");
  const builtChoices = choices(
    questionId,
    [entry.englishText, ...mutations.map((mutation) => mutation.text)],
    entry.englishText
  );
  if (!builtChoices) return null;
  const reason = mutations[0].reason;
  const candidate: WctStandardQuestionCandidate = {
    question: {
      id: questionId,
      kind,
      format: "multiple_choice",
      prompt: promptForKind(entry, kind),
      choices: builtChoices.items,
      correctChoiceId: builtChoices.correctChoiceId,
      explanation: reason,
      feedback: feedback(entry, reason)
    },
    provenance: {
      ...baseProvenance(entry),
      choiceEvidence: builtChoices.items.map((choice) => {
        const mutation = mutations.find((item) => item.text === choice.text);
        return mutation
          ? { choiceText: choice.text, role: "distractor" as const, mutation }
          : { choiceText: choice.text, role: "correct" as const };
      })
    }
  };
  return auditStandardQuestionCandidate(candidate) ? candidate : null;
}

export function buildFillBlankCandidate(
  entry: WctStandardSourceEntry,
  kind: StandardQuestionKind
): WctStandardQuestionCandidate | null {
  if (!canBuildKind(entry, kind)) return null;
  const blank = enumerateBlankCandidates(entry)[0];
  if (!blank || blank.reconstruct(blank.correctText) !== entry.englishText) return null;
  const questionId = stableId("q", entry.patternId, entry.exampleId, kind, "fill_blank");
  const builtChoices = choices(
    questionId,
    blank.choices.map((choice) => choice.text),
    blank.correctText
  );
  if (!builtChoices) return null;
  const firstMutation = blank.choices.find((choice) => choice.mutation)?.mutation;
  if (!firstMutation) return null;
  const candidate: WctStandardQuestionCandidate = {
    question: {
      id: questionId,
      kind,
      format: "fill_blank",
      prompt: blank.promptSentence,
      choices: builtChoices.items,
      correctChoiceId: builtChoices.correctChoiceId,
      explanation: firstMutation.reason,
      feedback: feedback(entry, firstMutation.reason)
    },
    provenance: {
      ...baseProvenance(entry),
      choiceEvidence: builtChoices.items.map((choice) => {
        const sourceChoice = blank.choices.find((item) => item.text === choice.text);
        return sourceChoice?.mutation
          ? {
              choiceText: choice.text,
              role: "distractor" as const,
              mutation: sourceChoice.mutation
            }
          : { choiceText: choice.text, role: "correct" as const };
      }),
      blankSpan: {
        start: firstMutation.start,
        end: firstMutation.end,
        correctText: blank.correctText
      }
    }
  };
  return auditStandardQuestionCandidate(candidate) ? candidate : null;
}

export function buildTrueFalseCandidate(
  entry: WctStandardSourceEntry,
  state: "O" | "X",
  kind: StandardQuestionKind
): WctStandardQuestionCandidate | null {
  if (!canBuildKind(entry, kind)) return null;
  const statementMutation = state === "X"
    ? enumerateSentenceMutations(entry)[0]
    : undefined;
  if (state === "X" && !statementMutation) return null;
  const statement = statementMutation?.text ?? entry.englishText;
  const questionId = stableId("q", entry.patternId, entry.exampleId, kind, "true_false", state);
  const builtChoices = choices(questionId, ["O", "X"], state);
  if (!builtChoices) return null;
  const reason = statementMutation?.reason
    ?? `The statement exactly matches the approved source sentence.`;
  const candidate: WctStandardQuestionCandidate = {
    question: {
      id: questionId,
      kind,
      format: "true_false",
      prompt: `"${statement}" 이 문장이 패턴에 맞으면 O, 아니면 X를 고르세요.`,
      choices: builtChoices.items,
      correctChoiceId: builtChoices.correctChoiceId,
      explanation: reason,
      feedback: feedback(entry, reason)
    },
    provenance: {
      ...baseProvenance(entry),
      choiceEvidence: builtChoices.items.map((choice) => ({
        choiceText: choice.text,
        role: choice.text === state ? "correct" as const : "distractor" as const
      })),
      ...(statementMutation ? { statementMutation } : {})
    }
  };
  return auditStandardQuestionCandidate(candidate) ? candidate : null;
}
