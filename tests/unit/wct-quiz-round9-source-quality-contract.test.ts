import { describe, expect, it } from "vitest";

import { auditStandardQuestionCandidate } from "@/lib/wct/quiz/standard/candidates";
import { hasUniqueStandardLearningTargets } from "@/lib/wct/quiz/standard/diversity";
import { STANDARD_WCT_DAY_OVERRIDES } from "@/lib/wct/quiz/standard/overrides";
import type {
  WctStandardLevel,
  WctStandardQuestionCandidate
} from "@/lib/wct/quiz/standard/types";

type Pair = readonly [patternId: string, exampleId: string];

const day15Reason = "\"I've heard a lot about you.\"에서 \"a lot\"은 \"많이\", \"about you\"는 \"당신에 관해\"를 뜻하므로 제시된 한국어 뜻과 일치합니다.";
const day30RichReason = "동명사구 \"Being rich\"를 주어로 두고 부자인 상태가 좋다고 설명해야 합니다. 정답 표현은 \"Being rich is good.\"입니다.";
const day30FutureReason = "제시된 뜻은 공부가 건강이 아니라 미래에 도움이 된다는 내용입니다. 정답 표현은 \"your future\"입니다.";

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

function learnerText(candidates: readonly WctStandardQuestionCandidate[]) {
  return candidates.flatMap((candidate) => [
    candidate.provenance.sourceSentence,
    candidate.question.prompt,
    candidate.question.explanation,
    candidate.question.feedback.correctSentence,
    candidate.question.feedback.reason,
    ...candidate.question.choices.map((choice) => choice.text)
  ]).join("\n");
}

