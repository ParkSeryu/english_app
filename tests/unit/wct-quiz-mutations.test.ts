import { describe, expect, it } from "vitest";

import {
  enumerateBlankCandidates,
  enumerateSentenceMutations
} from "@/lib/wct/quiz/standard/mutations";
import type { WctStandardSourceEntry } from "@/lib/wct/quiz/standard/types";

function entry(overrides: Partial<WctStandardSourceEntry>): WctStandardSourceEntry {
  return {
    patternId: "pattern-1",
    exampleId: "example-1",
    patternText: "can + base verb",
    patternMeaningKo: "~할 수 있다",
    usageNote: "Use can before a base verb.",
    englishText: "I can finish this today.",
    meaningKo: "나는 이것을 오늘 끝낼 수 있다.",
    ...overrides
  };
}

function changedSegments(source: string, target: string) {
  const left = source.split(/(\s+)/);
  const right = target.split(/(\s+)/);
  let segments = 0;
  let changing = false;
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const differs = left[index] !== right[index];
    if (differs && !changing) segments += 1;
    changing = differs;
  }
  return segments;
}

describe("controlled WCT sentence mutations", () => {
  it("enumerates finite token-aware modal mutations with one evidenced span", () => {
    const source = entry({});
    const mutations = enumerateSentenceMutations(source);

    expect(mutations).toEqual(expect.arrayContaining([
      expect.objectContaining({
        recipe: "modal_choice",
        ruleFamily: "modal_choice",
        changedFrom: "can",
        changedTo: "could",
        reason: expect.stringContaining("can")
      })
    ]));
    expect(mutations.length).toBeGreaterThanOrEqual(3);
    for (const mutation of mutations) {
      expect(changedSegments(source.englishText, mutation.text)).toBe(1);
      expect(source.englishText.slice(mutation.start, mutation.end)).toBe(mutation.changedFrom);
    }
  });

  it.each([
    ["agreement", entry({
      patternText: "Subject-verb agreement: she does",
      usageNote: "Use does with she.",
      englishText: "She does the work."
    }), "agreement"],
    ["tense", entry({
      patternText: "Future tense: will + verb",
      usageNote: "Use will for the future tense.",
      englishText: "I will call tomorrow."
    }), "tense"],
    ["conditional", entry({
      patternText: "If + present, will + verb",
      usageNote: "In this conditional, use present tense in the if-clause.",
      englishText: "If she is late, I will call."
    }), "conditional_clause_tense"],
    ["indirect question", entry({
      patternText: "Could you tell me + where + subject + verb?",
      usageNote: "An indirect question uses subject before verb word order.",
      englishText: "Could you tell me where he is?"
    }), "indirect_question_order"]
  ])("requires an explicit anchored %s declaration", (_name, source, family) => {
    expect(enumerateSentenceMutations(source).some(
      (mutation) => mutation.ruleFamily === family
    )).toBe(true);
  });

  it("removes exactly one declared required modal as a modal-presence mutation", () => {
    const source = entry({
      patternText: "modal + base verb",
      usageNote: "A modal is required before the base verb."
    });

    expect(enumerateSentenceMutations(source)).toContainEqual(expect.objectContaining({
      recipe: "modal_presence",
      ruleFamily: "modal_presence",
      changedFrom: "can ",
      changedTo: "",
      text: "I finish this today."
    }));
  });

  it("builds one-marker indirect-question blanks that reconstruct exactly", () => {
    const source = entry({
      patternText: "Could you tell me + where + subject + verb?",
      usageNote: "An indirect question uses subject before verb word order.",
      englishText: "Could you tell me where he is?"
    });
    const blank = enumerateBlankCandidates(source)[0];

    expect(blank.promptSentence.match(/____/g)).toHaveLength(1);
    expect(blank.reconstruct(blank.correctText)).toBe(source.englishText);
    expect(blank.choices).toHaveLength(4);
    expect(new Set(blank.choices.map((choice) => choice.category)))
      .toEqual(new Set([blank.choices[0].category]));
    expect(blank.choices.filter((choice) => choice.role === "distractor")
      .every((choice) => choice.mutation?.text === blank.reconstruct(choice.text)))
      .toBe(true);
  });

  it("returns no mutation for missing, repeated, or explicitly equivalent anchors", () => {
    const noDeclaration = entry({ patternText: "Useful sentence", usageNote: null });
    const repeated = entry({ englishText: "Can I can finish this?" });
    const equivalent = entry({
      patternText: "can/could + base verb",
      usageNote: "Can or could are both permitted here."
    });

    expect(enumerateSentenceMutations(noDeclaration)).toEqual([]);
    expect(enumerateSentenceMutations(repeated)).toEqual([]);
    expect(enumerateSentenceMutations(equivalent)).toEqual([]);
    expect(enumerateBlankCandidates(repeated)).toEqual([]);
  });
});
