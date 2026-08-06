import { describe, expect, it } from "vitest";

import {
  auditStandardQuestionCandidate,
  buildFillBlankCandidates,
  buildMultipleChoiceCandidates,
  buildTrueFalseCandidate,
  canBuildStandardKind
} from "@/lib/wct/quiz/standard/candidates";
import {
  orderStandardChoiceTexts
} from "@/lib/wct/quiz/standard/generator";
import {
  hasBalancedStandardSourceUsage,
  hasUniqueStandardLearningTargets
} from "@/lib/wct/quiz/standard/diversity";
import { enumerateSentenceMutations } from "@/lib/wct/quiz/standard/mutations";
import { STANDARD_WCT_DAY_OVERRIDES } from "@/lib/wct/quiz/standard/overrides";
import type {
  WctStandardQuestionCandidate,
  WctStandardQuizSource,
  WctStandardSourceEntry
} from "@/lib/wct/quiz/standard/types";

type Pair = readonly [patternId: string, exampleId: string];

const day21Reason = "일반적인 현재형 if절에서는 단수에 맞는 be동사 형태로 \"is\"를 씁니다.";
const day6Reason = "\"피아노를 칠 수 있나요?\"는 현재의 능력을 묻기 때문에 문두에 조동사 \"Can\"을 두고, 주어 \"you\" 뒤에는 동사원형 \"play\"를 씁니다. 정답 표현은 \"Can you play the piano?\"입니다.";
const day11Reason = "\"Who owns this car?\"도 소유자를 묻는 뜻은 비슷하지만, 요구된 \"whose + 명사\" 구조를 사용하지 않습니다. 따라서 정답은 \"Whose car is this?\"입니다. \"Does this car belong to you?\"와 \"Is this your car?\"는 차가 상대의 것인지 묻는 예/아니요 질문입니다.";
const day15Reason = "\"I've heard a lot about you.\"에서 \"a lot\"은 \"많이\", \"about you\"는 \"당신에 관해\"를 뜻하므로 제시된 한국어 뜻과 일치합니다.";
const day29Reason = "\"see/hear + 목적어 + -ing\"에서 -ing형은 목적어가 하는 동작을 나타냅니다. 여기서는 \"코를 고는 것\"을 들었으므로 \"talking\", \"singing\", \"crying\"이 아니라 \"snoring\"이 맞습니다.";
const day30Reason = "직업의 역할이나 내용을 \"to + 동사원형\"으로 설명하므로 \"to stop people\"이 맞습니다.";

const day21Weather = sourceEntry(
  ["2fda405d-77f2-4419-adc5-abc91ae01f9a", "57c66deb-16e6-45ec-8d4b-dede69e76e5c"],
  "If + 현재형, 명령문/제안",
  "~하면 ~해라/하자",
  "If the weather is nice tomorrow, let's go on a trip.",
  "내일 날씨가 좋으면 여행 가요."
);
const day21ThereIs = sourceEntry(
  ["2fda405d-77f2-4419-adc5-abc91ae01f9a", "68b34252-50e8-448e-9a16-09bc39565092"],
  "If + 현재형, 명령문/제안",
  "~하면 ~해라/하자",
  "If there is a good person, introduce me.",
  "좋은 사람이 있으면 소개해 주세요."
);
const day21Money = sourceEntry(
  ["e4329ac3-84d9-4c7e-a9f4-01ad84448a24", "1513e6d5-0044-4c86-b846-e191279dc5df"],
  "If + 현재형, 주어 + will + 동사원형",
  "~하면 ~할 것이다",
  "If I make a lot of money, I will buy a house.",
  "돈을 많이 벌면 집을 살 거예요."
);
const day21NativeSpeaker = sourceEntry(
  ["e4329ac3-84d9-4c7e-a9f4-01ad84448a24", "d7c64822-e031-4add-9823-f0a8a810a362"],
  "If + 현재형, 주어 + will + 동사원형",
  "~하면 ~할 것이다",
  "If I date a native speaker, I will be good at English.",
  "원어민과 사귀면 영어를 잘하게 될 거예요."
);
const day21Source: WctStandardQuizSource = {
  lessonKey: "wct-book:wct-novice:day:21",
  sourceId: "b8bc667e-330e-402c-9d06-eb094c039ff6",
  level: "novice",
  dayNumber: 21,
  topic: "if 조건문",
  sourceHash: "5487375d9fc09d465c1cb0dd8cdf623cd68b975b12cb393dc62ed490f6da5a18",
  entries: [day21Weather, day21ThereIs, day21Money, day21NativeSpeaker]
};

