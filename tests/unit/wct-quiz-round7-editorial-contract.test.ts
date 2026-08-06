import { describe, expect, it } from "vitest";

import {
  auditStandardQuestionCandidate,
  buildFillBlankCandidates,
  buildMultipleChoiceCandidates,
  buildTrueFalseCandidate,
  canBuildStandardKind
} from "@/lib/wct/quiz/standard/candidates";
import { hasUniqueStandardLearningTargets } from "@/lib/wct/quiz/standard/diversity";
import { STANDARD_WCT_DAY_OVERRIDES } from "@/lib/wct/quiz/standard/overrides";
import type {
  WctStandardLevel,
  WctStandardQuestionCandidate,
  WctStandardSourceEntry
} from "@/lib/wct/quiz/standard/types";

type Pair = readonly [patternId: string, exampleId: string];

const n22Pairs: Pair[] = [
  ["83e1401a-1d72-4eca-8957-a9e0c0ceb5bf", "763e2bbe-40da-41aa-b58b-86b9744a8c6a"],
  ["83e1401a-1d72-4eca-8957-a9e0c0ceb5bf", "ce338116-6406-4cc1-8dfe-bddd60dbc9b9"],
  ["83e1401a-1d72-4eca-8957-a9e0c0ceb5bf", "ce338116-6406-4cc1-8dfe-bddd60dbc9b9"],
  ["83e1401a-1d72-4eca-8957-a9e0c0ceb5bf", "d8ba0f89-5d79-4435-8597-723d4f1a59b5"],
  ["83e1401a-1d72-4eca-8957-a9e0c0ceb5bf", "d8ba0f89-5d79-4435-8597-723d4f1a59b5"]
];

const n22You = sourceEntry(
  n22Pairs[0],
  "If + 과거형, 주어 + would + 동사원형",
  "만약 ~라면 ~할 텐데",
  "If I were you, I wouldn't date him.",
  "내가 너라면 그와 사귀지 않을 거예요."
);

const n22Bird = sourceEntry(
  n22Pairs[3],
  "If + 과거형, 주어 + would + 동사원형",
  "만약 ~라면 ~할 텐데",
  "If I were a bird, I would fly in the sky.",
  "내가 새라면 하늘을 날 텐데요."
);

function sourceEntry(
  [patternId, exampleId]: Pair,
  patternText: string,
  patternMeaningKo: string,
  englishText: string,
  meaningKo: string
): WctStandardSourceEntry {
  return {
    patternId,
    exampleId,
    patternText,
    patternMeaningKo,
    usageNote: null,
    englishText,
    meaningKo
  };
}

function getOverride(level: WctStandardLevel, dayNumber: number) {
  const override = STANDARD_WCT_DAY_OVERRIDES.find((item) => (
    item.level === level && item.dayNumber === dayNumber
  ));
  if (!override) throw new Error(`Missing ${level} Day ${dayNumber} override`);
  return override;
}

function pair(candidate: WctStandardQuestionCandidate): Pair {
  return [candidate.provenance.patternId, candidate.provenance.exampleId];
}

function answer(candidate: WctStandardQuestionCandidate) {
  return candidate.question.choices.find((choice) => (
    choice.id === candidate.question.correctChoiceId
  ))?.text;
}

function reconstructedChoices(candidate: WctStandardQuestionCandidate) {
  const blank = candidate.provenance.blankSpan;
  return candidate.question.choices.map((choice) => blank
    ? `${candidate.provenance.sourceSentence.slice(0, blank.start)}${choice.text}${candidate.provenance.sourceSentence.slice(blank.end)}`
    : choice.text);
}

function mutations(candidate: WctStandardQuestionCandidate) {
  return [
    ...(candidate.provenance.statementMutation
      ? [candidate.provenance.statementMutation]
      : []),
    ...candidate.provenance.choiceEvidence.flatMap((evidence) => (
      evidence.mutation ? [evidence.mutation] : []
    ))
  ];
}

