import { createHash } from "node:crypto";

import {
  normalizeWctIdentity,
  stableStringify
} from "../../normalization.ts";
import type { WctQuizQuestion } from "../types.ts";
import { wctStandardQuizSetCreateSchema } from "../validation.ts";
import type {
  WctGeneratedStandardQuizBook,
  WctMutationEvidence,
  WctQuestionProvenance,
  WctStandardLevel,
  WctStandardQuestionCandidate,
  WctStandardQuizSource
} from "./types.ts";

const forbiddenLearnerText = /\bwct\b|\bday\s*#?\s*\d+\b|\bcourse\b|\b(?:pre\s*novice|prenovice|novice|premium)\b/iu;
const brokenText = /\uFFFD|\?{3,}/u;

export type WctStandardAuditFailure = {
  level: WctStandardLevel;
  dayNumber: number;
  questionId: string;
  rule: string;
  reason: string;
};

export type WctStandardAuditRow = {
  level: WctStandardLevel;
  dayNumber: number;
  topic: string;
  questionId: string;
  slotIndex: number;
  kind: string;
  format: string;
  prompt: string;
  choices: Array<{ id: string; text: string }>;
  correctAnswer: string;
  patternId: string;
  exampleId: string;
  sourceSentence: string;
  pattern: string;
  mutationEvidence: WctMutationEvidence[];
  blankEvidence: WctQuestionProvenance["blankSpan"] | null;
  reason: string;
  question: WctQuizQuestion;
  feedback: WctQuizQuestion["feedback"] | null;
  provenance: WctQuestionProvenance | null;
  sourceReference: {
    lessonKey: string;
    sourceId: string;
    sourceHash: string;
    patternId: string;
    exampleId: string;
    sourceSentence: string;
    patternText: string;
  };
};

type SourceInventoryRow = {
  level: WctStandardLevel;
  dayNumber: number;
  lessonKey: string;
  sourceId: string;
  sourceHash: string;
  topic: string;
  patternId: string;
  exampleId: string;
  patternText: string;
  patternMeaningKo: string | null;
  usageNote: string | null;
  englishText: string;
  meaningKo: string | null;
};

