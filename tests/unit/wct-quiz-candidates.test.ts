import { describe, expect, it } from "vitest";

import {
  auditStandardQuestionCandidate,
  buildFillBlankCandidate,
  buildFillBlankCandidates,
  buildMultipleChoiceCandidate,
  buildMultipleChoiceCandidates,
  buildTrueFalseCandidate
} from "@/lib/wct/quiz/standard/candidates";
import type {
  WctStandardQuestionCandidate,
  WctStandardSourceEntry
} from "@/lib/wct/quiz/standard/types";

function modalEntry(overrides: Partial<WctStandardSourceEntry> = {}): WctStandardSourceEntry {
  return {
    patternId: "pattern-modal",
    exampleId: "example-modal",
    patternText: "can + base verb",
    patternMeaningKo: "~할 수 있다",
    usageNote: "Use can before a base verb.",
    englishText: "I can finish this today.",
    meaningKo: "나는 이것을 오늘 끝낼 수 있다.",
    ...overrides
  };
}

function indirectEntry(): WctStandardSourceEntry {
  return modalEntry({
    patternId: "pattern-indirect",
    exampleId: "example-indirect",
    patternText: "Could you tell me + where + subject + verb?",
    patternMeaningKo: "간접 질문",
    usageNote: "An indirect question uses subject before verb word order.",
    englishText: "Could you tell me where he is?",
    meaningKo: "그가 어디 있는지 말씀해 주시겠어요?"
  });
}