function sourceCounts(candidates: readonly WctStandardQuestionCandidate[]) {
  const counts = new Map<string, number>();
  for (const candidate of candidates) {
    counts.set(
      candidate.provenance.exampleId,
      (counts.get(candidate.provenance.exampleId) ?? 0) + 1
    );
  }
  return [...counts.values()].sort((left, right) => left - right);
}

describe("WCT v2 Round 7 editorial contracts", () => {
  it("makes Novice Day 2 slot 1 unambiguous", () => {
    const day2Slot1 = getOverride("novice", 2).questions[0];
    const day2Reason = "벌금을 낼 의무가 있다는 뜻이므로 \"has to\"가 맞습니다. \"might\"는 가능성, \"must not\"은 금지, \"doesn't have to\"는 의무가 없음을 나타냅니다.";

    expect([...reconstructedChoices(day2Slot1)].sort()).toEqual([
      "He has to pay the fine.",
      "He might pay the fine.",
      "He must not pay the fine.",
      "He doesn't have to pay the fine."
    ].sort());
    expect(day2Slot1.question.explanation).toBe(day2Reason);
    expect(day2Slot1.question.feedback.reason).toBe(day2Reason);
    expect(mutations(day2Slot1).every((mutation) => (
      mutation.changedFrom === "has to"
      && mutation.start === 3
      && mutation.end === 9
      && mutation.reason === day2Reason
    ))).toBe(true);
    expect(auditStandardQuestionCandidate(day2Slot1)).toBe(true);
  });

  it("gives Novice Day 7 slot 3 a distinct helper-generated do target", () => {
    const day7 = getOverride("novice", 7);
    const day7Slot2 = day7.questions[1];
    const day7Slot3 = day7.questions[2];
    const day7Reason = "제시된 뜻과 시제에 맞는 조동사는 \"do\"입니다.";

    expect(day7Slot3.question.prompt).toBe(
      "\"Wh- + be/조동사 + 주어 ...?\" 패턴을 사용해 \"왜 영어를 공부하나요?\"에 맞는 영어 문장을 고르세요."
    );
    expect([...reconstructedChoices(day7Slot3)].sort()).toEqual([
      "Why do you study English?",
      "Why did you study English?",
      "Why can you study English?",
      "Why will you study English?"
    ].sort());
    expect(day7Slot3.question.explanation).toBe(day7Reason);
    expect(day7Slot3.question.feedback.reason).toBe(day7Reason);
    expect(mutations(day7Slot3).map((mutation) => [
      mutation.ruleFamily,
      mutation.start,
      mutation.end,
      mutation.changedFrom,
      mutation.reason
    ])).toEqual([
      ["wh_auxiliary_form", 4, 6, "do", day7Reason],
      ["wh_auxiliary_form", 4, 6, "do", day7Reason],
      ["wh_auxiliary_form", 4, 6, "do", day7Reason]
    ]);
    expect(mutations(day7Slot2)[0]?.changedFrom).toBe("Why do you");
    expect(mutations(day7Slot3)[0]?.changedFrom).toBe("do");
    expect(hasUniqueStandardLearningTargets(day7.questions)).toBe(true);
    expect(auditStandardQuestionCandidate(day7Slot3)).toBe(true);
  });

  it("repairs the Korean feedback for Novice Day 10 slot 3", () => {
    const day10Slot3 = getOverride("novice", 10).questions[2];
    const day10Reason = "\"busy\"는 \"바쁜\", \"tired\"는 \"피곤한\"이라는 뜻입니다. 제시된 문장은 \"줄곧 바빴다\"는 내용이므로 \"나는 줄곧 피곤했어요.\"와 다릅니다. 정답은 X입니다.";

    expect(day10Slot3.provenance.statementMutation?.text)
      .toBe("I have always been busy.");
    expect(day10Slot3.question.explanation).toBe(day10Reason);
    expect(day10Slot3.question.feedback.reason).toBe(day10Reason);
    expect(day10Slot3.provenance.statementMutation?.reason).toBe(day10Reason);
    expect(auditStandardQuestionCandidate(day10Slot3)).toBe(true);
  });

  it.each([n22You, n22Bird])(
    "admits the canonical Day 22 irrealis source: $englishText",
    (entry) => {
      expect(canBuildStandardKind(entry, "translation")).toBe(true);
      expect(canBuildStandardKind(entry, "pattern")).toBe(true);
    }
  );

  it("retains the incomplete-question and learner-facing WCT guards", () => {
    const incompleteQuestion = sourceEntry(
      ["pattern-did", "example-did"],
      "Did + 주어 + 동사원형?",
      "과거 의문문",
      "Did he buy?",
      "그가 샀나요?"
    );
    expect(canBuildStandardKind(incompleteQuestion, "translation")).toBe(false);

    const wctSource = sourceEntry(
      ["914b29ec-0108-439b-80cc-e68c6a62bce6", "be5f9138-dd57-46a4-888c-43f7621c9b91"],
      "Wh- + be/조동사 + 주어 ...?",
      "의문사 의문문",
      "How did you come to WCT?",
      "WCT에 어떻게 오게 되었나요?"
    );
    expect(buildMultipleChoiceCandidates(wctSource, "pattern")).toEqual([]);
    expect(buildFillBlankCandidates(wctSource, "pattern")).toEqual([]);
    expect(buildTrueFalseCandidate(wctSource, "O", "pattern")).toBeNull();
  });

  it("replaces Novice Day 22 slot 1 with the reviewed you/date question", () => {
    const slot1 = getOverride("novice", 22).questions[0];

    expect(pair(slot1)).toEqual(n22Pairs[0]);
    expect(slot1.provenance.sourceSentence)
      .toBe("If I were you, I wouldn't date him.");
  });

  it("replaces Novice Day 22 slot 4 with the reviewed bird-action X judgment", () => {
    const slot4 = getOverride("novice", 22).questions[3];

    expect(pair(slot4)).toEqual(n22Pairs[3]);
    expect(slot4.provenance.sourceSentence)
      .toBe("If I were a bird, I would fly in the sky.");
    expect(slot4.provenance.statementMutation?.text)
      .toBe("If I were a bird, I would swim in the sea.");
  });

  it("replaces Novice Day 22 slot 5 with the reviewed bird fill", () => {
    const slot5 = getOverride("novice", 22).questions[4];

    expect(pair(slot5)).toEqual(n22Pairs[4]);
    expect(slot5.provenance.sourceSentence)
      .toBe("If I were a bird, I would fly in the sky.");
    expect(slot5.provenance.blankSpan).toEqual({
      start: 10,
      end: 16,
      correctText: "a bird"
    });
  });

  it("pins Novice Day 22 to the exact source-faithful 2/2/1 blueprint", () => {
    const override = getOverride("novice", 22);
    const [slot1, slot2, slot3, slot4, slot5] = override.questions;
    const contracts = [{
      candidate: slot1,
      source: "If I were you, I wouldn't date him.",
      prompt: "\"내가 너라면 그와 사귀지 않을 거예요.\"에 맞는 영어 문장을 고르세요.",
      choices: [
        "If I were you, I wouldn't date him.",
        "If I were you, I wouldn't call him.",
        "If I were you, I wouldn't marry him.",
        "If I were you, I wouldn't work with him."
      ],
      reason: "제시된 뜻은 그와 사귀지 않겠다는 내용이므로 \"wouldn't\" 뒤에는 \"date him\"이 와야 합니다.",
      target: ["fixed_expression", 26, 34, "date him"]
    }, {
      candidate: slot2,
      source: "If I won the lottery, I would buy a car.",
      prompt: "\"If + 과거형, 주어 + would + 동사원형\" 패턴을 사용해 \"복권에 당첨된다면 차를 살 텐데요.\"에 맞게 빈칸을 채우세요: ____, I would buy a car.",
      choices: [
        "If I won the lottery, I would buy a car.",
        "Whenever I won the lottery, I would buy a car.",
        "After I won the lottery, I would buy a car.",
        "Because I had won the lottery, I would buy a car."
      ],
      reason: "가정법 과거는 If + 과거형 절로 시작합니다. 정답은 \"If I won the lottery\"입니다.",
      target: ["fixed_expression", 0, 20, "If I won the lottery"]
    }, {
      candidate: slot3,
      source: "If I won the lottery, I would buy a car.",
      prompt: "\"If + 과거형, 주어 + would + 동사원형\" 패턴을 사용해 \"복권에 당첨된다면 차를 살 텐데요.\"에 맞는 영어 문장을 고르세요.",
      choices: [
        "If I won the lottery, I would buy a car.",
        "If I won the lottery, I might buy a car.",
        "If I won the lottery, I could buy a car.",
        "If I won the lottery, I should buy a car."
      ],
      reason: "가정한 결과는 주어 + would + 동사원형으로 나타냅니다. 정답은 \"would\"입니다.",
      target: ["fixed_expression", 24, 29, "would"]
    }, {
      candidate: slot4,
      source: "If I were a bird, I would fly in the sky.",
      prompt: "\"내가 새라면 하늘을 날 텐데요.\"에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: \"If I were a bird, I would swim in the sea.\"",
      choices: ["O", "X"],
      reason: "바뀐 문장은 하늘을 나는 것이 아니라 바다에서 헤엄친다는 뜻이므로 제시된 한국어 뜻과 다릅니다. 정답은 X입니다.",
      target: ["fixed_expression", 26, 40, "fly in the sky"]
    }, {
      candidate: slot5,
      source: "If I were a bird, I would fly in the sky.",
      prompt: "\"내가 새라면 하늘을 날 텐데요.\"에 맞게 빈칸을 채우세요: If I were ____, I would fly in the sky.",
      choices: [
        "If I were a bird, I would fly in the sky.",
        "If I were a pilot, I would fly in the sky.",
        "If I were a superhero, I would fly in the sky.",
        "If I were a dragon, I would fly in the sky."
      ],
      reason: "제시된 뜻은 내가 새라고 가정하는 내용이므로 빈칸에는 \"a bird\"가 와야 합니다.",
      target: ["fixed_expression", 10, 16, "a bird"]
    }] as const;

    expect(override.expectedSourceHash).toBe(
      "2b6639c1dd621c36833a19d87fa527aa8a3201ae1a614145c7b5aec9713b25c1"
    );
    expect(override.questions.map(pair)).toEqual(n22Pairs);
    expect(override.questions.map((candidate) => candidate.question.format)).toEqual([
      "multiple_choice", "fill_blank", "multiple_choice", "true_false", "fill_blank"
    ]);
    expect(override.questions.map((candidate) => candidate.question.kind)).toEqual([
      "translation", "pattern", "pattern", "translation", "translation"
    ]);
    expect(sourceCounts(override.questions)).toEqual([1, 2, 2]);
    expect(answer(slot4)).toBe("X");
    expect(hasUniqueStandardLearningTargets(override.questions)).toBe(true);
    expect(override.questions.every(auditStandardQuestionCandidate)).toBe(true);

    for (const contract of contracts) {
      const candidate = contract.candidate;
      const candidateMutations = mutations(candidate);
      expect(candidate.provenance.sourceSentence).toBe(contract.source);
      expect(candidate.question.prompt).toBe(contract.prompt);
      expect([...reconstructedChoices(candidate)].sort())
        .toEqual([...contract.choices].sort());
      expect(candidate.question.explanation).toBe(contract.reason);
      expect(candidate.question.feedback.reason).toBe(contract.reason);
      expect(candidateMutations.every((mutation) => (
        mutation.ruleFamily === contract.target[0]
        && mutation.start === contract.target[1]
        && mutation.end === contract.target[2]
        && mutation.changedFrom === contract.target[3]
        && mutation.reason === contract.reason
      ))).toBe(true);
    }

    const learnerText = override.questions.flatMap((candidate) => [
      candidate.question.prompt,
      candidate.question.feedback.correctSentence,
      candidate.provenance.sourceSentence,
      ...reconstructedChoices(candidate)
    ]).join("\n");
    expect(learnerText).toContain("If I were you");
    expect(learnerText).toContain("If I were a bird");
    expect(learnerText).not.toMatch(/If I was (?:you|a bird)/u);
    expect(learnerText).not.toMatch(/\b(?:WCT|Day|course|Prenovice|Novice)\b/iu);
  });
});