function sha256(value: unknown) {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function levelOrder(level: WctStandardLevel) {
  return level === "prenovice" ? 0 : 1;
}

function exactMutation(source: string, mutation: WctMutationEvidence) {
  return mutation.start >= 0
    && mutation.end > mutation.start
    && source.slice(mutation.start, mutation.end) === mutation.changedFrom
    && mutation.text
      === `${source.slice(0, mutation.start)}${mutation.changedTo}${source.slice(mutation.end)}`
    && normalizeWctIdentity(mutation.text) !== normalizeWctIdentity(source)
    && Boolean(mutation.recipe.trim())
    && Boolean(mutation.ruleFamily.trim())
    && Boolean(mutation.reason.trim());
}

function correctChoice(question: WctQuizQuestion) {
  return question.choices.find((choice) => choice.id === question.correctChoiceId);
}

function formatCounts(questions: readonly WctQuizQuestion[]) {
  return {
    multiple_choice: questions.filter((question) => question.format === "multiple_choice").length,
    fill_blank: questions.filter((question) => question.format === "fill_blank").length,
    true_false: questions.filter((question) => question.format === "true_false").length
  };
}

function kindCounts(questions: readonly WctQuizQuestion[]) {
  return {
    translation: questions.filter((question) => question.kind === "translation").length,
    pattern: questions.filter((question) => question.kind === "pattern").length
  };
}

function canonicalSourceInventory(
  books: readonly WctGeneratedStandardQuizBook[]
): SourceInventoryRow[] {
  return books.flatMap((book) => book.sets.flatMap((set) => (
    set.source.entries.map((entry) => ({
      level: set.source.level,
      dayNumber: set.source.dayNumber,
      lessonKey: set.source.lessonKey,
      sourceId: set.source.sourceId,
      sourceHash: set.source.sourceHash,
      topic: set.source.topic,
      patternId: entry.patternId,
      exampleId: entry.exampleId,
      patternText: entry.patternText,
      patternMeaningKo: entry.patternMeaningKo,
      usageNote: entry.usageNote,
      englishText: entry.englishText,
      meaningKo: entry.meaningKo
    }))
  ))).sort((left, right) => (
    levelOrder(left.level) - levelOrder(right.level)
      || left.dayNumber - right.dayNumber
      || left.patternId.localeCompare(right.patternId)
      || left.exampleId.localeCompare(right.exampleId)
      || stableStringify(left).localeCompare(stableStringify(right))
  ));
}

function findSourceEntry(
  source: WctStandardQuizSource,
  provenance: WctQuestionProvenance
) {
  return source.entries.find((entry) => (
    entry.patternId === provenance.patternId
    && entry.exampleId === provenance.exampleId
  ));
}

function mutationEvidence(provenance: WctQuestionProvenance) {
  return [
    ...(provenance.statementMutation ? [provenance.statementMutation] : []),
    ...provenance.choiceEvidence.flatMap((evidence) => (
      evidence.mutation ? [evidence.mutation] : []
    ))
  ];
}

function canonicalSourceHash(source: WctStandardQuizSource) {
  return sha256({
    lessonKey: source.lessonKey,
    sourceId: source.sourceId,
    level: source.level,
    dayNumber: source.dayNumber,
    topic: source.topic,
    entries: source.entries.map((entry) => ({
      patternId: entry.patternId,
      exampleId: entry.exampleId,
      patternText: entry.patternText,
      patternMeaningKo: entry.patternMeaningKo,
      usageNote: entry.usageNote,
      englishText: entry.englishText,
      meaningKo: entry.meaningKo
    }))
  });
}

function auditQuestion(
  source: WctStandardQuizSource,
  question: WctQuizQuestion,
  candidate: WctStandardQuestionCandidate | undefined,
  fail: (rule: string, reason: string) => void
) {
  const displayedValues = [
    question.prompt,
    question.explanation,
    question.feedback?.correctSentence ?? "",
    question.feedback?.pattern ?? "",
    question.feedback?.reason ?? "",
    ...question.choices.map((choice) => choice.text)
  ];
  if ([question.prompt, ...question.choices.map((choice) => choice.text)]
    .some((text) => forbiddenLearnerText.test(text))) {
    fail("forbidden_text", "Displayed learner text exposes course or Day metadata.");
  }
  if (displayedValues.some((text) => brokenText.test(text))) {
    fail("korean_text_integrity", "Displayed text contains replacement output.");
  }
  const expectedChoiceCount = question.format === "true_false" ? 2 : 4;
  if (question.choices.length !== expectedChoiceCount) {
    fail("choice_count", `The ${question.format ?? "missing"} format has the wrong choice count.`);
  }
  if (new Set(question.choices.map((choice) => choice.id)).size !== question.choices.length
    || !correctChoice(question)) {
    fail("choice_identity", "Choice IDs collide or the correct choice ID is missing.");
  }
  if (new Set(question.choices.map((choice) => normalizeWctIdentity(choice.text))).size
    !== question.choices.length) {
    fail("normalized_choice_uniqueness", "Displayed choices are not normalization-distinct.");
  }
  if (!question.feedback
    || !question.feedback.correctSentence.trim()
    || !question.feedback.pattern.trim()
    || !question.feedback.reason.trim()
    || !question.explanation.trim()) {
    fail("feedback_completeness", "Explanation and structured feedback must be complete.");
  }
  if (!candidate) {
    fail("provenance_presence", "The displayed question has no matching provenance record.");
    return;
  }
  const provenance = candidate.provenance;
  const entry = findSourceEntry(source, provenance);
  if (!entry || provenance.sourceSentence !== entry.englishText) {
    fail("source_membership", "Question provenance is not an exact member of the target-Day source.");
    return;
  }
  if (question.kind === "translation" && entry.meaningKo === null) {
    fail("source_membership", "A translation question has no target-source Korean meaning.");
  }
  if (!question.feedback
    || question.feedback.correctSentence !== entry.englishText
    || question.feedback.pattern !== entry.patternText) {
    fail("feedback_source_match", "Displayed feedback does not exactly match target source.");
  }
  if (provenance.choiceEvidence.length !== question.choices.length
    || provenance.choiceEvidence.some((evidence, index) => (
      evidence.choiceText !== question.choices[index]?.text
    ))) {
    fail("choice_evidence", "Displayed choices and source evidence do not align by position.");
  }
  const declaredCorrect = provenance.choiceEvidence.filter((evidence) => (
    evidence.role === "correct"
  ));
  if (declaredCorrect.length !== 1) {
    fail(
      "source_declared_answer_uniqueness",
      "Source evidence must declare exactly one displayed answer correct."
    );
  }
  const answer = correctChoice(question)?.text;
  const displayedCorrectCount = provenance.choiceEvidence.filter((evidence, index) => (
    evidence.role === "correct" && question.choices[index]?.id === question.correctChoiceId
  )).length;
  if (displayedCorrectCount !== 1) {
    fail(
      "source_declared_answer_uniqueness",
      "The displayed correct choice and source-declared answer do not identify one answer."
    );
  }

  if (question.format === "multiple_choice") {
    const expectedPrompt = question.kind === "translation"
      ? entry.meaningKo === null
        ? null
        : `"${entry.meaningKo}"에 맞는 영어 문장을 고르세요.`
      : `"${entry.patternText}" 패턴에 맞는 영어 문장을 고르세요.`;
    if (question.prompt !== expectedPrompt) {
      fail("prompt_provenance", "MC prompt is not the exact target-source prompt.");
    }
    if (answer !== entry.englishText) {
      fail("source_declared_answer_uniqueness", "The correct answer is not the source sentence.");
    }
    for (const [index, evidence] of provenance.choiceEvidence.entries()) {
      if (evidence.role !== "distractor") continue;
      if (!evidence.mutation
        || !exactMutation(entry.englishText, evidence.mutation)
        || evidence.mutation.text !== question.choices[index]?.text) {
        fail("mutation_evidence", "A displayed distractor lacks one-span source mutation evidence.");
      }
    }
  } else if (question.format === "fill_blank") {
    const markers = question.prompt.match(/____/gu) ?? [];
    if (markers.length !== 1
      || !answer
      || question.prompt.replace("____", answer) !== entry.englishText) {
      fail("blank_reconstruction", "The displayed blank and correct answer do not reconstruct source.");
    }
    const blank = provenance.blankSpan;
    if (!blank
      || entry.englishText.slice(blank.start, blank.end) !== blank.correctText
      || blank.correctText !== answer
      || question.prompt !== `${entry.englishText.slice(0, blank.start)}____${entry.englishText.slice(blank.end)}`) {
      fail("blank_evidence", "The blank span is not an exact target-source span.");
    }
    if (!blank
      || question.prompt
        !== `${entry.englishText.slice(0, blank.start)}____${entry.englishText.slice(blank.end)}`) {
      fail("prompt_provenance", "Blank prompt is not the exact evidenced source replacement.");
    }
    for (const [index, evidence] of provenance.choiceEvidence.entries()) {
      if (evidence.role !== "distractor") continue;
      if (!evidence.mutation
        || !exactMutation(entry.englishText, evidence.mutation)
        || evidence.mutation.start !== blank?.start
        || evidence.mutation.end !== blank?.end
        || evidence.mutation.changedTo !== question.choices[index]?.text) {
        fail("mutation_evidence", "A blank distractor lacks exact same-span mutation evidence.");
      }
    }
  } else if (question.format === "true_false") {
    if (question.choices.map((choice) => choice.text).join("\0") !== "O\0X"
      || (answer !== "O" && answer !== "X")) {
      fail("true_false_choices", "O/X must display exactly O then X with one correct state.");
    }
    if (answer === "O") {
      const expectedPrompt = `"${entry.englishText}" 이 문장이 패턴에 맞으면 O, 아니면 X를 고르세요.`;
      if (provenance.statementMutation || question.prompt !== expectedPrompt) {
        fail("true_false_statement", "An O statement must display the verbatim source sentence.");
      }
      if (question.prompt !== expectedPrompt) {
        fail("prompt_provenance", "O prompt is not the exact verbatim-source prompt.");
      }
    } else if (!provenance.statementMutation
      || !exactMutation(entry.englishText, provenance.statementMutation)
      || question.prompt
        !== `"${provenance.statementMutation.text}" 이 문장이 패턴에 맞으면 O, 아니면 X를 고르세요.`) {
      fail("mutation_evidence", "An X statement lacks one-span source mutation evidence.");
      fail("prompt_provenance", "X prompt is not the exact evidenced-mutation prompt.");
    }
  }
}

export function auditStandardWctQuizInventory(
  generated: readonly WctGeneratedStandardQuizBook[]
) {
  const failures: WctStandardAuditFailure[] = [];
  const failureKeys = new Set<string>();
  const rows: WctStandardAuditRow[] = [];
  const orderedBooks = [...generated].sort((left, right) => (
    levelOrder(left.level) - levelOrder(right.level)
      || left.bookId.localeCompare(right.bookId)
      || stableStringify(left).localeCompare(stableStringify(right))
  ));
  const seenLevels = new Set<WctStandardLevel>();
  for (const book of orderedBooks) {
    const firstBookRow = rows.length;
    const expectedDayCount = book.level === "prenovice" ? 16 : 28;
    if (seenLevels.has(book.level)) {
      failures.push({
        level: book.level,
        dayNumber: 0,
        questionId: "inventory",
        rule: "book_inventory",
        reason: `Inventory contains more than one ${book.level} book.`
      });
    }
    seenLevels.add(book.level);
    const sets = [...book.sets].sort((left, right) => (
      left.source.dayNumber - right.source.dayNumber
        || stableStringify(left).localeCompare(stableStringify(right))
    ));
    const actualDays = sets.map((set) => set.source.dayNumber);
    if (sets.length !== expectedDayCount
      || actualDays.some((dayNumber, index) => dayNumber !== index + 1)) {
      failures.push({
        level: book.level,
        dayNumber: 0,
        questionId: "inventory",
        rule: "day_inventory",
        reason: `${book.level} must contain exactly Days 1-${expectedDayCount}.`
      });
    }
    for (const set of sets) {
      const { source, draft } = set;
      const setQuestionId = draft.questions[0]?.id ?? "set";
      const addFailure = (questionId: string, rule: string, reason: string) => {
        const key = `${source.level}:${source.dayNumber}:${questionId}:${rule}`;
        if (failureKeys.has(key)) return;
        failureKeys.add(key);
        failures.push({
          level: source.level,
          dayNumber: source.dayNumber,
          questionId,
          rule,
          reason
        });
      };
      if (source.level !== book.level
        || draft.lessonKey !== source.lessonKey
        || draft.sourceId !== source.sourceId
        || draft.sourceHash !== source.sourceHash
        || draft.sourceKind !== "wct_day"
        || draft.generatorVersion !== "wct-review-v2") {
        addFailure(setQuestionId, "set_source_identity", "Quiz-set identity does not match source.");
      }
      if (canonicalSourceHash(source) !== source.sourceHash) {
        addFailure(setQuestionId, "source_hash", "Stored source hash is not canonical source content.");
      }
      const sourceIdentities = source.entries.map((entry) => (
        `${entry.patternId}\0${entry.exampleId}`
      ));
      if (new Set(sourceIdentities).size !== sourceIdentities.length) {
        addFailure(
          setQuestionId,
          "source_identity_uniqueness",
          "Target source contains duplicate pattern/example identities."
        );
      }
      if ([source.topic, ...source.entries.flatMap((entry) => [
        entry.patternText,
        entry.patternMeaningKo ?? "",
        entry.usageNote ?? "",
        entry.englishText,
        entry.meaningKo ?? ""
      ])].some((text) => brokenText.test(text))) {
        addFailure(setQuestionId, "korean_text_integrity", "Source contains replacement output.");
      }
      if (draft.questions.length !== 5) {
        addFailure(setQuestionId, "question_count", "A standard Day must contain five questions.");
      }
      const schemaResult = wctStandardQuizSetCreateSchema.safeParse(draft);
      if (!schemaResult.success) {
        for (const issue of schemaResult.error.issues) {
          const questionIndex = issue.path[0] === "questions"
            && typeof issue.path[1] === "number"
            ? issue.path[1]
            : null;
          addFailure(
            questionIndex === null
              ? setQuestionId
              : draft.questions[questionIndex]?.id ?? setQuestionId,
            "schema_validation",
            issue.message
          );
        }
      }
      const duplicatePrompts = draft.questions.filter((question, index, questions) => (
        questions.some((other, otherIndex) => otherIndex !== index
          && normalizeWctIdentity(other.prompt) === normalizeWctIdentity(question.prompt))
      ));
      for (const question of duplicatePrompts) {
        addFailure(
          question.id,
          "prompt_uniqueness",
          "Normalized question prompts must be unique within a Day."
        );
      }
      const duplicateQuestionIds = draft.questions.filter((question, index, questions) => (
        questions.some((other, otherIndex) => otherIndex !== index && other.id === question.id)
      ));
      for (const question of duplicateQuestionIds) {
        addFailure(
          question.id,
          "question_id_uniqueness",
          "Question IDs must be unique within a Day."
        );
      }
      if (stableStringify(formatCounts(draft.questions)) !== stableStringify({
        multiple_choice: 2,
        fill_blank: 2,
        true_false: 1
      })) {
        addFailure(setQuestionId, "format_mix", "A standard Day must use the 2/2/1 format mix.");
      }
      if (stableStringify(kindCounts(draft.questions)) !== stableStringify({
        translation: 3,
        pattern: 2
      })) {
        addFailure(setQuestionId, "kind_mix", "A standard Day must use the 3/2 kind mix.");
      }
      for (const [index, question] of draft.questions.entries()) {
        if (index > 0 && question.format === draft.questions[index - 1].format) {
          addFailure(question.id, "adjacent_format", "Adjacent questions repeat a format.");
        }
        const candidates = set.candidates.filter((candidate) => (
          candidate.question.id === question.id
        ));
        if (candidates.length !== 1) {
          addFailure(question.id, "provenance_presence", "Question needs exactly one provenance row.");
        }
        const candidate = candidates.length === 1 ? candidates[0] : undefined;
        auditQuestion(source, question, candidate, (rule, reason) => (
          addFailure(question.id, rule, reason)
        ));
        const provenance = candidate?.provenance;
        const entry = provenance ? findSourceEntry(source, provenance) : undefined;
        rows.push({
          level: source.level,
          dayNumber: source.dayNumber,
          topic: source.topic,
          questionId: question.id,
          slotIndex: index,
          kind: question.kind,
          format: question.format ?? "missing",
          prompt: question.prompt,
          choices: question.choices.map((choice) => ({ ...choice })),
          correctAnswer: correctChoice(question)?.text ?? "",
          patternId: provenance?.patternId ?? "",
          exampleId: provenance?.exampleId ?? "",
          sourceSentence: provenance?.sourceSentence ?? "",
          pattern: entry?.patternText ?? question.feedback?.pattern ?? "",
          mutationEvidence: provenance ? mutationEvidence(provenance) : [],
          blankEvidence: provenance?.blankSpan ?? null,
          reason: question.feedback?.reason ?? question.explanation,
          question: structuredClone(question),
          feedback: question.feedback ? structuredClone(question.feedback) : null,
          provenance: provenance ? structuredClone(provenance) : null,
          sourceReference: {
            lessonKey: source.lessonKey,
            sourceId: source.sourceId,
            sourceHash: source.sourceHash,
            patternId: provenance?.patternId ?? "",
            exampleId: provenance?.exampleId ?? "",
            sourceSentence: provenance?.sourceSentence ?? "",
            patternText: entry?.patternText ?? ""
          }
        });
      }
    }
    const bookRows = rows.slice(firstBookRow);
    const trueFalseRows = bookRows.filter((row) => row.format === "true_false");
    const half = expectedDayCount / 2;
    const hasExactTotal = trueFalseRows.filter((row) => row.correctAnswer === "O").length === half
      && trueFalseRows.filter((row) => row.correctAnswer === "X").length === half;
    const hasBalancedResidues = [0, 1, 2].every((residue) => {
      const group = trueFalseRows.filter((row) => (row.dayNumber - 1) % 3 === residue);
      return Math.abs(
        group.filter((row) => row.correctAnswer === "O").length
        - group.filter((row) => row.correctAnswer === "X").length
      ) <= 1;
    });
    const alternatingResidues = [0, 1, 2].filter((residue) => {
      const group = trueFalseRows
        .filter((row) => (row.dayNumber - 1) % 3 === residue)
        .sort((left, right) => left.dayNumber - right.dayNumber);
      return group.some((row, index) => (
        index > 0 && row.correctAnswer === group[index - 1].correctAnswer
      ));
    });
    if (!hasExactTotal || !hasBalancedResidues) {
      for (const row of trueFalseRows) {
        const key = `${row.level}:${row.dayNumber}:${row.questionId}:true_false_balance`;
        if (failureKeys.has(key)) continue;
        failureKeys.add(key);
        failures.push({
          level: row.level,
          dayNumber: row.dayNumber,
          questionId: row.questionId,
          rule: "true_false_balance",
          reason: "The book does not have exact total and residue-balanced O/X allocation."
        });
      }
    }
    for (const residue of alternatingResidues) {
      for (const row of trueFalseRows.filter((item) => (
        (item.dayNumber - 1) % 3 === residue
      ))) {
        const key = `${row.level}:${row.dayNumber}:${row.questionId}:true_false_alternation`;
        if (failureKeys.has(key)) continue;
        failureKeys.add(key);
        failures.push({
          level: row.level,
          dayNumber: row.dayNumber,
          questionId: row.questionId,
          rule: "true_false_alternation",
          reason: "The zero-based residue sequence does not strictly alternate O/X."
        });
      }
    }
  }
  if (orderedBooks.length !== 2 || !seenLevels.has("prenovice") || !seenLevels.has("novice")) {
    const level = orderedBooks[0]?.level ?? "prenovice";
    failures.push({
      level,
      dayNumber: 0,
      questionId: "inventory",
      rule: "book_inventory",
      reason: "Release inventory must contain one Prenovice and one Novice book."
    });
  }
  rows.sort((left, right) => (
    levelOrder(left.level) - levelOrder(right.level)
      || left.dayNumber - right.dayNumber
      || left.slotIndex - right.slotIndex
      || left.questionId.localeCompare(right.questionId)
      || stableStringify(left).localeCompare(stableStringify(right))
  ));
  failures.sort((left, right) => (
    levelOrder(left.level) - levelOrder(right.level)
      || left.dayNumber - right.dayNumber
      || left.questionId.localeCompare(right.questionId)
      || left.rule.localeCompare(right.rule)
      || left.reason.localeCompare(right.reason)
  ));
  const sourceInventory = canonicalSourceInventory(orderedBooks);
  const stateCounts = (level: WctStandardLevel, state: "O" | "X") => rows.filter((row) => (
    row.level === level
    && row.format === "true_false"
    && row.correctAnswer === state
  )).length;
  const summary = {
    books: orderedBooks.length,
    days: orderedBooks.reduce((total, book) => total + book.sets.length, 0),
    questions: rows.length,
    prenoviceTrue: stateCounts("prenovice", "O"),
    prenoviceFalse: stateCounts("prenovice", "X"),
    noviceTrue: stateCounts("novice", "O"),
    noviceFalse: stateCounts("novice", "X")
  };
  return {
    ok: failures.length === 0,
    summary,
    failures,
    sourceInventory,
    rows,
    sourceInventoryHash: sha256(sourceInventory),
    questionArtifactHash: sha256(rows)
  };
}