describe("WCT v2 Round 9 source-quality contracts", () => {
  it("uses a natural beer container throughout Prenovice Day 3 slot 3", () => {
    const day3 = getOverride("prenovice", 3);
    const slot3 = day3.questions[2];

    expect(day3.expectedSourceHash)
      .toBe("08452da167730596f1cdb1695050be5c4cc95d183766455878e6add15909bac2");
    expect(pair(slot3)).toEqual([
      "e69bea89-5281-4c06-ae52-1586e540ccd7",
      "80c15412-b4a4-4518-8e4e-097166547134"
    ]);
    expect(slot3.provenance.sourceSentence).toBe("I want a glass of beer.");
    expect(slot3.question.prompt).toBe(
      "\"want + 명사\" 패턴을 사용해 \"나는 맥주 한 잔을 원한다.\"에 맞는 영어 문장을 고르세요."
    );
    expect([...slot3.question.choices.map((choice) => choice.text)].sort()).toEqual([
      "I want a glass of beer.",
      "I want a glass of water.",
      "I want a cup of coffee.",
      "I want a bottle of juice."
    ].sort());
    expect(answer(slot3)).toBe("I want a glass of beer.");
    expect(slot3.question.feedback.correctSentence).toBe("I want a glass of beer.");
    expect(slot3.question.explanation)
      .toBe("제시된 한국어 뜻과 문맥에 맞는 표현은 \"want a glass of beer\"입니다.");
    expect(mutations(slot3).map((mutation) => ({
      changedFrom: mutation.changedFrom,
      changedTo: mutation.changedTo,
      start: mutation.start,
      end: mutation.end
    }))).toEqual([
      { changedFrom: "want a glass of beer", changedTo: "want a glass of water", start: 2, end: 22 },
      { changedFrom: "want a glass of beer", changedTo: "want a cup of coffee", start: 2, end: 22 },
      { changedFrom: "want a glass of beer", changedTo: "want a bottle of juice", start: 2, end: 22 }
    ]);
    expect(learnerText(day3.questions)).not.toContain("I want a cup of beer.");
    expect(auditStandardQuestionCandidate(slot3)).toBe(true);
  });

  it("makes the emotion-causing experiencer explicit in Novice Day 5 slot 2", () => {
    const day5 = getOverride("novice", 5);
    const slot2 = day5.questions[1];

    expect(day5.expectedSourceHash)
      .toBe("e92f36992b9b3358d6b8c58c8a72f2a803ed936c671051e92c3d34e6cb620de4");
    expect(pair(slot2)).toEqual([
      "557eee5b-879f-44dc-ac63-a2e495638139",
      "37ff0120-8494-4377-b64e-a83d70bdfda0"
    ]);
    expect(slot2.provenance.sourceSentence).toBe("The weather is depressing.");
    expect(slot2.question.prompt).toBe(
      "\"감정 형용사 -ing\" 패턴을 사용해 \"그 날씨는 사람을 우울하게 만들어요.\"에 맞게 빈칸을 채우세요: The weather is ____."
    );
    expect(slot2.question.feedback.correctSentence).toBe("The weather is depressing.");
    expect(slot2.provenance.blankSpan).toEqual({
      start: 15,
      end: 25,
      correctText: "depressing"
    });
    expect(learnerText(day5.questions)).not.toContain("그 날씨는 우울하게 해요.");
    expect(auditStandardQuestionCandidate(slot2)).toBe(true);
  });

  it("uses idiomatic standalone English and matching feedback in Novice Day 15 slot 4", () => {
    const day15 = getOverride("novice", 15);
    const slot4 = day15.questions[3];

    expect(day15.expectedSourceHash)
      .toBe("acbae168a5069582b1e3681d4c9f69f4a994d11ab73b25d8133b6704c33797ad");
    expect(pair(slot4)).toEqual([
      "9b5e0d86-b351-4273-90e3-05feb8962a88",
      "5aebbaaa-e258-4139-b4dd-7cfc1211cec0"
    ]);
    expect(slot4.provenance.sourceSentence).toBe("I've heard a lot about you.");
    expect(slot4.question.prompt).toBe(
      "\"당신에 관해 많이 들었어요.\"에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: \"I've heard a lot about you.\""
    );
    expect(slot4.question.feedback).toEqual({
      correctSentence: "I've heard a lot about you.",
      pattern: "of / about",
      reason: day15Reason
    });
    expect(slot4.question.explanation).toBe(day15Reason);
    expect(answer(slot4)).toBe("O");
    expect(mutations(slot4)).toEqual([]);
    expect(learnerText(day15.questions)).not.toContain("I heard about you a lot.");
    expect(auditStandardQuestionCandidate(slot4)).toBe(true);
  });

  it("uses canonical irrealis were with shifted spans in Novice Day 22", () => {
    const day22 = getOverride("novice", 22);
    const slot1 = day22.questions[0];
    const slot4 = day22.questions[3];
    const slot5 = day22.questions[4];

    expect(day22.expectedSourceHash)
      .toBe("2b6639c1dd621c36833a19d87fa527aa8a3201ae1a614145c7b5aec9713b25c1");
    expect(pair(slot1)).toEqual([
      "83e1401a-1d72-4eca-8957-a9e0c0ceb5bf",
      "763e2bbe-40da-41aa-b58b-86b9744a8c6a"
    ]);
    expect(slot1.provenance.sourceSentence)
      .toBe("If I were you, I wouldn't date him.");
    expect([...slot1.question.choices.map((choice) => choice.text)].sort()).toEqual([
      "If I were you, I wouldn't date him.",
      "If I were you, I wouldn't call him.",
      "If I were you, I wouldn't marry him.",
      "If I were you, I wouldn't work with him."
    ].sort());
    expect(mutations(slot1).every((mutation) => (
      mutation.changedFrom === "date him"
      && mutation.start === 26
      && mutation.end === 34
    ))).toBe(true);

    expect(pair(slot4)).toEqual([
      "83e1401a-1d72-4eca-8957-a9e0c0ceb5bf",
      "d8ba0f89-5d79-4435-8597-723d4f1a59b5"
    ]);
    expect(slot4.provenance.sourceSentence)
      .toBe("If I were a bird, I would fly in the sky.");
    expect(slot4.question.prompt).toBe(
      "\"내가 새라면 하늘을 날 텐데요.\"에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: \"If I were a bird, I would swim in the sea.\""
    );
    expect(slot4.provenance.statementMutation).toEqual(expect.objectContaining({
      text: "If I were a bird, I would swim in the sea.",
      changedFrom: "fly in the sky",
      changedTo: "swim in the sea",
      start: 26,
      end: 40
    }));
    expect(answer(slot4)).toBe("X");

    expect(pair(slot5)).toEqual(pair(slot4));
    expect(slot5.provenance.sourceSentence)
      .toBe("If I were a bird, I would fly in the sky.");
    expect(slot5.question.prompt).toBe(
      "\"내가 새라면 하늘을 날 텐데요.\"에 맞게 빈칸을 채우세요: If I were ____, I would fly in the sky."
    );
    expect(slot5.provenance.blankSpan).toEqual({
      start: 10,
      end: 16,
      correctText: "a bird"
    });
    expect(learnerText(day22.questions)).not.toMatch(/If I was (?:you|a bird)/u);
    expect(day22.questions.every(auditStandardQuestionCandidate)).toBe(true);
  });

  it("makes the matrix subject explicit in Novice Day 28 slot 3", () => {
    const day28 = getOverride("novice", 28);
    const slot3 = day28.questions[2];

    expect(day28.expectedSourceHash)
      .toBe("ff130b04dfa3957a021f6071a7ebf9724232ad11670f2aa70bc6bf87e09c158c");
    expect(pair(slot3)).toEqual([
      "311f0464-a282-4a08-9f0e-119af0a16dbd",
      "c4b5112c-47b9-4e5a-9224-e59a7b58ae7a"
    ]);
    expect(slot3.provenance.sourceSentence).toBe("I want you to be with me.");
    expect(slot3.question.prompt).toBe(
      "\"동사 + 목적어 + to + 동사원형\" 패턴을 사용해 \"나는 당신이 나와 함께 있기를 원해요.\"에 맞는 영어 문장을 고르세요."
    );
    expect(answer(slot3)).toBe("I want you to be with me.");
    expect(slot3.question.feedback.correctSentence).toBe("I want you to be with me.");
    expect(learnerText(day28.questions))
      .not.toContain("\"당신이 나와 함께 있기를 원해요.\"");
    expect(auditStandardQuestionCandidate(slot3)).toBe(true);
  });

  it("distinguishes state and benefit meanings in Novice Day 30 slots 3 and 4", () => {
    const day30 = getOverride("novice", 30);
    const slot3 = day30.questions[2];
    const slot4 = day30.questions[3];

    expect(day30.expectedSourceHash)
      .toBe("7a22029211199ab9be909f57d4a75f6b8a49efd67f14543e76bf1a473d7a4037");
    expect(pair(slot3)).toEqual([
      "e65a26dc-86e9-4c9b-99ae-ddf44fea108f",
      "d4c92579-2365-4398-8362-cd7483ed22f0"
    ]);
    expect(slot3.provenance.sourceSentence).toBe("Being rich is good.");
    expect(slot3.question.prompt).toBe(
      "\"-ing / To + 동사원형 + is ...\" 패턴을 사용해 \"부자인 것은 좋아요.\"에 맞는 영어 문장을 고르세요."
    );
    expect(slot3.question.explanation).toBe(day30RichReason);
    expect(slot3.question.feedback.reason).toBe(day30RichReason);

    expect(pair(slot4)).toEqual([
      "e65a26dc-86e9-4c9b-99ae-ddf44fea108f",
      "1fe994a0-225a-4970-ac7c-57fb7d2fe045"
    ]);
    expect(slot4.provenance.sourceSentence)
      .toBe("To study is good for your future.");
    expect(slot4.question.prompt).toBe(
      "\"공부하는 것은 미래에 도움이 돼요.\"에 맞는 올바른 영어 문장이면 O, 아니면 X를 고르세요: \"To study is good for your health.\""
    );
    expect(slot4.question.explanation).toBe(day30FutureReason);
    expect(slot4.question.feedback.reason).toBe(day30FutureReason);
    expect(answer(slot4)).toBe("X");
    expect(learnerText(day30.questions)).not.toContain("부자가 되는 것은 좋아요.");
    expect(learnerText(day30.questions)).not.toContain("공부하는 것은 미래에 좋아요.");
    expect(auditStandardQuestionCandidate(slot3)).toBe(true);
    expect(auditStandardQuestionCandidate(slot4)).toBe(true);
  });

  it("preserves the six whole-Day layouts, provenance, truth states, and outside scope", () => {
    const contracts = [{
      level: "prenovice" as const,
      dayNumber: 3,
      pairs: [
        ["e69bea89-5281-4c06-ae52-1586e540ccd7", "55c77755-eec6-4c2a-88fc-ebeec5b7204e"],
        ["c3792a25-4903-42e0-bf14-2e2b6bb679eb", "f5a5e94a-09e4-489f-b01e-ac02d43179db"],
        ["e69bea89-5281-4c06-ae52-1586e540ccd7", "80c15412-b4a4-4518-8e4e-097166547134"],
        ["7691928a-f870-4a36-ad5e-77e67fe5cdf0", "066dfccb-b686-4420-8bf6-130328f3d64f"],
        ["c3792a25-4903-42e0-bf14-2e2b6bb679eb", "3ebb846f-738b-417c-9599-d7d7ceae4795"]
      ],
      formats: ["multiple_choice", "fill_blank", "multiple_choice", "fill_blank", "true_false"],
      kinds: ["translation", "pattern", "pattern", "translation", "translation"],
      counts: [1, 1, 1, 1, 1],
      truth: "X"
    }, ...([5, 15, 22, 28, 30].map((dayNumber) => ({
      level: "novice" as const,
      dayNumber,
      pairs: {
        5: [
          ["557eee5b-879f-44dc-ac63-a2e495638139", "6787d24b-011a-48ff-8145-ea02bf9bba02"],
          ["557eee5b-879f-44dc-ac63-a2e495638139", "37ff0120-8494-4377-b64e-a83d70bdfda0"],
          ["b967e7d6-d99b-43f9-87ce-0f298775fc8f", "c4a5972b-0604-4449-afd4-46d0ea48ec97"],
          ["b967e7d6-d99b-43f9-87ce-0f298775fc8f", "7293309a-4999-4f1f-8120-7a0af70f0130"],
          ["557eee5b-879f-44dc-ac63-a2e495638139", "6787d24b-011a-48ff-8145-ea02bf9bba02"]
        ],
        15: [
          ["67ee0ad6-c7ca-4599-b98a-28e6820b7c43", "1d1baf64-346a-4f87-a78e-4563fdd1e58d"],
          ["9b5e0d86-b351-4273-90e3-05feb8962a88", "85fa5142-ae97-473b-8728-78c69c9381fb"],
          ["67ee0ad6-c7ca-4599-b98a-28e6820b7c43", "1d1baf64-346a-4f87-a78e-4563fdd1e58d"],
          ["9b5e0d86-b351-4273-90e3-05feb8962a88", "5aebbaaa-e258-4139-b4dd-7cfc1211cec0"],
          ["9b5e0d86-b351-4273-90e3-05feb8962a88", "85fa5142-ae97-473b-8728-78c69c9381fb"]
        ],
        22: [
          ["83e1401a-1d72-4eca-8957-a9e0c0ceb5bf", "763e2bbe-40da-41aa-b58b-86b9744a8c6a"],
          ["83e1401a-1d72-4eca-8957-a9e0c0ceb5bf", "ce338116-6406-4cc1-8dfe-bddd60dbc9b9"],
          ["83e1401a-1d72-4eca-8957-a9e0c0ceb5bf", "ce338116-6406-4cc1-8dfe-bddd60dbc9b9"],
          ["83e1401a-1d72-4eca-8957-a9e0c0ceb5bf", "d8ba0f89-5d79-4435-8597-723d4f1a59b5"],
          ["83e1401a-1d72-4eca-8957-a9e0c0ceb5bf", "d8ba0f89-5d79-4435-8597-723d4f1a59b5"]
        ],
        28: [
          ["58c5f184-b86f-4d0d-a18e-2c9e8110b7d5", "aae710fb-ed32-43ca-83e9-183a50be888c"],
          ["58c5f184-b86f-4d0d-a18e-2c9e8110b7d5", "dd9ce0f6-152e-4de2-9fa1-47877e31ab22"],
          ["311f0464-a282-4a08-9f0e-119af0a16dbd", "c4b5112c-47b9-4e5a-9224-e59a7b58ae7a"],
          ["311f0464-a282-4a08-9f0e-119af0a16dbd", "1817f988-ce5c-4e37-89ec-f44f729fecf8"],
          ["58c5f184-b86f-4d0d-a18e-2c9e8110b7d5", "aae710fb-ed32-43ca-83e9-183a50be888c"]
        ],
        30: [
          ["8db44f7a-31cc-4a17-a18e-2b3a6f713745", "172705a8-03ad-4519-8480-f784d0260ef5"],
          ["8db44f7a-31cc-4a17-a18e-2b3a6f713745", "99245268-bd85-41b6-9134-3e9758d6dc60"],
          ["e65a26dc-86e9-4c9b-99ae-ddf44fea108f", "d4c92579-2365-4398-8362-cd7483ed22f0"],
          ["e65a26dc-86e9-4c9b-99ae-ddf44fea108f", "1fe994a0-225a-4970-ac7c-57fb7d2fe045"],
          ["8db44f7a-31cc-4a17-a18e-2b3a6f713745", "99245268-bd85-41b6-9134-3e9758d6dc60"]
        ]
      }[dayNumber]!,
      formats: ["multiple_choice", "fill_blank", "multiple_choice", "true_false", "fill_blank"],
      kinds: ["translation", "pattern", "pattern", "translation", "translation"],
      counts: dayNumber === 15 || dayNumber === 22
        ? [1, 2, 2]
        : [1, 1, 1, 2],
      truth: dayNumber === 15 ? "O" : "X"
    })))] as const;

    for (const contract of contracts) {
      const override = getOverride(contract.level, contract.dayNumber);
      const trueFalse = override.questions.find((candidate) => (
        candidate.question.format === "true_false"
      ));

      expect(override.questions.map(pair), `${contract.level} Day ${contract.dayNumber} pairs`)
        .toEqual(contract.pairs);
      expect(
        override.questions.map((candidate) => candidate.question.format),
        `${contract.level} Day ${contract.dayNumber} formats`
      ).toEqual(contract.formats);
      expect(
        override.questions.map((candidate) => candidate.question.kind),
        `${contract.level} Day ${contract.dayNumber} kinds`
      ).toEqual(contract.kinds);
      expect(sourceCounts(override.questions), `${contract.level} Day ${contract.dayNumber} counts`)
        .toEqual(contract.counts);
      expect(trueFalse && answer(trueFalse), `${contract.level} Day ${contract.dayNumber} truth`)
        .toBe(contract.truth);
      expect(override.questions.every(auditStandardQuestionCandidate)).toBe(true);
      expect(hasUniqueStandardLearningTargets(override.questions)).toBe(true);
    }

    const prenoviceDay10 = getOverride("prenovice", 10);
    expect(prenoviceDay10.expectedSourceHash)
      .toBe("3705307cd378538ca409dd9c0f01425fff3a9b84dc5633f7b513233798a702cf");
    expect(prenoviceDay10.questions.map(pair)).toEqual([
      ["ca7efbf4-1eac-404c-a742-2694c5bf020a", "e7281013-2d4a-470a-a139-c6a3febe83e9"],
      ["7072b68e-7172-43ca-9020-9dacf0aea8ad", "d840ceaf-33e7-4386-88f3-c6dbe71fe637"],
      ["ca7efbf4-1eac-404c-a742-2694c5bf020a", "e7281013-2d4a-470a-a139-c6a3febe83e9"],
      ["7072b68e-7172-43ca-9020-9dacf0aea8ad", "d840ceaf-33e7-4386-88f3-c6dbe71fe637"],
      ["ca7efbf4-1eac-404c-a742-2694c5bf020a", "e7281013-2d4a-470a-a139-c6a3febe83e9"]
    ]);
  });
});