const day29Enjoy = sourceEntry(
  ["07972de5-3d42-445a-aed4-7d55d925bd8f", "10472aeb-5dfd-40a5-a0ef-753516707baa"],
  "enjoy/finish/avoid/keep/practice + -ing",
  "~하는 것을 즐기다·끝내다·피하다·계속하다·연습하다",
  "I enjoy talking in English.",
  "영어로 대화하는 것을 즐겨요."
);
const day29Keep = sourceEntry(
  ["07972de5-3d42-445a-aed4-7d55d925bd8f", "285796ea-5f3e-466a-b4d2-6506914e521c"],
  "enjoy/finish/avoid/keep/practice + -ing",
  "~하는 것을 즐기다·끝내다·피하다·계속하다·연습하다",
  "I keep studying English.",
  "계속 영어를 공부해요."
);
const day29Stopped = sourceEntry(
  ["07972de5-3d42-445a-aed4-7d55d925bd8f", "743a8ae7-26b5-4854-b0f5-a58263f287f7"],
  "enjoy/finish/avoid/keep/practice + -ing",
  "~하는 것을 즐기다·끝내다·피하다·계속하다·연습하다",
  "They stopped fighting.",
  "그들은 싸움을 멈췄어요."
);
const day29Saw = sourceEntry(
  ["417ba2b4-d5c9-4036-9ec3-f26f7f243ffa", "09e83dd1-322b-45c3-ac7d-bb642f5e3445"],
  "see/hear + 목적어 + -ing",
  "목적어가 ~하는 것을 보다·듣다",
  "I saw him running.",
  "그가 달리는 것을 봤어요."
);
const day29Heard = sourceEntry(
  ["417ba2b4-d5c9-4036-9ec3-f26f7f243ffa", "05089a8b-66da-429f-a01f-2cf82560230e"],
  "see/hear + 목적어 + -ing",
  "목적어가 ~하는 것을 보다·듣다",
  "I heard you snoring.",
  "당신이 코 고는 것을 들었어요."
);
const day29Source: WctStandardQuizSource = {
  lessonKey: "wct-book:wct-novice:day:29",
  sourceId: "2f881f50-c18d-4e60-b825-3a565e3475f2",
  level: "novice",
  dayNumber: 29,
  topic: "동명사·to부정사",
  sourceHash: "f34a211fea5e8f30a0f30998a90e6e208851311154a56a9a90ee4ead29fcda25",
  entries: [day29Enjoy, day29Keep, day29Stopped, day29Saw, day29Heard]
};