describe("standard WCT format candidates", () => {
  it.each([
    [
      "translation under a mismatched What did pattern",
      "What did + 주어 + 동사원형?",
      "Were you playing a game at that time?"
    ],
    [
      "translation under a mismatched What was/were pattern",
      "What was/were + 주어 + -ing?",
      "Did he buy a car?"
    ],
    [
      "translation whose verb is outside the declared -ing list",
      "enjoy/finish/avoid/keep/practice + -ing",
      "They stopped fighting."
    ],
    [
      "standalone transitive question without an object",
      "Did + 주어 + 동사원형?",
      "Did he buy?"
    ]
  ])("fails closed for %s even though translation prompts expose the source pattern", (
    _label,
    patternText,
    englishText
  ) => {
    const source = modalEntry({ patternText, englishText });

    expect(buildMultipleChoiceCandidate(source, "translation")).toBeNull();
    expect(buildFillBlankCandidate(source, "translation")).toBeNull();
    expect(buildTrueFalseCandidate(source, "O", "translation")).toBeNull();
  });

  it("builds multiple choice from the exact source and three same-family mutations", () => {
    const source = modalEntry();
    const candidate = buildMultipleChoiceCandidate(source, "translation");

    expect(candidate).not.toBeNull();
    expect(candidate!.question.format).toBe("multiple_choice");
    expect(candidate!.question.choices).toHaveLength(4);
    expect(candidate!.question.choices.map((choice) => choice.text))
      .toContain(source.englishText);
    expect(candidate!.provenance.choiceEvidence).toHaveLength(4);
    const distractors = candidate!.provenance.choiceEvidence.filter(
      (evidence) => evidence.role === "distractor"
    );
    expect(new Set(distractors.map((item) => item.mutation?.ruleFamily)).size).toBe(1);
    expect(distractors.every((item) => item.mutation?.text === item.choiceText)).toBe(true);
    expect(candidate!.question.prompt).not.toMatch(/\b(?:WCT|Day|course|Prenovice|Novice)\b/i);
    expect(auditStandardQuestionCandidate(candidate!)).toBe(true);
  });

  it("builds a four-choice one-marker blank with exact reconstruction", () => {
    const source = indirectEntry();
    const candidate = buildFillBlankCandidate(source, "pattern");

    expect(candidate).not.toBeNull();
    expect(candidate!.question.format).toBe("fill_blank");
    expect(candidate!.question.prompt.match(/____/g)).toHaveLength(1);
    expect(candidate!.question.choices).toHaveLength(4);
    const blank = candidate!.provenance.blankSpan!;
    const promptSentence = `${source.englishText.slice(0, blank.start)}____${source.englishText.slice(blank.end)}`;
    expect(candidate!.provenance.choiceEvidence).toHaveLength(4);
    expect(candidate!.question.prompt).toBe(
      `"${source.patternText}" 패턴을 사용해 "${source.meaningKo}"에 맞게 빈칸을 채우세요: ${promptSentence}`
    );
    expect(auditStandardQuestionCandidate(candidate!)).toBe(true);
  });

  it("keeps kind context and the exact source span in distinct fill prompts", () => {
    const source = indirectEntry();
    const translation = buildFillBlankCandidate(source, "translation")!;
    const pattern = buildFillBlankCandidate(source, "pattern")!;

    expect(translation.question.prompt).toContain(`"${source.meaningKo}"`);
    expect(pattern.question.prompt).toContain(`"${source.patternText}"`);
    expect(pattern.question.prompt).toContain(`"${source.meaningKo}"`);
    expect(translation.question.prompt).not.toBe(pattern.question.prompt);
    expect(translation.question.prompt).toContain("Could you tell me ____?");
    expect(auditStandardQuestionCandidate(translation)).toBe(true);
    expect(auditStandardQuestionCandidate(pattern)).toBe(true);
  });

  it("enumerates independent same-family source spans as distinct candidates", () => {
    const source = modalEntry({
      patternText: "like + 목적어 / love + 목적어",
      englishText: "I like you and love sports.",
      meaningKo: "나는 너를 좋아하고 스포츠를 아주 좋아한다."
    });

    const multipleChoice = buildMultipleChoiceCandidates(source, "pattern");
    const fillBlank = buildFillBlankCandidates(source, "pattern");

    expect(new Set(multipleChoice.map((candidate) => (
      candidate.provenance.choiceEvidence.find((evidence) => evidence.mutation)?.mutation?.start
    ))).size).toBeGreaterThan(1);
    expect(new Set(fillBlank.map((candidate) => candidate.provenance.blankSpan?.start)).size)
      .toBeGreaterThan(1);
    expect(new Set(fillBlank.map((candidate) => candidate.question.prompt)).size)
      .toBe(fillBlank.length);
  });

  it("rejects a fill candidate whose displayed prompt does not match its blank span", () => {
    const candidate = buildFillBlankCandidate(indirectEntry(), "pattern")!;
    const tampered: WctStandardQuestionCandidate = {
      ...candidate,
      question: {
        ...candidate.question,
        prompt: "Unrelated ____ sentence."
      }
    };

    expect(auditStandardQuestionCandidate(tampered)).toBe(false);
  });

  it("uses verbatim O statements and exactly one evidenced mutation for X", () => {
    const source = modalEntry();
    const correct = buildTrueFalseCandidate(source, "O", "pattern");
    const incorrect = buildTrueFalseCandidate(source, "X", "pattern");
    const translation = buildTrueFalseCandidate(source, "O", "translation");

    expect(correct?.question.format).toBe("true_false");
    expect(correct?.question.prompt).toContain(source.englishText);
    expect(correct?.question.choices.map((choice) => choice.text)).toEqual(["O", "X"]);
    expect(correct?.provenance.statementMutation).toBeUndefined();
    expect(correct?.question.prompt).toContain(`"${source.patternText}" 패턴`);
    expect(correct?.question.prompt).toContain(`"${source.meaningKo}"`);
    expect(translation?.question.prompt).toContain(`"${source.meaningKo}"`);
    expect(translation?.question.prompt).toContain("올바른 영어 문장");
    expect(translation?.question.prompt).not.toBe(correct?.question.prompt);
    expect(incorrect?.question.choices.map((choice) => choice.text)).toEqual(["O", "X"]);
    expect(incorrect?.provenance.statementMutation).toBeDefined();
    expect(incorrect?.question.prompt).toContain(incorrect!.provenance.statementMutation!.text);
    expect(incorrect?.provenance.statementMutation?.text).not.toBe(source.englishText);
    for (const candidate of [correct!, incorrect!]) {
      expect(candidate.question.explanation).not.toMatch(/approved|declared|source sentence/iu);
      expect(candidate.question.feedback.reason).not.toMatch(/approved|declared|source sentence/iu);
    }
    expect(auditStandardQuestionCandidate(correct!)).toBe(true);
    expect(auditStandardQuestionCandidate(incorrect!)).toBe(true);
  });

  it("includes the exact Korean meaning in every pattern-kind judgment criterion", () => {
    const source = modalEntry();
    const candidates = [
      buildMultipleChoiceCandidate(source, "pattern"),
      buildFillBlankCandidate(source, "pattern"),
      buildTrueFalseCandidate(source, "O", "pattern"),
      buildTrueFalseCandidate(source, "X", "pattern")
    ];

    expect(candidates.every(Boolean)).toBe(true);
    expect(candidates.every((candidate) => (
      candidate!.question.prompt.includes(`"${source.patternText}"`)
      && candidate!.question.prompt.includes(`"${source.meaningKo}"`)
    ))).toBe(true);
  });

  it("fails closed for pattern-kind questions when the source has no Korean meaning", () => {
    const source = modalEntry({ meaningKo: null });

    expect(buildMultipleChoiceCandidate(source, "pattern")).toBeNull();
    expect(buildFillBlankCandidate(source, "pattern")).toBeNull();
    expect(buildTrueFalseCandidate(source, "O", "pattern")).toBeNull();
    expect(buildTrueFalseCandidate(source, "X", "pattern")).toBeNull();
  });

  it.each([
    ["in / at / on + 장소", "I am at school.", "나는 학교에 있어요."],
    ["hear about + 명사", "I heard about the news.", "나는 그 소식을 들었어요."]
  ])("does not turn a meaning-equivalent preposition into an MC, blank, or X answer", (
    patternText,
    englishText,
    meaningKo
  ) => {
    const source = modalEntry({ patternText, englishText, meaningKo });

    expect(buildMultipleChoiceCandidate(source, "pattern")).toBeNull();
    expect(buildFillBlankCandidate(source, "pattern")).toBeNull();
    expect(buildTrueFalseCandidate(source, "X", "pattern")).toBeNull();
  });

  it("rejects ambiguous, missing, repeated, and unauditable candidates", () => {
    const equivalent = modalEntry({
      patternText: "can/could + base verb",
      usageNote: "Can or could are both permitted here."
    });
    const noAnchor = modalEntry({ patternText: "Useful sentence", usageNote: null });
    const repeated = modalEntry({ englishText: "Can I can finish this?" });

    expect(buildMultipleChoiceCandidate(equivalent, "pattern")).toBeNull();
    expect(buildMultipleChoiceCandidate(noAnchor, "pattern")).toBeNull();
    expect(buildMultipleChoiceCandidate(repeated, "pattern")).toBeNull();

    const valid = buildMultipleChoiceCandidate(modalEntry(), "pattern")!;
    const badEvidence: WctStandardQuestionCandidate = {
      ...valid,
      provenance: {
        ...valid.provenance,
        choiceEvidence: valid.provenance.choiceEvidence.slice(0, 3)
      }
    };
    const twoSpans: WctStandardQuestionCandidate = {
      ...valid,
      provenance: {
        ...valid.provenance,
        choiceEvidence: valid.provenance.choiceEvidence.map((item, index) => index === 1
          ? {
              ...item,
              mutation: item.mutation && {
                ...item.mutation,
                text: item.mutation.text.replace("today", "tomorrow")
              }
            }
          : item)
      }
    };

    expect(auditStandardQuestionCandidate(badEvidence)).toBe(false);
    expect(auditStandardQuestionCandidate(twoSpans)).toBe(false);
  });

  it("rejects learner-facing course metadata in a prompt", () => {
    const metadata = modalEntry({ patternText: "WCT Day 2: can + base verb" });

    expect(buildMultipleChoiceCandidate(metadata, "pattern")).toBeNull();
  });

  it("rejects metadata in displayed choices while allowing ordinary day vocabulary", () => {
    const metadata = modalEntry({
      englishText: "I can finish this WCT Day 2 course at Novice level."
    });
    const ordinary = modalEntry({
      englishText: "I can finish this every day."
    });

    expect(buildMultipleChoiceCandidate(metadata, "translation")).toBeNull();
    expect(buildMultipleChoiceCandidate(ordinary, "translation")).not.toBeNull();
  });
});
