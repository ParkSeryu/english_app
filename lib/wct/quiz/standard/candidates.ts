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
const exactOReasonOverrides = new Map<string, string>([
  [
    [
      "4ef3d83d-d1c6-4e41-9a77-643c0197d4b3",
      "f7649c55-5003-4c62-a68e-261c8fa1b273"
    ].join("\0"),
    "\"Is it important?\"는 be동사 \"Is\"를 주어 \"it\" 앞에 둔 현재형 의문문이므로 맞습니다."
  ],
  [
    [
      "df68ffde-c8da-4d4b-8a02-7f7544d95f9a",
      "58976272-95cf-4afe-be36-9d54318f5336"
    ].join("\0"),
    "\"Work.\"는 주어 없이 동사원형 \"Work\"로 시작한 긍정 명령문이므로 맞습니다."
  ],
  [
    [
      "8f09acbf-d7ab-4766-a272-cbdf0df7b749",
      "d227f812-0231-4093-aaf3-7c366ab4729b"
    ].join("\0"),
    "\"Were you walking?\"은 \"Were + 주어 + -ing\" 형태의 과거진행 의문문이며, \"걷고 있었나요?\"라는 뜻과 일치합니다."
  ]
]);

function stableId(prefix: string, ...parts: string[]) {
  return `${prefix}-${createHash("sha256").update(parts.join("\0")).digest("hex").slice(0, 16)}`;
}

export function canBuildStandardKind(
  entry: WctStandardSourceEntry,
  kind: StandardQuestionKind
) {
  if (!entry.meaningKo?.trim()) return false;
  const pattern = normalizeWctIdentity(entry.patternText);
  const sentence = normalizeWctIdentity(entry.englishText);
  if (sentence === "did he buy?" && /^did\b/u.test(pattern)) return false;
  if (/^what did\b/u.test(pattern) && !/^what did\b/u.test(sentence)) return false;
  if (/^what was\b|^what were\b/u.test(pattern)
    && !/^what was\b|^what were\b/u.test(sentence)) return false;
  if (/^enjoy\/finish\/avoid\/keep\/practice\b/u.test(pattern)
    && !/^(?:i|you|we|they|he|she|it)\s+(?:enjoy|enjoys|finish|finishes|avoid|avoids|keep|keeps|practice|practices)\b/u
      .test(sentence)) return false;
  if (kind === "translation") return true;
  return true;
}

