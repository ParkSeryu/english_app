import { describe, expect, it } from "vitest";

import {
  auditStandardQuestionCandidate,
  buildFillBlankCandidate,
  buildMultipleChoiceCandidate,
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
    expect(candidate!.provenance.blankSpan).toBeDefined();
    expect(candidate!.provenance.choiceEvidence).toHaveLength(4);
    expect(auditStandardQuestionCandidate(candidate!)).toBe(true);
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

    expect(correct?.question.format).toBe("true_false");
    expect(correct?.question.prompt).toContain(source.englishText);
    expect(correct?.question.choices.map((choice) => choice.text)).toEqual(["O", "X"]);
    expect(correct?.provenance.statementMutation).toBeUndefined();
    expect(incorrect?.question.choices.map((choice) => choice.text)).toEqual(["O", "X"]);
    expect(incorrect?.provenance.statementMutation).toBeDefined();
    expect(incorrect?.question.prompt).toContain(incorrect!.provenance.statementMutation!.text);
    expect(incorrect?.provenance.statementMutation?.text).not.toBe(source.englishText);
    expect(auditStandardQuestionCandidate(correct!)).toBe(true);
    expect(auditStandardQuestionCandidate(incorrect!)).toBe(true);
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
