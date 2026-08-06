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
        recipe: "modal_base_form",
        ruleFamily: "modal_base_form",
        changedFrom: "finish",
        changedTo: "finishes",
        reason: expect.stringContaining("can")
      })
    ]));
    expect(mutations.length).toBeGreaterThanOrEqual(3);
    for (const mutation of mutations) {
      expect(changedSegments(source.englishText, mutation.text)).toBe(1);
      expect(source.englishText.slice(mutation.start, mutation.end)).toBe(mutation.changedFrom);
      expect(mutation.reason).not.toMatch(/approved|declared|source sentence/iu);
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

  it("allows one declared replacement inside a bounded clause even when the token repeats later", () => {
    const source = entry({
      patternText: "If + present tense, 주어 + will + 동사원형",
      usageNote: "A conditional uses present tense in the if-clause.",
      englishText: "If it is ready, it is usually calm."
    });

    const mutations = enumerateSentenceMutations(source).filter((mutation) => (
      mutation.ruleFamily === "conditional_clause_tense"
    ));

    expect(mutations).toContainEqual(expect.objectContaining({
      changedFrom: "is",
      changedTo: "was",
      text: "If it was ready, it is usually calm."
    }));
  });

  it("builds source-declared lexical-anchor forms for a real Prenovice pattern", () => {
    const source = entry({
      patternText: "I/You/We/They + like + 목적어",
      usageNote: null,
      englishText: "I like you.",
      meaningKo: "나는 너를 좋아한다."
    });
    const mutations = enumerateSentenceMutations(source).filter((mutation) => (
      mutation.ruleFamily === "pattern_anchor_form"
    ));

    expect(mutations.map((mutation) => mutation.changedTo))
      .toEqual(expect.arrayContaining(["likes", "liked", "liking"]));
    expect(enumerateBlankCandidates(source)[0]?.choices.map((choice) => choice.text))
      .toEqual(expect.arrayContaining(["like", "likes", "liked", "liking"]));
  });

  it("uses subject-relevant same-family contrasts for slash-declared auxiliaries", () => {
    const source = entry({
      patternText: "Do/Does + 주어 + like ...?",
      usageNote: null,
      englishText: "Does she like sports?",
      meaningKo: "그녀는 스포츠를 좋아하나요?"
    });
    const mutations = enumerateSentenceMutations(source).filter((mutation) => (
      mutation.ruleFamily === "grammar_slot"
    ));

    expect(mutations.length).toBeGreaterThanOrEqual(3);
    expect(mutations.map((mutation) => mutation.changedTo.toLowerCase()))
      .toEqual(expect.arrayContaining(["doesn't", "don't", "didn't"]));
    expect(mutations.every((mutation) => mutation.changedFrom === "Does")).toBe(true);
    expect(mutations.every((mutation) => !["am", "is", "are", "was", "were"].includes(
      mutation.changedTo.toLowerCase()
    ))).toBe(true);
  });

  it("does not use another source-declared positive auxiliary as a distractor", () => {
    const source = entry({
      patternText: "Do/Does/Did + 주어 + 동사원형?",
      englishText: "Did you wash?"
    });
    const mutations = enumerateSentenceMutations(source).filter((mutation) => (
      mutation.ruleFamily === "grammar_slot"
    ));

    expect(mutations.map((mutation) => mutation.changedTo.toLowerCase()))
      .toEqual(expect.arrayContaining(["didn't", "don't", "doesn't"]));
    expect(mutations.every((mutation) => !["do", "does"].includes(
      mutation.changedTo.toLowerCase()
    ))).toBe(true);
  });

  it.each([
    ["do positive", "Do you study?", "Do + 주어 + 동사원형?", "긍정문", "부정형", "Do"],
    ["do negative", "She doesn't study.", "does not / doesn't + 동사원형", "부정문", "긍정형", "doesn't"],
    ["be positive", "She is tired.", "주어 + is + 형용사", "긍정문", "부정형", "is"],
    ["be negative", "She isn't tired.", "주어 + is not / isn't + 형용사", "부정문", "긍정형", "isn't"],
    ["have positive", "He has finished.", "주어 + has + p.p.", "긍정문", "부정형", "has"],
    ["have negative", "He hasn't finished.", "주어 + has not / hasn't + p.p.", "부정문", "긍정형", "hasn't"]
  ])("explains the exact polarity contrast for %s auxiliaries", (
    _label,
    englishText,
    patternText,
    polarity,
    contrast,
    sourceForm
  ) => {
    const mutations = enumerateSentenceMutations(entry({ englishText, patternText }))
      .filter((mutation) => mutation.ruleFamily === "grammar_slot");

    expect(mutations).not.toHaveLength(0);
    expect(mutations.every((mutation) => (
      mutation.reason.includes(polarity)
      && mutation.reason.includes(contrast)
      && mutation.reason.includes(`"${sourceForm}"`)
    ))).toBe(true);
    expect(mutations.every((mutation) => !mutation.reason.includes("주어와 시제"))).toBe(true);
  });

  it.each([
    ["do statement", "She does not study.", "does not / doesn't + 동사원형"],
    ["do question", "Does she not study?", "Does + 주어 + not + 동사원형?"],
    ["be statement", "She is not tired.", "주어 + is not / isn't + 형용사"],
    ["be question", "Is she not tired?", "Is + 주어 + not + 형용사?"],
    ["have statement", "He has not finished.", "주어 + has not / hasn't + p.p."],
    ["have question", "Has he not finished?", "Has + 주어 + not + p.p.?"]
  ])("fails closed for standalone-not auxiliary polarity: %s", (
    _label,
    englishText,
    patternText
  ) => {
    const mutations = enumerateSentenceMutations(entry({ englishText, patternText }))
      .filter((mutation) => mutation.ruleFamily === "grammar_slot");

    expect(mutations).toEqual([]);
  });

  it("does not use grammatical alternative modals as distractors", () => {
    const source = entry({
      patternText: "can/might/should + 동사원형",
      usageNote: null,
      englishText: "He might come.",
      meaningKo: "그가 올지도 몰라요."
    });
    const mutations = enumerateSentenceMutations(source);

    expect(mutations.filter((mutation) => mutation.ruleFamily === "modal_choice"))
      .toEqual([]);
    expect(mutations.filter((mutation) => mutation.ruleFamily === "modal_base_form")
      .map((mutation) => mutation.changedTo)).toEqual(expect.arrayContaining([
        "comes", "came", "coming"
      ]));
  });

  it("derives tense-form contrasts for a real lexical past declaration", () => {
    const source = entry({
      patternText: "주어 + 과거동사",
      usageNote: null,
      englishText: "He disappeared.",
      meaningKo: "그가 사라졌다."
    });
    const mutations = enumerateSentenceMutations(source).filter((mutation) => (
      mutation.ruleFamily === "declared_tense_form"
    ));

    expect(mutations.map((mutation) => mutation.changedTo))
      .toEqual(expect.arrayContaining(["disappear", "disappears", "disappearing"]));
  });

  it("contrasts the declared adjective suffix for a real Novice emotion pattern", () => {
    const source = entry({
      patternText: "감정 형용사 -ing",
      usageNote: null,
      englishText: "The class is boring.",
      meaningKo: "그 수업은 지루하다."
    });
    const mutations = enumerateSentenceMutations(source).filter((mutation) => (
      mutation.ruleFamily === "declared_suffix_form"
    ));

    expect(mutations.map((mutation) => mutation.changedTo))
      .toEqual(expect.arrayContaining(["bore", "bores", "bored"]));
  });

  it("creates one-span direct-question word-order errors for a Wh pattern", () => {
    const source = entry({
      patternText: "Wh- + be/조동사 + 주어 ...?",
      usageNote: null,
      englishText: "Why do you study English?",
      meaningKo: "왜 영어를 공부하나요?"
    });
    const mutations = enumerateSentenceMutations(source).filter((mutation) => (
      mutation.ruleFamily === "direct_question_order"
    ));

    expect(mutations).toHaveLength(3);
    expect(mutations).toEqual(expect.arrayContaining([
      expect.objectContaining({
        changedFrom: "do you",
        changedTo: "you do",
        text: "Why you do study English?"
      })
    ]));
  });

  it("never inflects nouns, pronouns, question words, or conditional markers as verbs", () => {
    const sources = [
      entry({ patternText: "현재형", englishText: "I go to work." }),
      entry({
        patternText: "If + 현재형, 주어 + will + 동사원형",
        englishText: "If the weather is nice, I will go."
      }),
      entry({ patternText: "Who/What + 동사 ...?", englishText: "What happened?" }),
      entry({
        patternText: "If + 과거형, 주어 + would + 동사원형",
        englishText: "If I was you, I would date him."
      })
    ];
    const changedFrom = sources.flatMap(enumerateSentenceMutations).map((mutation) => (
      mutation.changedFrom.toLowerCase()
    ));

    expect(changedFrom).not.toEqual(expect.arrayContaining([
      "work", "weather", "what", "if", "him"
    ]));
  });

  it("targets the curated short verb go for a declared present tense, never the noun work", () => {
    const mutations = enumerateSentenceMutations(entry({
      patternText: "주어 + 현재형 동사",
      usageNote: null,
      englishText: "I go to work."
    })).filter((mutation) => mutation.ruleFamily === "declared_tense_form");

    expect(mutations).toHaveLength(3);
    expect(new Set(mutations.map((mutation) => mutation.changedFrom))).toEqual(new Set(["go"]));
    expect(mutations.map((mutation) => mutation.changedTo)).toEqual(expect.arrayContaining([
      "goes", "went", "gone"
    ]));
  });

  it("does not treat the object of a preposition as a to-infinitive", () => {
    const mutations = enumerateSentenceMutations(entry({
      patternText: "can + 동사원형",
      usageNote: null,
      englishText: "I can go to work."
    }));

    expect(mutations.filter((mutation) => mutation.ruleFamily === "infinitive_form"))
      .toEqual([]);
    expect(mutations.map((mutation) => mutation.changedFrom.toLowerCase())).not.toContain("work");
  });

  it("skips a noun that resembles a verb when selecting the declared finite tense", () => {
    const mutations = enumerateSentenceMutations(entry({
      patternText: "주어 + 현재형 동사",
      usageNote: null,
      englishText: "The meeting starts now."
    })).filter((mutation) => mutation.ruleFamily === "declared_tense_form");

    expect(mutations).not.toHaveLength(0);
    expect(new Set(mutations.map((mutation) => mutation.changedFrom)))
      .toEqual(new Set(["starts"]));
  });

  it.each([
    ["Work starts now.", "starts", "work"],
    ["Running helps me.", "helps", "running"]
  ])("skips a sentence-initial noun-like subject in %s", (
    englishText,
    expectedVerb,
    forbiddenSubject
  ) => {
    const mutations = enumerateSentenceMutations(entry({
      patternText: "주어 + 현재형 동사",
      usageNote: null,
      englishText
    })).filter((mutation) => mutation.ruleFamily === "declared_tense_form");

    expect(mutations).not.toHaveLength(0);
    expect(new Set(mutations.map((mutation) => mutation.changedFrom.toLowerCase())))
      .toEqual(new Set([expectedVerb]));
    expect(mutations.map((mutation) => mutation.changedFrom.toLowerCase()))
      .not.toContain(forbiddenSubject);
  });

  it("keeps a declared If-present tense target inside the if-clause", () => {
    const mutations = enumerateSentenceMutations(entry({
      patternText: "If + 현재형, 명령문/제안",
      usageNote: null,
      englishText: "If the weather is nice tomorrow, let's go on a trip."
    })).filter((mutation) => mutation.ruleFamily === "declared_tense_form");

    expect(mutations).not.toHaveLength(0);
    expect(new Set(mutations.map((mutation) => mutation.changedFrom.toLowerCase())))
      .toEqual(new Set(["is"]));
    expect(mutations.map((mutation) => mutation.changedFrom.toLowerCase())).not.toContain("go");
  });

  it("targets the bounded base verb in a declared Do-question tense", () => {
    const mutations = enumerateSentenceMutations(entry({
      patternText: "현재형",
      usageNote: null,
      englishText: "Do you study English these days?"
    })).filter((mutation) => mutation.ruleFamily === "declared_tense_form");

    expect(mutations).not.toHaveLength(0);
    expect(new Set(mutations.map((mutation) => mutation.changedFrom.toLowerCase())))
      .toEqual(new Set(["study"]));
    expect(new Set(mutations.map((mutation) => mutation.reason)))
      .toEqual(new Set(['조동사 "Do" 뒤에는 동사원형 "study"를 씁니다.']));
  });

  it("skips an -ing noun and targets the declared adjective suffix", () => {
    const mutations = enumerateSentenceMutations(entry({
      patternText: "감정 형용사 -ing",
      usageNote: null,
      englishText: "The meeting is boring."
    })).filter((mutation) => mutation.ruleFamily === "declared_suffix_form");

    expect(mutations).not.toHaveLength(0);
    expect(new Set(mutations.map((mutation) => mutation.changedFrom)))
      .toEqual(new Set(["boring"]));
  });

  it("skips a multiword-subject noun before a declared adjective suffix", () => {
    const mutations = enumerateSentenceMutations(entry({
      patternText: "감정 형용사 -ing",
      usageNote: null,
      englishText: "My morning meeting is boring."
    })).filter((mutation) => mutation.ruleFamily === "declared_suffix_form");

    expect(mutations).not.toHaveLength(0);
    expect(new Set(mutations.map((mutation) => mutation.changedFrom)))
      .toEqual(new Set(["boring"]));
  });

  it("uses a neutral Korean reason for a subject Wh- construction", () => {
    const mutations = enumerateSentenceMutations(entry({
      patternText: "Who/What + 동사 ...?",
      usageNote: null,
      englishText: "Who fought?"
    })).filter((mutation) => mutation.ruleFamily === "subject_wh_verb");

    expect(mutations).not.toHaveLength(0);
    expect(mutations.every((mutation) => !mutation.reason.includes("Who/What이"))).toBe(true);
    expect(mutations.every((mutation) => mutation.reason.includes("의문사가 문장의 주어")))
      .toBe(true);
  });

  it("does not treat the spatial adjective left as the verb leave", () => {
    const mutations = enumerateSentenceMutations(entry({
      patternText: "on the left side of / on the right side of",
      usageNote: null,
      englishText: "The chair is on the left side of the table."
    }));

    expect(mutations.filter((mutation) => mutation.changedFrom.toLowerCase() === "left"))
      .toEqual([]);
  });

  it("explains have/has plus p.p. as present perfect, not passive voice", () => {
    const mutations = enumerateSentenceMutations(entry({
      patternText: "have/has + p.p.",
      usageNote: null,
      englishText: "He has lived here for three years."
    })).filter((mutation) => mutation.changedFrom === "lived");

    expect(mutations).not.toHaveLength(0);
    expect(mutations.every((mutation) => mutation.reason.includes("현재완료"))).toBe(true);
    expect(mutations.every((mutation) => mutation.reason.includes("have/has"))).toBe(true);
    expect(mutations.every((mutation) => !mutation.reason.includes("수동태"))).toBe(true);
  });

  it("uses natural Korean feedback without attaching particles to quoted English tokens", () => {
    const sources = [
      entry({ patternText: "can + 동사원형", englishText: "I can learn English." }),
      entry({ patternText: "감정 형용사 -ing", englishText: "The meeting is boring." }),
      entry({ patternText: "주어 + 현재형 동사", englishText: "I go to work." })
    ];
    const reasons = sources.flatMap(enumerateSentenceMutations).map((mutation) => mutation.reason);

    expect(reasons).not.toHaveLength(0);
    expect(reasons.every((reason) => !/"[A-Za-z][^"]*"(?:가|를|을|은|는|이)/u.test(reason)))
      .toBe(true);
    expect(reasons.find((reason) => reason.includes("learn"))).toContain("조동사");
    expect(reasons.find((reason) => reason.includes("learn"))).toContain("동사원형");
  });

  it("does not invent difficulter or interestinger comparison forms", () => {
    const mutations = [
      ...enumerateSentenceMutations(entry({
        patternText: "more + 형용사 + than",
        englishText: "This is more difficult than that."
      })),
      ...enumerateSentenceMutations(entry({
        patternText: "the most + 형용사",
        englishText: "This is the most interesting book."
      }))
    ];

    expect(mutations.map((mutation) => mutation.changedTo))
      .not.toEqual(expect.arrayContaining(["difficulter", "interestinger"]));
  });

  it("uses attested verb forms and keeps grammar-slot replacements in one auxiliary family", () => {
    const going = entry({
      patternText: "be + -ing",
      englishText: "I am going home."
    });
    const auxiliary = entry({
      patternText: "주어 + am/is/are + 동사-ing",
      englishText: "He is singing."
    });
    const all = [...enumerateSentenceMutations(going), ...enumerateSentenceMutations(auxiliary)];

    expect(all.map((mutation) => mutation.changedTo)).not.toEqual(expect.arrayContaining([
      "gos", "goed", "singed"
    ]));
    expect(all.filter((mutation) => mutation.ruleFamily === "grammar_slot")
      .every((mutation) => [
        "am", "is", "are", "was", "were", "isn't", "aren't", "wasn't", "weren't"
      ].includes(
        mutation.changedTo.toLowerCase()
      ))).toBe(true);
  });

  it.each([
    ["do", "Do you study?", "Do/Does + 주어 + 동사원형?", ["do", "does", "did", "don't", "doesn't", "didn't"]],
    ["be", "She isn't tired.", "주어 + am/is/are not ...", ["am", "is", "are", "was", "were", "isn't", "aren't", "wasn't", "weren't"]],
    ["have", "He hasn't finished.", "have/has + p.p.", ["have", "has", "had", "haven't", "hasn't", "hadn't"]]
  ] as const)("keeps every %s auxiliary distractor inside its family", (
    _label,
    englishText,
    patternText,
    family
  ) => {
    const mutations = enumerateSentenceMutations(entry({ englishText, patternText }))
      .filter((mutation) => mutation.ruleFamily === "grammar_slot");

    expect(mutations).not.toHaveLength(0);
    expect(mutations.every((mutation) => family.includes(
      mutation.changedTo.toLowerCase() as never
    ))).toBe(true);
  });

  it("keeps modal questions capitalized while mutating only the base verb", () => {
    const source = entry({
      patternText: "Can I + 동사원형?",
      englishText: "Can I use your pen?"
    });
    const modal = enumerateSentenceMutations(source).filter((mutation) => (
      mutation.ruleFamily === "modal_base_form"
    ));

    expect(modal).not.toHaveLength(0);
    expect(modal.every((mutation) => /^[A-Z]/u.test(mutation.text))).toBe(true);
    expect(modal.every((mutation) => mutation.changedFrom === "use")).toBe(true);
  });

  it.each([
    "Can the meeting start?",
    "Can your work wait?",
    "Can the morning meeting start?",
    "Can my work meeting start?"
  ])("fails closed for an unbounded modal-question noun phrase in %s", (englishText) => {
    const mutations = enumerateSentenceMutations(entry({
      patternText: "Can + 주어 + 동사원형?",
      usageNote: null,
      englishText
    })).filter((mutation) => mutation.ruleFamily === "modal_base_form");

    expect(mutations).toEqual([]);
  });

  it.each([
    ["Can they start?", "start"],
    ["Can children wait?", "wait"]
  ])("targets a provable modal-question predicate in %s", (englishText, expectedVerb) => {
    const mutations = enumerateSentenceMutations(entry({
      patternText: "Can + 주어 + 동사원형?",
      usageNote: null,
      englishText
    })).filter((mutation) => mutation.ruleFamily === "modal_base_form");

    expect(mutations).not.toHaveLength(0);
    expect(new Set(mutations.map((mutation) => mutation.changedFrom.toLowerCase())))
      .toEqual(new Set([expectedVerb]));
  });

  it("does not scan past an uncurated modal predicate into an object noun", () => {
    const mutations = enumerateSentenceMutations(entry({
      patternText: "Can + 주어 + 동사원형?",
      usageNote: null,
      englishText: "Can you manage work?"
    })).filter((mutation) => mutation.ruleFamily === "modal_base_form");

    expect(mutations).toEqual([]);
  });

  it.each([
    ["prepare", ["prepares", "prepared", "preparing"]],
    ["visit", ["visits", "visited", "visiting"]],
    ["clean", ["cleans", "cleaned", "cleaning"]],
    ["catch", ["catches", "caught", "catching"]],
    ["plan", ["plans", "planned", "planning"]],
    ["ask", ["asks", "asked", "asking"]],
    ["water", ["waters", "watered", "watering"]],
    ["book", ["books", "booked", "booking"]],
    ["order", ["orders", "ordered", "ordering"]],
    ["exercise", ["exercises", "exercised", "exercising"]],
    ["pack", ["packs", "packed", "packing"]],
    ["check", ["checks", "checked", "checking"]],
    ["stay", ["stays", "stayed", "staying"]],
    ["miss", ["misses", "missed", "missing"]],
    ["leave", ["leaves", "left", "leaving"]],
    ["start", ["starts", "started", "starting"]]
  ])("uses an attested paradigm for seeded modal verb %s", (verb, expected) => {
    const mutations = enumerateSentenceMutations(entry({
      patternText: "can + base verb",
      englishText: `I can ${verb} today.`
    })).filter((mutation) => mutation.ruleFamily === "modal_base_form");

    expect(mutations.map((mutation) => mutation.changedTo)).toEqual(expected);
  });

  it("does not create ambiguous see/hear object-complement variants", () => {
    const source = entry({
      patternText: "see/hear + 목적어 + -ing",
      englishText: "I heard you snoring."
    });

    expect(enumerateSentenceMutations(source).filter((mutation) => (
      mutation.changedFrom.toLowerCase() === "snoring"
    ))).toEqual([]);
  });

  it.each([
    ["subject Wh verb", entry({
      patternText: "Who/What + 동사 ...?",
      englishText: "Who fought?"
    }), "subject_wh_verb", ["fight", "fighting", "did fought"]],
    ["extended Wh phrase", entry({
      patternText: "how many / how long / how far / how tall",
      englishText: "How many bottles can you drink?"
    }), "wh_phrase", ["How much", "Which", "How many of"]],
    ["comparison", entry({
      patternText: "형용사-er / more + 형용사 + than",
      englishText: "I am better than you."
    }), "comparison", ["good", "best", "more better"]],
    ["preposition", entry({
      patternText: "be addicted to + 명사",
      englishText: "I am addicted to coffee."
    }), "preposition_collocation", ["for", "with", "by"]],
    ["passive participle", entry({
      patternText: "be + p.p. (+ by 행위자)",
      englishText: "The chair was moved."
    }), "passive_participle", ["move", "moves", "moving"]],
    ["infinitive verb", entry({
      patternText: "동사 + to + 동사원형",
      englishText: "Do you want to drink coffee?"
    }), "infinitive_form", ["drinks", "drank", "drinking"]]
  ] as const)("builds three bounded, family-specific %s distractors", (
    _label,
    source,
    family,
    expected
  ) => {
    const mutations = enumerateSentenceMutations(source).filter((mutation) => (
      mutation.ruleFamily === family
    ));

    expect(mutations.map((mutation) => mutation.changedTo))
      .toEqual(expect.arrayContaining([...expected]));
    expect(new Set(mutations.map((mutation) => (
      `${mutation.start}:${mutation.end}:${mutation.changedFrom}`
    ))).size).toBe(1);
  });

  it("never offers another grammatical direct subject-Wh form for a past source", () => {
    const mutations = enumerateSentenceMutations(entry({
      patternText: "Who/What + 동사 ...?",
      englishText: "Who fought?"
    })).filter((mutation) => mutation.ruleFamily === "subject_wh_verb");

    expect(mutations.map((mutation) => mutation.text)).toEqual(expect.arrayContaining([
      "Who fight?", "Who fighting?", "Who did fought?"
    ]));
    expect(mutations.map((mutation) => mutation.text)).not.toContain("Who fights?");
  });

  it.each([
    ["Whose", "Whose bag is this?", ["Which"]],
    ["How many", "How many bottles can you drink?", ["How long", "How far", "How tall"]],
    ["How long", "How long can you wait?", ["How many", "How far", "How tall"]],
    ["How far", "How far can you walk?", ["How many", "How long", "How tall"]],
    ["How tall", "How tall are you?", ["How many", "How long", "How far"]]
  ])("does not use a declared-valid %s phrase as a pattern distractor", (
    patternText,
    englishText,
    forbidden
  ) => {
    const mutations = enumerateSentenceMutations(entry({
      patternText: "Whose / How many / How long / How far / How tall",
      usageNote: `${patternText} is valid for its matching question.`,
      englishText
    })).filter((mutation) => mutation.ruleFamily === "wh_phrase");

    expect(mutations).toHaveLength(3);
    expect(mutations.map((mutation) => mutation.changedTo))
      .not.toEqual(expect.arrayContaining(forbidden));
  });

  it("uses credible Wh-phrase contrasts instead of word-salad token orders", () => {
    const sources = [
      entry({
        patternText: "what kind of / which / whose + 명사",
        englishText: "What kind of movie do you like?"
      }),
      entry({
        patternText: "how many / how long / how far / how tall",
        englishText: "How many bottles can you drink?"
      })
    ];
    const mutations = sources.flatMap(enumerateSentenceMutations).filter((mutation) => (
      mutation.ruleFamily === "wh_phrase"
    ));

    expect(mutations).toHaveLength(6);
    expect(mutations.map((mutation) => mutation.changedTo)).not.toEqual(expect.arrayContaining([
      "What of kind", "How much many", "How many much", "What many"
    ]));
  });

  it.each([
    ["What kind of movie do you like?", ["Which kind of"]],
    ["How many bottles can you drink?", ["What number of"]],
    ["How long can you wait?", ["How much time", "Since when"]],
    ["How far can you walk?", ["How many miles", "What distance"]]
  ])("does not offer a meaning-equivalent Wh answer for %s", (englishText, equivalents) => {
    const mutations = enumerateSentenceMutations(entry({
      patternText: "what kind of / which / whose / how many / how long / how far / how tall",
      englishText
    })).filter((mutation) => mutation.ruleFamily === "wh_phrase");

    expect(mutations).toHaveLength(3);
    expect(mutations.map((mutation) => mutation.changedTo))
      .not.toEqual(expect.arrayContaining(equivalents));
  });

  it.each([
    ["declared place alternatives", "in / at / on + 장소", "I am at school."],
    ["meaning-overlapping hear expressions", "hear about + 명사", "I heard about the news."]
  ])("fails closed for ambiguous prepositions: %s", (_label, patternText, englishText) => {
    expect(enumerateSentenceMutations(entry({ patternText, englishText })).filter((mutation) => (
      mutation.ruleFamily === "preposition_collocation"
    ))).toEqual([]);
  });
});