const round8WholeDayContracts = [{
  dayNumber: 6,
  sourceHash: "f0d0405debf7ea5ce40dca2cef9b132df2d92492eaf432b0ac208f7de7121e86",
  pairs: [
    ["e04e84e4-7f70-4f44-a9ae-638fdce2d1e9", "ddae13b4-6fd8-4604-a882-b575487110d2"],
    ["e04e84e4-7f70-4f44-a9ae-638fdce2d1e9", "b09f0cc7-1e2b-41bc-9cf6-ab6eafbb4a90"],
    ["89786c1c-b457-4e90-85d0-923a4ac865cb", "3e53c4cb-3831-4963-8575-795814203eb4"],
    ["89786c1c-b457-4e90-85d0-923a4ac865cb", "62c99b78-0e97-4fec-95fc-86a7fccc584b"],
    ["e04e84e4-7f70-4f44-a9ae-638fdce2d1e9", "b09f0cc7-1e2b-41bc-9cf6-ab6eafbb4a90"]
  ],
  sourceCounts: [1, 1, 1, 2],
  truth: "X",
  prompts: [
    "\"그녀는 예쁜가요?\"에 맞는 영어 문장을 고르세요.",
    "\"be/조동사 + 주어 ...?\" 패턴을 사용해 \"피아노를 칠 수 있나요?\"에 맞게 빈칸을 채우세요: ____ you play the piano?",
    "\"do/does/did + 주어 + 동사원형 ...?\" 패턴을 사용해 \"그는 수원에 사나요?\"에 맞는 영어 문장을 고르세요.",
    "\"저녁을 먹었나요?\"에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: \"Did you have breakfast?\"",
    "\"피아노를 칠 수 있나요?\"에 맞게 빈칸을 채우세요: Can you play ____?"
  ]
}, {
  dayNumber: 11,
  sourceHash: "2cdf1fbc7a6f7653842c0f594f875dbee7d55f6f56ec4bad669880f9a603e64b",
  pairs: [
    ["c78eb1a0-21c0-4792-8c34-3cdf8941e40c", "76801670-640f-402e-89fd-930dc639c895"],
    ["c2970d6c-f10e-47ab-8b2b-aa963636075f", "d6fb440f-f08d-43a8-b6cf-e0041df33acf"],
    ["c78eb1a0-21c0-4792-8c34-3cdf8941e40c", "a45abf6f-ab92-41d4-aa82-a762dd03fdd3"],
    ["c2970d6c-f10e-47ab-8b2b-aa963636075f", "d6fb440f-f08d-43a8-b6cf-e0041df33acf"],
    ["c78eb1a0-21c0-4792-8c34-3cdf8941e40c", "76801670-640f-402e-89fd-930dc639c895"]
  ],
  sourceCounts: [1, 2, 2],
  truth: "X",
  prompts: [
    "\"어떤 종류의 영화를 좋아하나요?\"에 맞는 영어 문장을 고르세요.",
    "\"how many / how long / how far / how tall\" 패턴을 사용해 \"소주를 몇 병 마실 수 있나요?\"에 맞게 빈칸을 채우세요: ____ can you drink?",
    "\"what kind of / which / whose + 명사\" 패턴을 사용해 \"이것은 누구의 차인가요?\"에 맞는 영어 문장을 고르세요.",
    "\"소주를 몇 병 마실 수 있나요?\"에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: \"How many bottles of beer can you drink?\"",
    "\"어떤 종류의 영화를 좋아하나요?\"에 맞게 빈칸을 채우세요: What kind of ____ do you like?"
  ]
}, {
  dayNumber: 15,
  sourceHash: "acbae168a5069582b1e3681d4c9f69f4a994d11ab73b25d8133b6704c33797ad",
  pairs: [
    ["67ee0ad6-c7ca-4599-b98a-28e6820b7c43", "1d1baf64-346a-4f87-a78e-4563fdd1e58d"],
    ["9b5e0d86-b351-4273-90e3-05feb8962a88", "85fa5142-ae97-473b-8728-78c69c9381fb"],
    ["67ee0ad6-c7ca-4599-b98a-28e6820b7c43", "1d1baf64-346a-4f87-a78e-4563fdd1e58d"],
    ["9b5e0d86-b351-4273-90e3-05feb8962a88", "5aebbaaa-e258-4139-b4dd-7cfc1211cec0"],
    ["9b5e0d86-b351-4273-90e3-05feb8962a88", "85fa5142-ae97-473b-8728-78c69c9381fb"]
  ],
  sourceCounts: [1, 2, 2],
  truth: "O",
  prompts: [
    "\"오늘 세 시간 동안 공부할 거예요.\"에 맞는 영어 문장을 고르세요.",
    "\"of / about\" 패턴을 사용해 \"나를 어떻게 생각하나요?\"에 맞게 빈칸을 채우세요: What do you ____?",
    "\"with / for / by\" 패턴을 사용해 \"오늘 세 시간 동안 공부할 거예요.\"에 맞는 영어 문장을 고르세요.",
    "\"당신에 관해 많이 들었어요.\"에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: \"I've heard a lot about you.\"",
    "\"나를 어떻게 생각하나요?\"에 맞게 빈칸을 채우세요: What do you think of ____?"
  ]
}, {
  dayNumber: 30,
  sourceHash: "7a22029211199ab9be909f57d4a75f6b8a49efd67f14543e76bf1a473d7a4037",
  pairs: [
    ["8db44f7a-31cc-4a17-a18e-2b3a6f713745", "172705a8-03ad-4519-8480-f784d0260ef5"],
    ["8db44f7a-31cc-4a17-a18e-2b3a6f713745", "99245268-bd85-41b6-9134-3e9758d6dc60"],
    ["e65a26dc-86e9-4c9b-99ae-ddf44fea108f", "d4c92579-2365-4398-8362-cd7483ed22f0"],
    ["e65a26dc-86e9-4c9b-99ae-ddf44fea108f", "1fe994a0-225a-4970-ac7c-57fb7d2fe045"],
    ["8db44f7a-31cc-4a17-a18e-2b3a6f713745", "99245268-bd85-41b6-9134-3e9758d6dc60"]
  ],
  sourceCounts: [1, 1, 1, 2],
  truth: "X",
  prompts: [
    "\"내 취미는 배드민턴을 치는 거예요.\"에 맞는 영어 문장을 고르세요.",
    "\"주어 + be + -ing / to + 동사원형\" 패턴을 사용해 \"내 일은 사람들을 제지하는 거예요.\"에 맞게 빈칸을 채우세요: My job is ____.",
    "\"-ing / To + 동사원형 + is ...\" 패턴을 사용해 \"부자인 것은 좋아요.\"에 맞는 영어 문장을 고르세요.",
    "\"공부하는 것은 미래에 도움이 돼요.\"에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: \"To study is good for your health.\"",
    "\"내 일은 사람들을 제지하는 거예요.\"에 맞게 빈칸을 채우세요: ____ is to stop people."
  ]
}] as const;

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