function choices(
  questionId: string,
  texts: readonly string[],
  correctText: string,
  preserveOrder = false
) {
  const orderedTexts = preserveOrder
    ? [...texts]
    : [...texts].sort((left, right) => (
        stableId("rank", questionId, left).localeCompare(stableId("rank", questionId, right))
          || left.localeCompare(right)
      ));
  const items = orderedTexts.map((text) => ({
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

export function standardMultipleChoicePrompt(
  entry: WctStandardSourceEntry,
  kind: StandardQuestionKind
) {
  return kind === "translation"
    ? `"${entry.meaningKo}"에 맞는 영어 문장을 고르세요.`
    : `"${entry.patternText}" 패턴을 사용해 "${entry.meaningKo}"에 맞는 영어 문장을 고르세요.`;
}

export function standardFillBlankPrompt(
  entry: WctStandardSourceEntry,
  kind: StandardQuestionKind,
  promptSentence: string
) {
  const focus = kind === "translation"
    ? `"${entry.meaningKo}"에 맞게`
    : `"${entry.patternText}" 패턴을 사용해 "${entry.meaningKo}"에 맞게`;
  return `${focus} 빈칸을 채우세요: ${promptSentence}`;
}

export function standardTrueFalsePrompt(
  entry: WctStandardSourceEntry,
  kind: StandardQuestionKind,
  statement: string
) {
  const criterion = kind === "translation"
    ? `"${entry.meaningKo}"에 맞는 올바른 영어 문장`
    : `"${entry.patternText}" 패턴을 사용해 "${entry.meaningKo}"에 맞는 문장`;
  return `${criterion}이면 O, 아니면 X를 고르세요: "${statement}"`;
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
    const statement = provenance.statementMutation?.text ?? provenance.sourceSentence;
    const promptMatchesKind = question.kind === "pattern"
      ? question.prompt.startsWith(`"${question.feedback.pattern}" 패턴을 사용해 `)
        && question.prompt.includes("에 맞는 문장이면 O, 아니면 X")
      : question.prompt.startsWith('"')
        && question.prompt.includes("에 맞는 올바른 영어 문장");
    if (!promptMatchesKind || !question.prompt.endsWith(`: "${statement}"`)) return false;
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
  const promptSentence = blank
    ? `${provenance.sourceSentence.slice(0, blank.start)}____${provenance.sourceSentence.slice(blank.end)}`
    : null;
  const expectedPrompt = promptSentence
    ? question.kind === "pattern"
      ? `에 맞게 빈칸을 채우세요: ${promptSentence}`
      : ` 빈칸을 채우세요: ${promptSentence}`
    : null;
  if (!blank
    || provenance.sourceSentence.slice(blank.start, blank.end) !== blank.correctText
    || !expectedPrompt
    || (question.kind === "pattern"
      ? !question.prompt.startsWith(`"${question.feedback.pattern}" 패턴을 사용해 `)
        || !question.prompt.endsWith(expectedPrompt)
      : !question.prompt.startsWith('"') || !question.prompt.endsWith(expectedPrompt))
    || (question.prompt.match(/____/g) ?? []).length !== 1
    || correctEvidence[0].choiceText !== blank.correctText) return false;
  return distractors.every((item) => item.mutation?.start === blank.start
    && item.mutation.end === blank.end
    && item.mutation.changedTo === item.choiceText);
}

export function buildMultipleChoiceCandidates(
  entry: WctStandardSourceEntry,
  kind: StandardQuestionKind
): WctStandardQuestionCandidate[] {
  if (!canBuildStandardKind(entry, kind)) return [];
  const families = new Map<string, WctMutationEvidence[]>();
  for (const mutation of enumerateSentenceMutations(entry)) {
    const key = [
      mutation.ruleFamily,
      mutation.start,
      mutation.end,
      normalizeWctIdentity(mutation.changedFrom)
    ].join("\0");
    const group = families.get(key) ?? [];
    group.push(mutation);
    families.set(key, group);
  }
  return [...families.values()].flatMap((family) => {
    if (family.length < 3) return [];
    const mutations = family.slice(0, 3);
    const anchor = mutations[0];
    const questionId = stableId(
      "q",
      entry.patternId,
      entry.exampleId,
      kind,
      "multiple_choice",
      anchor.ruleFamily,
      String(anchor.start),
      String(anchor.end),
      anchor.changedFrom
    );
    const builtChoices = choices(
      questionId,
      [entry.englishText, ...mutations.map((mutation) => mutation.text)],
      entry.englishText
    );
    if (!builtChoices) return [];
    const reason = mutations[0].reason;
    const candidate: WctStandardQuestionCandidate = {
      question: {
        id: questionId,
        kind,
        format: "multiple_choice",
        prompt: standardMultipleChoicePrompt(entry, kind),
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
    return auditStandardQuestionCandidate(candidate) ? [candidate] : [];
  });
}

export function buildMultipleChoiceCandidate(
  entry: WctStandardSourceEntry,
  kind: StandardQuestionKind
): WctStandardQuestionCandidate | null {
  return buildMultipleChoiceCandidates(entry, kind)[0] ?? null;
}

export function buildFillBlankCandidates(
  entry: WctStandardSourceEntry,
  kind: StandardQuestionKind
): WctStandardQuestionCandidate[] {
  if (!canBuildStandardKind(entry, kind)) return [];
  return enumerateBlankCandidates(entry).flatMap((blank) => {
    if (blank.reconstruct(blank.correctText) !== entry.englishText) return [];
    const firstMutation = blank.choices.find((choice) => choice.mutation)?.mutation;
    if (!firstMutation) return [];
    const questionId = stableId(
      "q",
      entry.patternId,
      entry.exampleId,
      kind,
      "fill_blank",
      firstMutation.ruleFamily,
      String(firstMutation.start),
      String(firstMutation.end),
      firstMutation.changedFrom
    );
    const builtChoices = choices(
      questionId,
      blank.choices.map((choice) => choice.text),
      blank.correctText
    );
    if (!builtChoices) return [];
    const candidate: WctStandardQuestionCandidate = {
      question: {
        id: questionId,
        kind,
        format: "fill_blank",
        prompt: standardFillBlankPrompt(entry, kind, blank.promptSentence),
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
    return auditStandardQuestionCandidate(candidate) ? [candidate] : [];
  });
}

export function buildFillBlankCandidate(
  entry: WctStandardSourceEntry,
  kind: StandardQuestionKind
): WctStandardQuestionCandidate | null {
  return buildFillBlankCandidates(entry, kind)[0] ?? null;
}

export function buildTrueFalseCandidate(
  entry: WctStandardSourceEntry,
  state: "O" | "X",
  kind: StandardQuestionKind
): WctStandardQuestionCandidate | null {
  if (!canBuildStandardKind(entry, kind)) return null;
  const statementMutation = state === "X"
    ? enumerateSentenceMutations(entry)[0]
    : undefined;
  if (state === "X" && !statementMutation) return null;
  const statement = statementMutation?.text ?? entry.englishText;
  const questionId = stableId("q", entry.patternId, entry.exampleId, kind, "true_false", state);
  const builtChoices = choices(questionId, ["O", "X"], state, true);
  if (!builtChoices) return null;
  const reason = statementMutation?.reason
    ?? exactOReasonOverrides.get(`${entry.patternId}\0${entry.exampleId}`)
    ?? "문장이 학습한 패턴과 예문에 맞습니다.";
  const candidate: WctStandardQuestionCandidate = {
    question: {
      id: questionId,
      kind,
      format: "true_false",
      prompt: standardTrueFalsePrompt(entry, kind, statement),
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