function getOverride(dayNumber: number) {
  const override = STANDARD_WCT_DAY_OVERRIDES.find((item) => (
    item.level === "novice" && item.dayNumber === dayNumber
  ));
  if (!override) throw new Error(`Missing novice Day ${dayNumber} override`);
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

function candidateWithTarget(
  candidates: readonly WctStandardQuestionCandidate[],
  target: string
) {
  const candidate = candidates.find((item) => (
    mutations(item).some((mutation) => mutation.changedFrom === target)
  ));
  if (!candidate) throw new Error(`Missing candidate target: ${target}`);
  return candidate;
}

function reconstructedChoices(candidate: WctStandardQuestionCandidate) {
  const blank = candidate.provenance.blankSpan;
  return candidate.question.choices.map((choice) => blank
    ? `${candidate.provenance.sourceSentence.slice(0, blank.start)}${choice.text}${candidate.provenance.sourceSentence.slice(blank.end)}`
    : choice.text);
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

describe("WCT v2 Round 8 editorial contracts", () => {
  it("gives Day 21 weather one ordinary present-tense answer with scoped evidence", () => {
    const weatherMutations = enumerateSentenceMutations(day21Weather).filter((mutation) => (
      mutation.ruleFamily === "declared_tense_form"
    ));
    const slot1 = candidateWithTarget(
      buildFillBlankCandidates(day21Weather, "translation"),
      "is"
    );

    expect(weatherMutations.map((mutation) => ({
      recipe: mutation.recipe,
      ruleFamily: mutation.ruleFamily,
      text: mutation.text,
      changedFrom: mutation.changedFrom,
      changedTo: mutation.changedTo,
      start: mutation.start,
      end: mutation.end,
      reason: mutation.reason
    }))).toEqual([
      {
        recipe: "declared_tense_form",
        ruleFamily: "declared_tense_form",
        text: "If the weather are nice tomorrow, let's go on a trip.",
        changedFrom: "is",
        changedTo: "are",
        start: 15,
        end: 17,
        reason: day21Reason
      },
      {
        recipe: "declared_tense_form",
        ruleFamily: "declared_tense_form",
        text: "If the weather am nice tomorrow, let's go on a trip.",
        changedFrom: "is",
        changedTo: "am",
        start: 15,
        end: 17,
        reason: day21Reason
      },
      {
        recipe: "declared_tense_form",
        ruleFamily: "declared_tense_form",
        text: "If the weather been nice tomorrow, let's go on a trip.",
        changedFrom: "is",
        changedTo: "been",
        start: 15,
        end: 17,
        reason: day21Reason
      }
    ]);
    expect(slot1.question.prompt).toBe(
      "\"내일 날씨가 좋으면 여행 가요.\"에 맞게 빈칸을 채우세요: If the weather ____ nice tomorrow, let's go on a trip."
    );
    expect([...slot1.question.choices.map((choice) => choice.text)].sort())
      .toEqual(["am", "are", "been", "is"]);
    expect(orderStandardChoiceTexts(
      day21Source,
      0,
      slot1.question.choices.map((choice) => choice.text)
    )).toEqual(["am", "is", "are", "been"]);
    expect(slot1.provenance.blankSpan).toEqual({
      start: 15,
      end: 17,
      correctText: "is"
    });
    expect(answer(slot1)).toBe("is");
    expect(slot1.question.explanation).toBe(day21Reason);
    expect(slot1.question.feedback.reason).toBe(day21Reason);
    expect(auditStandardQuestionCandidate(slot1)).toBe(true);
  });

  it("makes the Day 21 existential true-false statement unequivocally X", () => {
    const slot5 = buildTrueFalseCandidate(day21ThereIs, "X", "pattern");

    expect(slot5).not.toBeNull();
    expect(slot5!.question.prompt).toBe(
      "\"If + 현재형, 명령문/제안\" 패턴을 사용해 \"좋은 사람이 있으면 소개해 주세요.\"에 맞는 문장이면 O, 아니면 X를 고르세요: \"If there are a good person, introduce me.\""
    );
    expect(slot5!.question.choices.map((choice) => choice.text)).toEqual(["O", "X"]);
    expect(answer(slot5!)).toBe("X");
    expect(slot5!.provenance.statementMutation).toEqual(expect.objectContaining({
      recipe: "declared_tense_form",
      ruleFamily: "declared_tense_form",
      text: "If there are a good person, introduce me.",
      changedFrom: "is",
      changedTo: "are",
      start: 9,
      end: 11,
      reason: day21Reason
    }));
    expect(slot5!.question.feedback.correctSentence)
      .toBe("If there is a good person, introduce me.");
    expect(slot5!.question.explanation).toBe(day21Reason);
    expect(slot5!.question.feedback.reason).toBe(day21Reason);
    expect(auditStandardQuestionCandidate(slot5!)).toBe(true);
  });

  it("preserves the complete Day 21 layout, provenance, clean neighbors, and guards", () => {
    const slot1 = candidateWithTarget(
      buildFillBlankCandidates(day21Weather, "translation"),
      "is"
    );
    const slot2 = candidateWithTarget(
      buildMultipleChoiceCandidates(day21NativeSpeaker, "translation"),
      "be"
    );
    const slot3 = candidateWithTarget(
      buildFillBlankCandidates(day21Money, "translation"),
      "make"
    );
    const slot4 = candidateWithTarget(
      buildMultipleChoiceCandidates(day21Money, "pattern"),
      "buy"
    );
    const slot5 = buildTrueFalseCandidate(day21ThereIs, "X", "pattern")!;
    const day21 = [slot1, slot2, slot3, slot4, slot5];

    expect(day21.map((candidate) => candidate.question.format)).toEqual([
      "fill_blank", "multiple_choice", "fill_blank", "multiple_choice", "true_false"
    ]);
    expect(day21.map((candidate) => candidate.question.kind)).toEqual([
      "translation", "translation", "translation", "pattern", "pattern"
    ]);
    expect(day21.map((candidate) => candidate.question.choices.length))
      .toEqual([4, 4, 4, 4, 2]);
    expect(day21.map(pair)).toEqual([
      ["2fda405d-77f2-4419-adc5-abc91ae01f9a", "57c66deb-16e6-45ec-8d4b-dede69e76e5c"],
      ["e4329ac3-84d9-4c7e-a9f4-01ad84448a24", "d7c64822-e031-4add-9823-f0a8a810a362"],
      ["e4329ac3-84d9-4c7e-a9f4-01ad84448a24", "1513e6d5-0044-4c86-b846-e191279dc5df"],
      ["e4329ac3-84d9-4c7e-a9f4-01ad84448a24", "1513e6d5-0044-4c86-b846-e191279dc5df"],
      ["2fda405d-77f2-4419-adc5-abc91ae01f9a", "68b34252-50e8-448e-9a16-09bc39565092"]
    ]);
    expect(sourceCounts(day21)).toEqual([1, 1, 1, 2]);
    expect(answer(slot5)).toBe("X");
    expect(hasUniqueStandardLearningTargets(day21)).toBe(true);
    expect(day21.every(auditStandardQuestionCandidate)).toBe(true);

    expect(slot2.question.prompt).toBe(
      "\"원어민과 사귀면 영어를 잘하게 될 거예요.\"에 맞는 영어 문장을 고르세요."
    );
    expect([...reconstructedChoices(slot2)].sort()).toEqual([
      "If I date a native speaker, I will be good at English.",
      "If I date a native speaker, I will am good at English.",
      "If I date a native speaker, I will being good at English.",
      "If I date a native speaker, I will is good at English."
    ].sort());
    expect(slot2.question.explanation)
      .toBe("조동사 \"will\" 뒤의 정답은 동사원형 \"be\"입니다.");
    expect(mutations(slot2).every((mutation) => (
      mutation.ruleFamily === "modal_base_form"
      && mutation.start === 35
      && mutation.end === 37
      && mutation.changedFrom === "be"
    ))).toBe(true);

    expect(slot3.question.prompt).toBe(
      "\"돈을 많이 벌면 집을 살 거예요.\"에 맞게 빈칸을 채우세요: If I ____ a lot of money, I will buy a house."
    );
    expect([...reconstructedChoices(slot3)].sort()).toEqual([
      "If I make a lot of money, I will buy a house.",
      "If I makes a lot of money, I will buy a house.",
      "If I made a lot of money, I will buy a house.",
      "If I making a lot of money, I will buy a house."
    ].sort());
    expect(slot3.question.explanation).toBe("if절의 현재 조건에 맞는 정답은 \"make\"입니다.");
    expect(slot3.provenance.blankSpan).toEqual({ start: 5, end: 9, correctText: "make" });
    expect(mutations(slot3).every((mutation) => (
      mutation.ruleFamily === "declared_tense_form"
      && mutation.start === 5
      && mutation.end === 9
      && mutation.changedFrom === "make"
    ))).toBe(true);

    expect(slot4.question.prompt).toBe(
      "\"If + 현재형, 주어 + will + 동사원형\" 패턴을 사용해 \"돈을 많이 벌면 집을 살 거예요.\"에 맞는 영어 문장을 고르세요."
    );
    expect([...reconstructedChoices(slot4)].sort()).toEqual([
      "If I make a lot of money, I will buy a house.",
      "If I make a lot of money, I will buys a house.",
      "If I make a lot of money, I will bought a house.",
      "If I make a lot of money, I will buying a house."
    ].sort());
    expect(slot4.question.explanation)
      .toBe("조동사 \"will\" 뒤의 정답은 동사원형 \"buy\"입니다.");
    expect(mutations(slot4).every((mutation) => (
      mutation.ruleFamily === "modal_base_form"
      && mutation.start === 33
      && mutation.end === 36
      && mutation.changedFrom === "buy"
    ))).toBe(true);

    expect(day21.flatMap((candidate) => [
      candidate.question.prompt,
      candidate.question.feedback.correctSentence,
      ...candidate.question.choices.map((choice) => choice.text)
    ]).join("\n")).not.toMatch(/\b(?:WCT|Day|course|Prenovice|Novice)\b/iu);
  });

  it("uses a local Can fill span for Novice Day 6 slot 2", () => {
    const slot2 = getOverride(6).questions[1];

    expect(pair(slot2)).toEqual([
      "e04e84e4-7f70-4f44-a9ae-638fdce2d1e9",
      "b09f0cc7-1e2b-41bc-9cf6-ab6eafbb4a90"
    ]);
    expect(slot2.provenance.sourceSentence).toBe("Can you play the piano?");
    expect(slot2.question.kind).toBe("pattern");
    expect(slot2.question.format).toBe("fill_blank");
    expect(slot2.question.prompt).toBe(
      "\"be/조동사 + 주어 ...?\" 패턴을 사용해 \"피아노를 칠 수 있나요?\"에 맞게 빈칸을 채우세요: ____ you play the piano?"
    );
    expect(slot2.provenance.blankSpan).toEqual({ start: 0, end: 3, correctText: "Can" });
    expect(slot2.provenance.blankSpan!.end - slot2.provenance.blankSpan!.start)
      .toBeLessThan(slot2.provenance.sourceSentence.length);
    expect([...slot2.question.choices.map((choice) => choice.text)].sort())
      .toEqual(["Can", "Did", "Should", "Will"]);
    expect([...reconstructedChoices(slot2)].sort()).toEqual([
      "Can you play the piano?",
      "Did you play the piano?",
      "Will you play the piano?",
      "Should you play the piano?"
    ].sort());
    expect(answer(slot2)).toBe("Can");
    expect(mutations(slot2).map((mutation) => [
      mutation.ruleFamily,
      mutation.text,
      mutation.changedFrom,
      mutation.changedTo,
      mutation.start,
      mutation.end
    ])).toEqual([
      ["fixed_expression", "Did you play the piano?", "Can", "Did", 0, 3],
      ["fixed_expression", "Will you play the piano?", "Can", "Will", 0, 3],
      ["fixed_expression", "Should you play the piano?", "Can", "Should", 0, 3]
    ]);
    expect(slot2.question.explanation).toBe(day6Reason);
    expect(slot2.question.feedback.reason).toBe(day6Reason);
    expect(mutations(slot2).every((mutation) => mutation.reason === day6Reason)).toBe(true);
    expect(auditStandardQuestionCandidate(slot2)).toBe(true);
  });

  it("explains the close paraphrase in Novice Day 11 slot 3", () => {
    const slot3 = getOverride(11).questions[2];
    const whoOwnsEvidence = slot3.provenance.choiceEvidence.find((evidence) => (
      evidence.choiceText === "Who owns this car?"
    ));

    expect(pair(slot3)).toEqual([
      "c78eb1a0-21c0-4792-8c34-3cdf8941e40c",
      "a45abf6f-ab92-41d4-aa82-a762dd03fdd3"
    ]);
    expect(slot3.provenance.sourceSentence).toBe("Whose car is this?");
    expect(slot3.question.prompt).toBe(
      "\"what kind of / which / whose + 명사\" 패턴을 사용해 \"이것은 누구의 차인가요?\"에 맞는 영어 문장을 고르세요."
    );
    expect([...slot3.question.choices.map((choice) => choice.text)].sort()).toEqual([
      "Whose car is this?",
      "Who owns this car?",
      "Does this car belong to you?",
      "Is this your car?"
    ].sort());
    expect(answer(slot3)).toBe("Whose car is this?");
    expect(slot3.question.format).toBe("multiple_choice");
    expect(slot3.question.kind).toBe("pattern");
    expect(slot3.provenance.blankSpan).toBeUndefined();
    expect(slot3.question.explanation).toBe(day11Reason);
    expect(slot3.question.feedback.reason).toBe(day11Reason);
    expect(mutations(slot3).every((mutation) => mutation.reason === day11Reason)).toBe(true);
    expect(whoOwnsEvidence).toMatchObject({
      role: "distractor",
      mutation: {
        ruleFamily: "fixed_expression",
        changedFrom: "Whose car is this?",
        changedTo: "Who owns this car?",
        start: 0,
        end: 18,
        reason: day11Reason
      }
    });
    expect(slot3.question.explanation).toContain("뜻은 비슷하지만");
    expect(slot3.question.explanation).toContain("whose + 명사");
    expect(auditStandardQuestionCandidate(slot3)).toBe(true);
  });

  it("uses the corrected idiomatic source and feedback in Novice Day 15 slot 4", () => {
    const slot4 = getOverride(15).questions[3];
    const learnerText = [
      slot4.question.prompt,
      slot4.question.feedback.correctSentence,
      slot4.provenance.sourceSentence
    ].join("\n");

    expect(pair(slot4)).toEqual([
      "9b5e0d86-b351-4273-90e3-05feb8962a88",
      "5aebbaaa-e258-4139-b4dd-7cfc1211cec0"
    ]);
    expect(slot4.question.prompt).toBe(
      "\"당신에 관해 많이 들었어요.\"에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: \"I've heard a lot about you.\""
    );
    expect(slot4.provenance.sourceSentence).toBe("I've heard a lot about you.");
    expect(slot4.question.feedback.correctSentence).toBe("I've heard a lot about you.");
    expect(slot4.question.format).toBe("true_false");
    expect(slot4.question.kind).toBe("translation");
    expect(answer(slot4)).toBe("O");
    expect(mutations(slot4)).toEqual([]);
    expect(slot4.question.explanation).toBe(day15Reason);
    expect(slot4.question.feedback.reason).toBe(day15Reason);
    expect(slot4.question.explanation).not.toContain("듣다는");
    expect(learnerText).toContain("I've heard a lot about you.");
    expect(learnerText).not.toContain("I heard about you a lot.");
    expect(auditStandardQuestionCandidate(slot4)).toBe(true);
  });

  it("uses the exact source-faithful Day 29 heard-action slot and 2-2-1 guard", () => {
    const day29 = getOverride(29);
    const slot3 = day29.questions[2];
    const slot4 = day29.questions[3];

    expect(pair(slot3)).toEqual([
      "417ba2b4-d5c9-4036-9ec3-f26f7f243ffa",
      "05089a8b-66da-429f-a01f-2cf82560230e"
    ]);
    expect(slot3.provenance.sourceSentence).toBe("I heard you snoring.");
    expect(slot3.question.prompt).toBe(
      "\"see/hear + 목적어 + -ing\" 패턴을 사용해 \"당신이 코 고는 것을 들었어요.\"에 맞는 영어 문장을 고르세요."
    );
    expect([...slot3.question.choices.map((choice) => choice.text)].sort()).toEqual([
      "I heard you snoring.",
      "I heard you talking.",
      "I heard you singing.",
      "I heard you crying."
    ].sort());
    expect(orderStandardChoiceTexts(
      day29Source,
      2,
      slot3.question.choices.map((choice) => choice.text)
    )).toEqual([
      "I heard you snoring.",
      "I heard you talking.",
      "I heard you singing.",
      "I heard you crying."
    ]);
    expect(answer(slot3)).toBe("I heard you snoring.");
    expect(slot3.question.explanation).toBe(day29Reason);
    expect(slot3.question.feedback).toEqual({
      correctSentence: "I heard you snoring.",
      pattern: "see/hear + 목적어 + -ing",
      reason: day29Reason
    });
    expect(mutations(slot3).map((mutation) => ({
      recipe: mutation.recipe,
      ruleFamily: mutation.ruleFamily,
      text: mutation.text,
      changedFrom: mutation.changedFrom,
      changedTo: mutation.changedTo,
      start: mutation.start,
      end: mutation.end,
      reason: mutation.reason
    }))).toEqual([
      {
        recipe: "fixed_expression",
        ruleFamily: "fixed_expression",
        text: "I heard you talking.",
        changedFrom: "snoring",
        changedTo: "talking",
        start: 12,
        end: 19,
        reason: day29Reason
      },
      {
        recipe: "fixed_expression",
        ruleFamily: "fixed_expression",
        text: "I heard you singing.",
        changedFrom: "snoring",
        changedTo: "singing",
        start: 12,
        end: 19,
        reason: day29Reason
      },
      {
        recipe: "fixed_expression",
        ruleFamily: "fixed_expression",
        text: "I heard you crying.",
        changedFrom: "snoring",
        changedTo: "crying",
        start: 12,
        end: 19,
        reason: day29Reason
      }
    ]);
    expect(auditStandardQuestionCandidate(slot3)).toBe(true);

    expect(day29.questions.map((candidate) => candidate.question.format)).toEqual([
      "multiple_choice", "fill_blank", "multiple_choice", "true_false", "fill_blank"
    ]);
    expect(day29.questions.map((candidate) => candidate.question.kind)).toEqual([
      "translation", "pattern", "pattern", "translation", "translation"
    ]);
    expect(sourceCounts(day29.questions)).toEqual([1, 1, 1, 2]);
    expect(hasUniqueStandardLearningTargets(day29.questions)).toBe(true);
    expect(hasBalancedStandardSourceUsage(day29Source, day29.questions, "O")).toBe(true);
    expect(day29.questions.every(auditStandardQuestionCandidate)).toBe(true);

    expect(pair(slot4)).toEqual([
      "417ba2b4-d5c9-4036-9ec3-f26f7f243ffa",
      "09e83dd1-322b-45c3-ac7d-bb642f5e3445"
    ]);
    expect(slot4.provenance.sourceSentence).toBe("I saw him running.");
    expect(slot4.provenance.statementMutation).toBeUndefined();
    expect(answer(slot4)).toBe("O");
    expect(day29.questions.filter((candidate) => (
      candidate.provenance.patternId === slot4.provenance.patternId
      && candidate.provenance.exampleId === slot4.provenance.exampleId
    ))).toHaveLength(1);
    expect(day29.questions.some((candidate) => (
      candidate.provenance.exampleId === "743a8ae7-26b5-4854-b0f5-a58263f287f7"
    ))).toBe(false);
    expect(canBuildStandardKind(day29Stopped, "pattern")).toBe(false);
    expect(enumerateSentenceMutations(day29Heard).some((mutation) => (
      mutation.changedFrom === "snoring"
    ))).toBe(false);
    expect(day29.questions.flatMap((candidate) => [
      candidate.question.prompt,
      ...candidate.question.choices.map((choice) => choice.text)
    ]).join("\n")).not.toMatch(/\b(?:WCT|Day|course|Prenovice|Novice)\b/iu);
  });

  it("describes job role and content in Novice Day 30 slot 2 feedback", () => {
    const slot2 = getOverride(30).questions[1];

    expect(pair(slot2)).toEqual([
      "8db44f7a-31cc-4a17-a18e-2b3a6f713745",
      "99245268-bd85-41b6-9134-3e9758d6dc60"
    ]);
    expect(slot2.provenance.sourceSentence).toBe("My job is to stop people.");
    expect(slot2.question.prompt).toBe(
      "\"주어 + be + -ing / to + 동사원형\" 패턴을 사용해 \"내 일은 사람들을 제지하는 거예요.\"에 맞게 빈칸을 채우세요: My job is ____."
    );
    expect([...slot2.question.choices.map((choice) => choice.text)].sort()).toEqual([
      "to stop people",
      "related to stopping people",
      "to help people",
      "important to many people"
    ].sort());
    expect(answer(slot2)).toBe("to stop people");
    expect(slot2.question.format).toBe("fill_blank");
    expect(slot2.question.kind).toBe("pattern");
    expect(slot2.provenance.blankSpan).toEqual({
      start: 10,
      end: 24,
      correctText: "to stop people"
    });
    expect(slot2.question.explanation).toBe(day30Reason);
    expect(slot2.question.feedback.reason).toBe(day30Reason);
    expect(mutations(slot2).every((mutation) => (
      mutation.ruleFamily === "fixed_expression"
      && mutation.changedFrom === "to stop people"
      && mutation.start === 10
      && mutation.end === 24
      && mutation.reason === day30Reason
    ))).toBe(true);
    expect(slot2.question.explanation).toContain("역할이나 내용");
    expect(slot2.question.explanation).not.toContain("직업의 목적");
    expect(auditStandardQuestionCandidate(slot2)).toBe(true);
  });

  it("preserves every reviewed Round 8 whole-Day and adjacent scope boundary", () => {
    const formats = [
      "multiple_choice", "fill_blank", "multiple_choice", "true_false", "fill_blank"
    ];
    const kinds = [
      "translation", "pattern", "pattern", "translation", "translation"
    ];

    for (const contract of round8WholeDayContracts) {
      const override = getOverride(contract.dayNumber);
      const trueFalse = override.questions.find((candidate) => (
        candidate.question.format === "true_false"
      ));

      expect(override.expectedSourceHash, `Day ${contract.dayNumber} source hash`)
        .toBe(contract.sourceHash);
      expect(override.questions.map(pair), `Day ${contract.dayNumber} source pairs`)
        .toEqual(contract.pairs);
      expect(
        override.questions.map((candidate) => candidate.question.format),
        `Day ${contract.dayNumber} formats`
      ).toEqual(formats);
      expect(
        override.questions.map((candidate) => candidate.question.kind),
        `Day ${contract.dayNumber} kinds`
      ).toEqual(kinds);
      expect(
        override.questions.map((candidate) => candidate.question.prompt),
        `Day ${contract.dayNumber} prompts`
      ).toEqual(contract.prompts);
      expect(sourceCounts(override.questions), `Day ${contract.dayNumber} source counts`)
        .toEqual(contract.sourceCounts);
      expect(trueFalse && answer(trueFalse), `Day ${contract.dayNumber} truth`)
        .toBe(contract.truth);
      expect(override.questions.every(auditStandardQuestionCandidate)).toBe(true);
      expect(hasUniqueStandardLearningTargets(override.questions)).toBe(true);
    }

    const day5Weather = getOverride(5).questions[1];
    expect(day5Weather.provenance.sourceSentence).toBe("The weather is depressing.");
    expect(day5Weather.question.prompt).toBe(
      "\"감정 형용사 -ing\" 패턴을 사용해 \"그 날씨는 사람을 우울하게 만들어요.\"에 맞게 빈칸을 채우세요: The weather is ____."
    );

    const day30Slot4 = getOverride(30).questions[3];
    expect(day30Slot4.provenance.sourceSentence)
      .toBe("To study is good for your future.");
    expect(day30Slot4.question.prompt).toBe(
      "\"공부하는 것은 미래에 도움이 돼요.\"에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: \"To study is good for your health.\""
    );
    expect(day30Slot4.question.feedback.reason).toBe(
      "제시된 뜻은 공부가 건강이 아니라 미래에 도움이 된다는 내용입니다. 정답 표현은 \"your future\"입니다."
    );
  });
});
