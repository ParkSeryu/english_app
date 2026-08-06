import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  symlinkSync,
  writeFileSync
} from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import { stableStringify } from "@/lib/wct/normalization";
import * as releaseTool from "@/scripts/generate-wct-quiz-v2.ts";

import {
  CHECKPOINT_B_MIGRATION,
  artifactsMatchLive,
  buildApprovalManifest,
  classifyPostMigrationProgress,
  parseV2QuizCommand,
  renderFixture,
  renderMigration,
  runCli,
  runCommand,
  verifyApprovalManifest,
  verifyAppliedSetRows,
  verifyMainProjectEnvironment,
  writeRequestedFile,
  type WctV2QuestionArtifact
} from "@/scripts/generate-wct-quiz-v2.ts";

type TestReleaseArtifact = WctV2QuestionArtifact & {
  sourceCorrectionManifest: TestSourceCorrection[];
  sourceCorrectionManifestHash: string;
  preSourceInventoryHash: string;
  postSourceInventoryHash: string;
  targetV1SetSnapshotHash: string;
  targetV1SetSnapshot: Array<{
    id: string;
    ownerId: string;
    bookId: string;
    dayNumber: number;
    lessonKey: string;
    sourceKind: "wct_day";
    sourceId: string;
    generatorVersion: "wct-review-v1";
    sourceHash: string;
    questions: WctV2QuestionArtifact["sets"][number]["questions"];
  }>;
};

type TestSourceCorrection = {
  bookId: string;
  dayId: string;
  patternId: string;
  exampleId: string;
  oldEnglishText: string;
  newEnglishText: string;
  oldMeaningKo: string;
  newMeaningKo: string;
};

const SOURCE_CORRECTIONS: TestSourceCorrection[] = [
  {
    bookId: "4a71e072-96de-4722-8874-c35b3ca97ec1",
    dayId: "e8e5db91-bbfc-47a0-8099-f5ec5cff4811",
    patternId: "e69bea89-5281-4c06-ae52-1586e540ccd7",
    exampleId: "80c15412-b4a4-4518-8e4e-097166547134",
    oldEnglishText: "I want a cup of beer.",
    newEnglishText: "I want a glass of beer.",
    oldMeaningKo: "나는 맥주 한 잔을 원한다.",
    newMeaningKo: "나는 맥주 한 잔을 원한다."
  },
  {
    bookId: "c4ab0760-3c31-4533-9631-0e2ead3bfe90",
    dayId: "2ce7ef73-5d80-4fe7-8817-c89e3cac9e56",
    patternId: "557eee5b-879f-44dc-ac63-a2e495638139",
    exampleId: "37ff0120-8494-4377-b64e-a83d70bdfda0",
    oldEnglishText: "The weather is depressing.",
    newEnglishText: "The weather is depressing.",
    oldMeaningKo: "그 날씨는 우울하게 해요.",
    newMeaningKo: "그 날씨는 사람을 우울하게 만들어요."
  },
  {
    bookId: "c4ab0760-3c31-4533-9631-0e2ead3bfe90",
    dayId: "46ce66c2-ef77-45e0-8cd5-6b65d8140d62",
    patternId: "9b5e0d86-b351-4273-90e3-05feb8962a88",
    exampleId: "5aebbaaa-e258-4139-b4dd-7cfc1211cec0",
    oldEnglishText: "I heard about you a lot.",
    newEnglishText: "I've heard a lot about you.",
    oldMeaningKo: "당신에 관해 많이 들었어요.",
    newMeaningKo: "당신에 관해 많이 들었어요."
  },
  {
    bookId: "c4ab0760-3c31-4533-9631-0e2ead3bfe90",
    dayId: "a4cfd9cb-2356-4e8d-844b-704204424d05",
    patternId: "83e1401a-1d72-4eca-8957-a9e0c0ceb5bf",
    exampleId: "763e2bbe-40da-41aa-b58b-86b9744a8c6a",
    oldEnglishText: "If I was you, I wouldn't date him.",
    newEnglishText: "If I were you, I wouldn't date him.",
    oldMeaningKo: "내가 너라면 그와 사귀지 않을 거예요.",
    newMeaningKo: "내가 너라면 그와 사귀지 않을 거예요."
  },
  {
    bookId: "c4ab0760-3c31-4533-9631-0e2ead3bfe90",
    dayId: "a4cfd9cb-2356-4e8d-844b-704204424d05",
    patternId: "83e1401a-1d72-4eca-8957-a9e0c0ceb5bf",
    exampleId: "d8ba0f89-5d79-4435-8597-723d4f1a59b5",
    oldEnglishText: "If I was a bird, I would fly in the sky.",
    newEnglishText: "If I were a bird, I would fly in the sky.",
    oldMeaningKo: "내가 새라면 하늘을 날 텐데요.",
    newMeaningKo: "내가 새라면 하늘을 날 텐데요."
  },
  {
    bookId: "c4ab0760-3c31-4533-9631-0e2ead3bfe90",
    dayId: "d4f98cf6-124d-45af-bd51-154705280896",
    patternId: "311f0464-a282-4a08-9f0e-119af0a16dbd",
    exampleId: "c4b5112c-47b9-4e5a-9224-e59a7b58ae7a",
    oldEnglishText: "I want you to be with me.",
    newEnglishText: "I want you to be with me.",
    oldMeaningKo: "당신이 나와 함께 있기를 원해요.",
    newMeaningKo: "나는 당신이 나와 함께 있기를 원해요."
  },
  {
    bookId: "c4ab0760-3c31-4533-9631-0e2ead3bfe90",
    dayId: "774c1597-2faf-48d5-b86b-1e7a8bd3ef7b",
    patternId: "e65a26dc-86e9-4c9b-99ae-ddf44fea108f",
    exampleId: "d4c92579-2365-4398-8362-cd7483ed22f0",
    oldEnglishText: "Being rich is good.",
    newEnglishText: "Being rich is good.",
    oldMeaningKo: "부자가 되는 것은 좋아요.",
    newMeaningKo: "부자인 것은 좋아요."
  },
  {
    bookId: "c4ab0760-3c31-4533-9631-0e2ead3bfe90",
    dayId: "774c1597-2faf-48d5-b86b-1e7a8bd3ef7b",
    patternId: "e65a26dc-86e9-4c9b-99ae-ddf44fea108f",
    exampleId: "1fe994a0-225a-4970-ac7c-57fb7d2fe045",
    oldEnglishText: "To study is good for your future.",
    newEnglishText: "To study is good for your future.",
    oldMeaningKo: "공부하는 것은 미래에 좋아요.",
    newMeaningKo: "공부하는 것은 미래에 도움이 돼요."
  }
];

const CORRECTION_DAY_IDS = new Map([
  ["4a71e072-96de-4722-8874-c35b3ca97ec1:3", "e8e5db91-bbfc-47a0-8099-f5ec5cff4811"],
  ["c4ab0760-3c31-4533-9631-0e2ead3bfe90:5", "2ce7ef73-5d80-4fe7-8817-c89e3cac9e56"],
  ["c4ab0760-3c31-4533-9631-0e2ead3bfe90:15", "46ce66c2-ef77-45e0-8cd5-6b65d8140d62"],
  ["c4ab0760-3c31-4533-9631-0e2ead3bfe90:22", "a4cfd9cb-2356-4e8d-844b-704204424d05"],
  ["c4ab0760-3c31-4533-9631-0e2ead3bfe90:28", "d4f98cf6-124d-45af-bd51-154705280896"],
  ["c4ab0760-3c31-4533-9631-0e2ead3bfe90:30", "774c1597-2faf-48d5-b86b-1e7a8bd3ef7b"]
]);

function artifact(
  overrides: Partial<TestReleaseArtifact> = {}
): TestReleaseArtifact {
  const noviceDays = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
    27, 28, 29, 30, 31
  ];
  const sets = Array.from({ length: 44 }, (_item, index) => {
    const lessonKey = `lesson-${index + 1}`;
    const bookId = index < 16
      ? "4a71e072-96de-4722-8874-c35b3ca97ec1"
      : "c4ab0760-3c31-4533-9631-0e2ead3bfe90";
    const dayNumber = index < 16 ? index + 1 : noviceDays[index - 16];
    const correctionDayId = CORRECTION_DAY_IDS.get(`${bookId}:${dayNumber}`);
    const correction = SOURCE_CORRECTIONS.find((entry) => entry.dayId === correctionDayId);
    const formats = [
      "multiple_choice",
      "fill_blank",
      "true_false",
      "multiple_choice",
      "fill_blank"
    ] as const;
    const kinds = [
      "translation",
      "pattern",
      "translation",
      "pattern",
      "translation"
    ] as const;
    const levelIndex = index < 16 ? index : index - 16;
    const trueFalseAnswer = levelIndex % 2 === 0 ? "O" : "X";
    return {
      bookId,
      level: index < 16 ? "prenovice" as const : "novice" as const,
      dayNumber,
      lessonKey,
      sourceId: correction?.dayId
        ?? `71000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      sourceHash: createHash("sha256").update(`source-${index + 1}`).digest("hex"),
      questions: formats.map((format, slotIndex) => {
        const choices = format === "true_false"
          ? [{ id: "o", text: "O" }, { id: "x", text: "X" }]
          : [
              { id: "correct", text: `Correct ${index + 1}-${slotIndex + 1}` },
              { id: "wrong-1", text: `Wrong 1 ${index + 1}-${slotIndex + 1}` },
              { id: "wrong-2", text: `Wrong 2 ${index + 1}-${slotIndex + 1}` },
              { id: "wrong-3", text: `Wrong 3 ${index + 1}-${slotIndex + 1}` }
            ];
        return {
          id: `q-${index + 1}-${slotIndex + 1}`,
          kind: kinds[slotIndex],
          format,
          prompt: `Prompt ${index + 1}-${slotIndex + 1}`,
          choices,
          correctChoiceId: format === "true_false"
            ? trueFalseAnswer.toLowerCase()
            : "correct",
          explanation: "Reason",
          feedback: {
            correctSentence: `Correct sentence ${index + 1}-${slotIndex + 1}`,
            pattern: "Pattern",
            reason: "Reason"
          }
        };
      })
    };
  });
  const rows = sets.flatMap((set) => set.questions.map((question, slotIndex) => ({
    slotIndex,
    question,
    sourceReference: {
      lessonKey: set.lessonKey,
      sourceId: set.sourceId,
      sourceHash: set.sourceHash
    }
  })));
  const sourceInventory: unknown[] = sets.flatMap((set, index) => {
    const corrections = SOURCE_CORRECTIONS.filter((entry) => entry.dayId === set.sourceId);
    const patternId = corrections[0]?.patternId
      ?? `74000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`;
    const examples = corrections.length > 0
      ? corrections.map((entry, correctionIndex) => ({
          exampleId: entry.exampleId,
          englishText: entry.newEnglishText,
          meaningKo: entry.newMeaningKo,
          sortOrder: index + 20 + correctionIndex
        }))
      : [{
          exampleId: `75000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
          englishText: `Example ${index + 1}`,
          meaningKo: `예문 ${index + 1}`,
          sortOrder: index + 20
        }];
    const bookTitle = set.level === "prenovice" ? "WCT Prenovice" : "WCT Novice";
    return [
      {
        domain: "full",
        entity: "day",
        bookId: set.bookId,
        level: set.level,
        bookTitle,
        bookLevelLabel: set.level === "prenovice" ? "Pre Novice" : "Novice",
        bookSortOrder: set.level === "prenovice" ? 1 : 2,
        dayNumber: set.dayNumber,
        lessonKey: set.lessonKey,
        sourceId: set.sourceId,
        shortLabel: `Topic ${index + 1}`,
        learningSummary: `Summary ${index + 1}`,
        sourcePageStart: null,
        sourcePageEnd: null,
        sourceNeedsReview: false
      },
      {
        domain: "full",
        entity: "pattern",
        sourceId: set.sourceId,
        patternId,
        patternText: `Pattern ${index + 1}`,
        patternMeaningKo: null,
        usageNote: null,
        usageSource: "book",
        sourcePage: null,
        sourceNeedsReview: false,
        sortOrder: index + 10
      },
      ...examples.map((example) => ({
        domain: "full",
        entity: "example",
        sourceId: set.sourceId,
        patternId,
        exampleId: example.exampleId,
        englishText: example.englishText,
        meaningKo: example.meaningKo,
        sourcePage: null,
        sourceNeedsReview: false,
        sortOrder: example.sortOrder
      })),
      ...examples
        .slice()
        .sort((left, right) => left.exampleId.localeCompare(right.exampleId))
        .map((example) => ({
        domain: "eligible",
        level: set.level,
        dayNumber: set.dayNumber,
        lessonKey: set.lessonKey,
        sourceId: set.sourceId,
        topic: `Topic ${index + 1}`,
        patternId,
        exampleId: example.exampleId,
        patternText: `Pattern ${index + 1}`,
        patternMeaningKo: null,
        usageNote: null,
        englishText: example.englishText,
        meaningKo: example.meaningKo
      }))
    ];
  });
  const ownerId = "00000000-0000-4000-8000-0000000000aa";
  const premiumSetSnapshot = [{
    id: "72000000-0000-4000-8000-000000000001",
    ownerId,
    lessonKey: "wct-premium:fixture",
    sourceKind: "wct_premium" as const,
    sourceId: "premium-fixture",
    generatorVersion: "wct-review-v1",
    sourceHash: "f".repeat(64),
    questions: Array.from({ length: 5 }, (_item, index) => ({
      id: `premium-q-${index + 1}`,
      kind: "translation" as const,
      prompt: `Premium prompt ${index + 1}`,
      choices: [
        { id: "correct", text: `Premium correct ${index + 1}` },
        { id: "wrong-1", text: `Premium wrong 1 ${index + 1}` },
        { id: "wrong-2", text: `Premium wrong 2 ${index + 1}` },
        { id: "wrong-3", text: `Premium wrong 3 ${index + 1}` }
      ],
      correctChoiceId: "correct",
      explanation: "Premium reason"
    }))
  }];
  const targetV1SetSnapshot = sets.map((set, index) => ({
    id: `73000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    ownerId,
    bookId: set.bookId,
    dayNumber: set.dayNumber,
    lessonKey: set.lessonKey,
    sourceKind: "wct_day" as const,
    sourceId: set.sourceId,
    generatorVersion: "wct-review-v1" as const,
    sourceHash: createHash("sha256").update(`legacy-source-${index + 1}`).digest("hex"),
    questions: Array.from({ length: 5 }, (_item, questionIndex) => ({
      id: `legacy-q-${index + 1}-${questionIndex + 1}`,
      kind: "translation" as const,
      prompt: `Legacy prompt ${index + 1}-${questionIndex + 1}`,
      choices: [
        { id: "correct", text: `Legacy correct ${index + 1}-${questionIndex + 1}` },
        { id: "wrong-1", text: `Legacy wrong 1 ${index + 1}-${questionIndex + 1}` },
        { id: "wrong-2", text: `Legacy wrong 2 ${index + 1}-${questionIndex + 1}` },
        { id: "wrong-3", text: `Legacy wrong 3 ${index + 1}-${questionIndex + 1}` }
      ],
      correctChoiceId: "correct",
      explanation: "Legacy reason"
    }))
  }));
  const sha256 = (value: unknown) => createHash("sha256")
    .update(stableStringify(value))
    .digest("hex");
  const preSourceInventory = structuredClone(sourceInventory);
  for (const correction of SOURCE_CORRECTIONS) {
    for (const row of preSourceInventory) {
      const source = row as Record<string, unknown>;
      if (source.exampleId !== correction.exampleId) continue;
      source.englishText = correction.oldEnglishText;
      source.meaningKo = correction.oldMeaningKo;
    }
  }
  return {
    schemaVersion: "wct-quiz-v2-question-artifact-v2" as never,
    projectRef: "ccawzrrkxuirrwvaecvw",
    generatorVersion: "wct-review-v2",
    generatedAt: "2026-08-05T00:00:00.000Z",
    sourceCorrectionManifest: structuredClone(SOURCE_CORRECTIONS),
    sourceCorrectionManifestHash: sha256(SOURCE_CORRECTIONS),
    preSourceInventoryHash: sha256(preSourceInventory),
    postSourceInventoryHash: sha256(sourceInventory),
    questionArtifactHash: sha256(rows),
    premiumSetSnapshotHash: sha256(premiumSetSnapshot),
    targetV1SetSnapshotHash: sha256(targetV1SetSnapshot),
    targetBooks: [
      {
        id: "4a71e072-96de-4722-8874-c35b3ca97ec1",
        ownerId,
        title: "WCT Prenovice",
        level: "prenovice",
        dayCount: 16
      },
      {
        id: "c4ab0760-3c31-4533-9631-0e2ead3bfe90",
        ownerId,
        title: "WCT Novice",
        level: "novice",
        dayCount: 28
      }
    ],
    summary: {
      books: 2,
      days: 44,
      questions: 220,
      prenoviceTrue: 8,
      prenoviceFalse: 8,
      noviceTrue: 14,
      noviceFalse: 14
    },
    failures: [],
    sourceInventory,
    premiumSetSnapshot,
    targetV1SetSnapshot,
    sets,
    rows,
    ...overrides
  } as TestReleaseArtifact;
}

describe("WCT v2 release command guards", () => {
  it("exits nonzero when a hosted audit read fails", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const status = await runCli([
      "audit",
      "--json",
      "/tmp/wct-v2-cli-failure.json",
      "--markdown",
      "/tmp/wct-v2-cli-failure.md"
    ], {
      createReadOnlyHostedClient: () => ({
        client: {} as never,
        projectRef: "ccawzrrkxuirrwvaecvw",
        host: "ccawzrrkxuirrwvaecvw.supabase.co"
      }),
      buildLiveArtifact: async () => {
        throw new Error("WCT v2 source read failed: forced fetch failure");
      }
    });

    expect(status).toBe(1);
    expect(log).toHaveBeenCalledWith(expect.stringContaining("readTarget=main/production"));
    expect(error).toHaveBeenCalledWith("WCT v2 source read failed: forced fetch failure");
  });

  it("creates outputs exclusively and rejects existing files or symlinked paths", () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), "wct-v2-output-"));
    const newOutput = path.join(directory, "new", "artifact.json");

    writeRequestedFile(newOutput, "first");
    expect(readFileSync(newOutput, "utf8")).toBe("first");
    expect(() => writeRequestedFile(newOutput, "second"))
      .toThrow("already exists");
    expect(readFileSync(newOutput, "utf8")).toBe("first");

    const realParent = path.join(directory, "real-parent");
    const linkedParent = path.join(directory, "linked-parent");
    mkdirSync(realParent);
    symlinkSync(realParent, linkedParent, "dir");
    expect(() => writeRequestedFile(path.join(linkedParent, "through-link.sql"), "sql"))
      .toThrow("symlink");

    const realFile = path.join(directory, "real.sql");
    const linkedFile = path.join(directory, "linked.sql");
    writeFileSync(realFile, "existing", { flag: "wx" });
    symlinkSync(realFile, linkedFile, "file");
    expect(() => writeRequestedFile(linkedFile, "sql")).toThrow("symlink");

    const danglingFile = path.join(directory, "dangling.sql");
    symlinkSync(path.join(directory, "missing-target.sql"), danglingFile, "file");
    expect(() => writeRequestedFile(danglingFile, "sql")).toThrow("symlink");

    const backslashOutput = `${directory}\\normalized\\artifact.json`;
    writeRequestedFile(backslashOutput, "normalized");
    expect(readFileSync(path.join(directory, "normalized", "artifact.json"), "utf8"))
      .toBe("normalized");
    expect(existsSync(backslashOutput)).toBe(false);
  });

  it("preflights both audit outputs before writing either file", async () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), "wct-v2-audit-preflight-"));
    const json = path.join(directory, "artifact.json");
    const markdown = path.join(directory, "existing-audit.md");
    writeFileSync(markdown, "existing", { flag: "wx" });
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    try {
      await expect(runCommand({ command: "audit", json, markdown }, {
        createReadOnlyHostedClient: () => ({
          client: {} as never,
          projectRef: "ccawzrrkxuirrwvaecvw",
          host: "ccawzrrkxuirrwvaecvw.supabase.co"
        }),
        buildLiveArtifact: async () => artifact({ rows: [] })
      })).rejects.toThrow("output already exists");
      expect(existsSync(json)).toBe(false);
      expect(readFileSync(markdown, "utf8")).toBe("existing");
    } finally {
      log.mockRestore();
    }
  });

  it("requires every command argument and the literal 220-row review guard", () => {
    expect(() => parseV2QuizCommand([
      "approve",
      "--artifact",
      "/tmp/artifact.json"
    ])).toThrow("--confirm-reviewed-220 is required");
    expect(() => parseV2QuizCommand([
      "approve",
      "--artifact",
      "/tmp/artifact.json",
      "--confirm-reviewed-220=true",
      "--reviewer",
      "Reviewer",
      "--output",
      "/tmp/approval.json"
    ])).toThrow("Unknown option: --confirm-reviewed-220=true");
    expect(() => parseV2QuizCommand([
      "generate",
      "--artifact",
      "/tmp/artifact.json",
      "--approval",
      "/tmp/approval.json"
    ])).toThrow("--output is required");
    expect(() => parseV2QuizCommand([
      "fixture",
      "--artifact",
      "/tmp/artifact.json",
      "--output",
      "/tmp/fixture.sql"
    ])).toThrow("--approval is required");
    expect(() => parseV2QuizCommand(["audit", "--json", "/tmp/a.json"]))
      .toThrow("--markdown is required");
    expect(() => parseV2QuizCommand(["verify"]))
      .toThrow("--artifact is required");
  });

  it("allows only the new checkpoint-B path for generated migration SQL", () => {
    for (const args of [
      ["audit", "--json", "supabase/migrations/audit.json", "--markdown", "/tmp/audit.md"],
      ["audit", "--json", "supabase/./migrations/audit.json", "--markdown", "/tmp/audit.md"],
      ["audit", "--json", "/tmp/audit.json", "--markdown", "/repo/supabase/migrations/audit.md"],
      [
        "approve", "--artifact", "/tmp/artifact.json", "--reviewer", "Reviewer",
        "--confirm-reviewed-220", "--output", "supabase/migrations/approval.json"
      ],
      [
        "fixture", "--artifact", "/tmp/artifact.json", "--approval", "/tmp/approval.json",
        "--output", "supabase\\migrations\\fixture.sql"
      ]
    ]) {
      expect(() => parseV2QuizCommand(args)).toThrow("must stay outside supabase/migrations");
    }

    expect(() => parseV2QuizCommand([
      "generate",
      "--artifact",
      "/tmp/artifact.json",
      "--approval",
      "/tmp/approval.json",
      "--output",
      "supabase/migrations/20260728121000_backfill_wct_review_quizzes.sql"
    ])).toThrow("refuses to overwrite an applied migration");

    expect(() => parseV2QuizCommand([
      "generate",
      "--artifact",
      "/tmp/artifact.json",
      "--approval",
      "/tmp/approval.json",
      "--output",
      CHECKPOINT_B_MIGRATION
    ])).toThrow(`WCT v2 output already exists: ${CHECKPOINT_B_MIGRATION}`);
    expect(() => parseV2QuizCommand([
      "generate",
      "--artifact",
      "/tmp/artifact.json",
      "--approval",
      "/tmp/approval.json",
      "--output",
      CHECKPOINT_B_MIGRATION.replaceAll("/", "\\")
    ])).toThrow(`WCT v2 output already exists: ${CHECKPOINT_B_MIGRATION}`);

    expect(() => parseV2QuizCommand([
      "fixture",
      "--artifact",
      "/tmp/artifact.json",
      "--approval",
      "/tmp/approval.json",
      "--output",
      CHECKPOINT_B_MIGRATION
    ])).toThrow("fixture output must stay outside supabase/migrations");

    expect(() => parseV2QuizCommand([
      "approve",
      "--artifact",
      "/tmp/artifact.json",
      "--reviewer",
      "Reviewer",
      "--confirm-reviewed-220",
      "--output",
      "/tmp/artifact.json"
    ])).toThrow("input and output paths must differ");
    expect(() => parseV2QuizCommand([
      "audit",
      "--json",
      "/tmp/audit.json",
      "--markdown",
      "/tmp/audit.json"
    ])).toThrow("output paths must differ");
  });

  it("parses all five import-safe subcommands without hosted access", () => {
    expect(parseV2QuizCommand([
      "audit",
      "--json",
      "/tmp/artifact.json",
      "--markdown",
      "/tmp/audit.md"
    ])).toEqual({
      command: "audit",
      json: "/tmp/artifact.json",
      markdown: "/tmp/audit.md"
    });
    expect(parseV2QuizCommand([
      "approve",
      "--artifact",
      "/tmp/artifact.json",
      "--reviewer",
      "Editorial reviewer",
      "--confirm-reviewed-220",
      "--output",
      "/tmp/approval.json"
    ])).toMatchObject({ command: "approve", reviewer: "Editorial reviewer" });
    expect(parseV2QuizCommand([
      "verify",
      "--artifact",
      "/tmp/artifact.json"
    ])).toEqual({ command: "verify", artifact: "/tmp/artifact.json" });
  });
});

describe("WCT v2 approval manifest", () => {
  it("records a truthful exact 44-set and 220-row approval", () => {
    const approved = buildApprovalManifest(
      artifact(),
      "Editorial reviewer",
      "2026-08-05T01:02:03.000Z"
    );

    expect(approved).toEqual({
      schemaVersion: "wct-quiz-v2-approval-v2",
      approved: true,
      reviewer: "Editorial reviewer",
      reviewedRows: 220,
      approvedAt: "2026-08-05T01:02:03.000Z",
      generatorVersion: "wct-review-v2",
      sourceCorrectionManifestHash: artifact().sourceCorrectionManifestHash,
      preSourceInventoryHash: artifact().preSourceInventoryHash,
      postSourceInventoryHash: artifact().postSourceInventoryHash,
      questionArtifactHash: artifact().questionArtifactHash,
      premiumSetSnapshotHash: artifact().premiumSetSnapshotHash,
      targetV1SetSnapshotHash: artifact().targetV1SetSnapshotHash,
      approvalMetadataHash: expect.stringMatching(/^[0-9a-f]{64}$/u),
      releaseEnvelopeHash: expect.stringMatching(/^[0-9a-f]{64}$/u)
    });
    expect(() => verifyApprovalManifest(artifact(), approved)).not.toThrow();
  });

  it("binds the exact sorted eight-entry source transition and rejects manifest drift", () => {
    const current = artifact();

    expect(current.schemaVersion).toBe("wct-quiz-v2-question-artifact-v2");
    expect(current.sourceCorrectionManifest).toEqual(SOURCE_CORRECTIONS);
    expect(current.sourceCorrectionManifest).toHaveLength(8);
    expect(current.sourceCorrectionManifest.every((entry) => (
      Number(entry.oldEnglishText !== entry.newEnglishText)
      + Number(entry.oldMeaningKo !== entry.newMeaningKo)
    ) === 1)).toBe(true);
    expect(current.preSourceInventoryHash).not.toBe(current.postSourceInventoryHash);

    const invalidManifests = [
      current.sourceCorrectionManifest.slice(0, 7),
      [...current.sourceCorrectionManifest].reverse(),
      [
        { ...current.sourceCorrectionManifest[0], patternId: "74000000-0000-4000-8000-999999999999" },
        ...current.sourceCorrectionManifest.slice(1)
      ],
      [...current.sourceCorrectionManifest, {
        ...current.sourceCorrectionManifest[0],
        exampleId: "75000000-0000-4000-8000-999999999999"
      }]
    ];
    for (const sourceCorrectionManifest of invalidManifests) {
      expect(() => buildApprovalManifest(artifact({
        sourceCorrectionManifest,
        sourceCorrectionManifestHash: createHash("sha256")
          .update(stableStringify(sourceCorrectionManifest))
          .digest("hex")
      }), "Reviewer", "2026-08-05T01:02:03.000Z"))
        .toThrow("exactly 44 sets, 220 reviewed rows, and zero failures");
    }

    const partialPostimage = artifact();
    const changedRow = partialPostimage.sourceInventory.find((row) => (
      (row as { domain?: string; exampleId?: string }).domain === "full"
      && (row as { exampleId?: string }).exampleId === SOURCE_CORRECTIONS[0].exampleId
    )) as Record<string, unknown>;
    changedRow.englishText = SOURCE_CORRECTIONS[0].oldEnglishText;
    partialPostimage.postSourceInventoryHash = createHash("sha256")
      .update(stableStringify(partialPostimage.sourceInventory))
      .digest("hex");
    expect(() => buildApprovalManifest(
      partialPostimage,
      "Reviewer",
      "2026-08-05T01:02:03.000Z"
    )).toThrow("exactly 44 sets, 220 reviewed rows, and zero failures");
  });

  it("projects all eight exact old source preimages to postimages atomically", () => {
    const project = (releaseTool as unknown as {
      projectWctV2SourceCorrections?: (books: unknown[]) => unknown[];
    }).projectWctV2SourceCorrections;
    expect(project).toBeTypeOf("function");
    if (!project) return;

    const books = [...new Set(SOURCE_CORRECTIONS.map((entry) => entry.bookId))].map((bookId) => ({
      id: bookId,
      days: [...new Set(SOURCE_CORRECTIONS
        .filter((entry) => entry.bookId === bookId)
        .map((entry) => entry.dayId))].map((dayId) => ({
          id: dayId,
          patterns: [...new Set(SOURCE_CORRECTIONS
            .filter((entry) => entry.dayId === dayId)
            .map((entry) => entry.patternId))].map((patternId) => ({
              id: patternId,
              examples: SOURCE_CORRECTIONS
                .filter((entry) => entry.patternId === patternId)
                .map((entry) => ({
                  id: entry.exampleId,
                  englishText: entry.oldEnglishText,
                  meaningKo: entry.oldMeaningKo
                }))
            }))
        }))
    }));
    const original = structuredClone(books);
    const projected = project(books) as typeof books;

    expect(books).toEqual(original);
    for (const correction of SOURCE_CORRECTIONS) {
      const example = projected
        .find((book) => book.id === correction.bookId)?.days
        .find((day) => day.id === correction.dayId)?.patterns
        .find((pattern) => pattern.id === correction.patternId)?.examples
        .find((candidate) => candidate.id === correction.exampleId);
      expect(example).toMatchObject({
        englishText: correction.newEnglishText,
        meaningKo: correction.newMeaningKo
      });
    }

    const stale = structuredClone(books);
    stale[0].days[0].patterns[0].examples[0].englishText = "unexpected live value";
    expect(() => project(stale)).toThrow("exact old source preimage");
    expect(stale[0].days[0].patterns[0].examples[0].englishText)
      .toBe("unexpected live value");

    const wrongParent = structuredClone(books);
    wrongParent[0].days[0].patterns[0].id = "74000000-0000-4000-8000-999999999999";
    expect(() => project(wrongParent)).toThrow("exact source parent graph");

    const partial = structuredClone(books);
    partial[0].days[0].patterns[0].examples[0].englishText = SOURCE_CORRECTIONS[0].newEnglishText;
    expect(() => project(partial)).toThrow("exact old source preimage");
    expect(() => project(projected)).toThrow("exact old source preimage");
  });

  it("requires canonical ISO approval time and binds reviewer metadata", () => {
    const current = artifact();
    expect(() => buildApprovalManifest(current, "Reviewer", "not-a-date"))
      .toThrow("approvedAt must be a canonical ISO timestamp");
    expect(() => buildApprovalManifest(current, "Reviewer", "2026-08-05T01:02:03Z"))
      .toThrow("approvedAt must be a canonical ISO timestamp");

    const approved = buildApprovalManifest(
      current,
      "Reviewer",
      "2026-08-05T01:02:03.000Z"
    );
    expect(() => verifyApprovalManifest(current, { ...approved, reviewer: "Other reviewer" }))
      .toThrow("WCT v2 approval hash mismatch");
    expect(() => verifyApprovalManifest(current, {
      ...approved,
      approvedAt: "2026-08-05T02:02:03.000Z"
    })).toThrow("WCT v2 approval hash mismatch");
  });

  it.each([
    ["wrong Day count", { summary: { ...artifact().summary, days: 43 } }],
    ["wrong set count", { sets: artifact().sets.slice(0, 43) }],
    ["wrong reviewed row count", { rows: artifact().rows.slice(0, 219) }],
    ["failed audit rule", {
      failures: [{
        level: "novice",
        dayNumber: 1,
        questionId: "q1",
        rule: "ambiguity",
        reason: "ambiguous"
      }]
    }]
  ])("rejects approval for an artifact with %s", (_name, change) => {
    expect(() => buildApprovalManifest(
      artifact(change as Partial<WctV2QuestionArtifact>),
      "Reviewer",
      "2026-08-05T01:02:03.000Z"
    )).toThrow("exactly 44 sets, 220 reviewed rows, and zero failures");
  });

  it("rejects a contiguous substitute for the exact production Novice Day schedule", () => {
    const current = artifact();
    const sets = current.sets.map((set, index) => set.level === "novice"
      ? { ...set, dayNumber: index - 15 }
      : set);

    expect(() => buildApprovalManifest(
      artifact({ sets }),
      "Reviewer",
      "2026-08-05T01:02:03.000Z"
    )).toThrow("exactly 44 sets, 220 reviewed rows, and zero failures");
  });

  it("independently validates the v2 format/kind plan and recomputes O/X summary", () => {
    const withChangedQuestion = (
      questionIndex: number,
      change: (question: WctV2QuestionArtifact["sets"][number]["questions"][number]) => void
    ) => {
      const current = artifact();
      change(current.sets[0].questions[questionIndex]);
      const firstRow = current.rows[questionIndex] as {
        question: WctV2QuestionArtifact["sets"][number]["questions"][number];
      };
      firstRow.question = structuredClone(current.sets[0].questions[questionIndex]);
      current.questionArtifactHash = createHash("sha256")
        .update(stableStringify(current.rows))
        .digest("hex");
      return current;
    };
    const allMultipleChoice = artifact();
    for (const [index, question] of allMultipleChoice.sets[0].questions.entries()) {
      question.format = "multiple_choice";
      (allMultipleChoice.rows[index] as { question: typeof question }).question = structuredClone(question);
    }
    allMultipleChoice.questionArtifactHash = createHash("sha256")
      .update(stableStringify(allMultipleChoice.rows))
      .digest("hex");
    const wrongKindMix = withChangedQuestion(0, (question) => {
      question.kind = "pattern";
    });
    const wrongTruthBalance = withChangedQuestion(2, (question) => {
      question.correctChoiceId = "x";
    });

    for (const invalid of [allMultipleChoice, wrongKindMix, wrongTruthBalance]) {
      expect(() => buildApprovalManifest(
        invalid,
        "Reviewer",
        "2026-08-05T01:02:03.000Z"
      )).toThrow("exactly 44 sets, 220 reviewed rows, and zero failures");
    }
  });

  it("rejects false, missing, and hash-mismatched approval", () => {
    const current = artifact();
    const approved = buildApprovalManifest(
      current,
      "Reviewer",
      "2026-08-05T01:02:03.000Z"
    );

    expect(() => verifyApprovalManifest(current, { ...approved, approved: false }))
      .toThrow("WCT v2 approval is missing or false");
    expect(() => verifyApprovalManifest(current, null))
      .toThrow("WCT v2 approval is missing or false");
    expect(() => verifyApprovalManifest(
      artifact({ questionArtifactHash: "changed-question-hash" }),
      approved
    )).toThrow("WCT v2 approval hash mismatch");
    expect(() => verifyApprovalManifest(
      artifact({ preSourceInventoryHash: "changed-pre-source-hash" }),
      approved
    )).toThrow("WCT v2 approval hash mismatch");
    expect(() => verifyApprovalManifest(
      artifact({ postSourceInventoryHash: "changed-post-source-hash" }),
      approved
    )).toThrow("WCT v2 approval hash mismatch");
    expect(() => verifyApprovalManifest(
      artifact({ sourceCorrectionManifestHash: "changed-manifest-hash" }),
      approved
    )).toThrow("WCT v2 approval hash mismatch");
    for (const changedApproval of [
      { ...approved, sourceCorrectionManifestHash: "a".repeat(64) },
      { ...approved, preSourceInventoryHash: "b".repeat(64) },
      { ...approved, postSourceInventoryHash: "c".repeat(64) }
    ]) {
      expect(() => verifyApprovalManifest(current, changedApproval))
        .toThrow("WCT v2 approval hash mismatch");
    }
    expect(() => verifyApprovalManifest(
      artifact({ premiumSetSnapshotHash: "changed-premium-hash" }),
      approved
    )).toThrow("WCT v2 approval hash mismatch");
  });

  it("rejects SQL-consumed set body tampering hidden behind unchanged hashes", () => {
    const current = artifact();
    const approved = buildApprovalManifest(
      current,
      "Reviewer",
      "2026-08-05T01:02:03.000Z"
    );
    const changedSets = structuredClone(current.sets);
    changedSets[0].questions[0].prompt = "Tampered prompt";

    expect(() => verifyApprovalManifest(
      artifact({ sets: changedSets }),
      approved
    )).toThrow("WCT v2 approval hash mismatch");

    const changedSourceGraph = structuredClone(current.sets);
    changedSourceGraph[0].sourceId = "71000000-0000-4000-8000-999999999999";
    expect(() => buildApprovalManifest(
      artifact({ sets: changedSourceGraph }),
      "Reviewer",
      "2026-08-05T01:02:03.000Z"
    )).toThrow("exactly 44 sets, 220 reviewed rows, and zero failures");
  });

  it("binds the exact two production book IDs to one owner", () => {
    const current = artifact();
    const approved = buildApprovalManifest(
      current,
      "Reviewer",
      "2026-08-05T01:02:03.000Z"
    );
    const wrongBook = structuredClone(current.targetBooks);
    wrongBook[0].id = "00000000-0000-4000-8000-000000000001";
    const wrongOwner = structuredClone(current.targetBooks);
    wrongOwner[1].ownerId = "different-owner";
    const coordinatedOwnerTamper = structuredClone(current.targetBooks);
    coordinatedOwnerTamper[0].ownerId = "coordinated-different-owner";
    coordinatedOwnerTamper[1].ownerId = "coordinated-different-owner";

    expect(() => verifyApprovalManifest(artifact({ targetBooks: wrongBook }), approved))
      .toThrow("WCT v2 approval hash mismatch");
    expect(() => verifyApprovalManifest(artifact({ targetBooks: wrongOwner }), approved))
      .toThrow("WCT v2 approval hash mismatch");
    expect(() => verifyApprovalManifest(
      artifact({ targetBooks: coordinatedOwnerTamper }),
      approved
    )).toThrow("WCT v2 approval hash mismatch");
  });

  it("binds and validates the exact legacy v1 target graph consumed before apply", () => {
    const current = artifact();
    const approved = buildApprovalManifest(
      current,
      "Reviewer",
      "2026-08-05T01:02:03.000Z"
    );
    const changed = structuredClone(current);
    changed.targetV1SetSnapshot[0].id = "not-a-uuid";
    changed.targetV1SetSnapshot[0].sourceHash = changed.sets[0].sourceHash;
    changed.targetV1SetSnapshot[0].questions[0].format = "multiple_choice";

    expect(() => verifyApprovalManifest(changed, approved))
      .toThrow("WCT v2 approval hash mismatch");
    expect(artifactsMatchLive(current, changed)).toBe(false);
  });

  it("requires UUID-shaped snapshots and both explicit source domains", () => {
    const invalidPremium = artifact();
    invalidPremium.premiumSetSnapshot[0].id = "not-a-uuid";
    invalidPremium.premiumSetSnapshotHash = createHash("sha256")
      .update(stableStringify(invalidPremium.premiumSetSnapshot))
      .digest("hex");
    const missingEligible = artifact();
    missingEligible.sourceInventory = missingEligible.sourceInventory.filter((row) => (
      (row as { domain?: string }).domain !== "eligible"
    ));
    missingEligible.postSourceInventoryHash = createHash("sha256")
      .update(stableStringify(missingEligible.sourceInventory))
      .digest("hex");
    const extraEligibleField = artifact();
    const eligibleRow = extraEligibleField.sourceInventory.find((row) => (
      (row as { domain?: string }).domain === "eligible"
    )) as Record<string, unknown>;
    eligibleRow.sourceHash = extraEligibleField.sets[0].sourceHash;
    extraEligibleField.postSourceInventoryHash = createHash("sha256")
      .update(stableStringify(extraEligibleField.sourceInventory))
      .digest("hex");

    for (const invalid of [invalidPremium, missingEligible, extraEligibleField]) {
      expect(() => buildApprovalManifest(
        invalid,
        "Reviewer",
        "2026-08-05T01:02:03.000Z"
      )).toThrow("exactly 44 sets, 220 reviewed rows, and zero failures");
    }
  });

  it("compares the exact release target metadata against the live inventory", () => {
    const current = artifact();
    const changedBooks = structuredClone(current.targetBooks);
    changedBooks[0].ownerId = "00000000-0000-4000-8000-0000000000bb";
    changedBooks[1].ownerId = "00000000-0000-4000-8000-0000000000bb";

    expect(artifactsMatchLive(current, artifact())).toBe(true);
    expect(artifactsMatchLive(current, artifact({ targetBooks: changedBooks }))).toBe(false);
    expect(artifactsMatchLive(current, artifact({
      preSourceInventoryHash: "a".repeat(64)
    }))).toBe(false);
    expect(artifactsMatchLive(current, artifact({
      postSourceInventoryHash: "b".repeat(64)
    }))).toBe(false);
    expect(artifactsMatchLive(current, artifact({
      sourceCorrectionManifestHash: "c".repeat(64)
    }))).toBe(false);
  });
});

describe("WCT v2 rendered release SQL", () => {
  it("allows only the explicit session marker with zero target books to no-op", () => {
    const sql = renderMigration(artifact());
    const targetCountStart = sql.indexOf("select count(*)::integer\n  into v_target_book_count");
    const markerGuard = `if current_setting('app.wct_v2_allow_empty_fixture', true) = 'on'
    and v_target_book_count = 0 then
    return;
  end if;`;
    const inventoryGuard = `if v_target_book_count <> 2
    or (select count(*) from public.wct_books where id in (`;
    const markerGuardStart = sql.indexOf(markerGuard);
    const targetCountSql = sql.slice(targetCountStart, markerGuardStart);

    expect(sql.match(/current_setting\('app\.wct_v2_allow_empty_fixture', true\)/gu))
      .toHaveLength(1);
    expect(sql.match(/\breturn;/gu)).toHaveLength(1);
    expect(sql).toContain("v_target_book_count integer;");
    expect(sql).toContain(`select count(*)::integer
  into v_target_book_count
  from public.wct_books
  where id in (`);
    expect(targetCountSql).toContain("4a71e072-96de-4722-8874-c35b3ca97ec1");
    expect(targetCountSql).toContain("c4ab0760-3c31-4533-9631-0e2ead3bfe90");
    expect(targetCountSql).not.toContain("owner_id");
    expect(sql).toContain(markerGuard);
    expect(sql).toContain(inventoryGuard);
    expect(markerGuardStart).toBeLessThan(sql.indexOf(inventoryGuard));
    expect(sql.indexOf(inventoryGuard)).toBeLessThan(
      sql.indexOf("update public.wct_examples")
    );
    expect(sql).not.toContain("set app.wct_v2_allow_empty_fixture");
    expect(sql).not.toContain("set_config('app.wct_v2_allow_empty_fixture'");
  });

  it("chooses a dollar-quote delimiter absent from the complete generated body", () => {
    const current = artifact();
    current.sets[0].questions[0].prompt = "Literal attacker text: $wct_v2$";

    const sql = renderMigration(current);
    const delimiter = /^do (\$[a-z0-9_]+\$)$/mu.exec(sql)?.[1];

    expect(delimiter).toBeTruthy();
    expect(delimiter).not.toBe("$wct_v2$");
    expect(sql.split(delimiter!)).toHaveLength(3);
    expect(sql).toContain("Literal attacker text: $wct_v2$");
  });

  it("leaves transaction ownership to the migration ledger and guards release effects", () => {
    const sql = renderMigration(artifact());

    expect(sql).not.toMatch(/^\s*(?:begin|commit);\s*$/imu);
    expect(sql).toContain("v_expected_source_full_before jsonb :=");
    expect(sql).toContain("v_expected_source_full_after jsonb :=");
    expect(sql).toContain("v_expected_source_eligible_before jsonb :=");
    expect(sql).toContain("v_expected_source_eligible_after jsonb :=");
    expect(sql).toContain("v_expected_target_before jsonb :=");
    expect(sql).toContain("v_expected_target_after jsonb :=");
    expect(sql).toContain("v_expected_premium jsonb :=");
    expect(sql).toContain("WCT v2 current source inventory does not match approved source");
    expect(sql).toContain("WCT v2 current Premium inventory does not match approved snapshot");
    expect(sql).toContain("WCT v2 current target graph does not match exact 44-set v1 inventory");
    expect(sql).toContain("WCT v2 converted target graph does not match approved payload");
    expect(sql).toContain("wct-premium:fixture");
    expect(sql).toContain("v_count <> 44 or v_question_count <> 220");
    expect(sql).toMatch(/if exists \([\s\S]*wct_quiz_progress[\s\S]*target quiz progress was not reset/u);
    expect(sql).toMatch(/if exists \([\s\S]*wct_pop_quiz_progress[\s\S]*target Pop progress was not reset/u);
    expect(sql).toContain("v_source_full_after is distinct from v_expected_source_full_after");
    expect(sql).toContain("v_source_eligible_after is distinct from v_expected_source_eligible_after");
    expect(sql).toMatch(/v_premium_after is distinct from v_premium_before[\s\S]*v_premium_progress_after is distinct from v_premium_progress_before/u);
  });

  it("compares the same full and eligible source domains including ordering and review flags", () => {
    const sql = renderMigration(artifact());

    expect(sql).toContain("v_expected_source_full_before jsonb :=");
    expect(sql).toContain("v_expected_source_full_after jsonb :=");
    expect(sql).toContain("v_expected_source_eligible_before jsonb :=");
    expect(sql).toContain("v_expected_source_eligible_after jsonb :=");
    expect(sql).toMatch(/pattern\.sort_order[\s\S]*pattern\.source_needs_review/u);
    expect(sql).toMatch(/example\.sort_order[\s\S]*example\.source_needs_review/u);
    expect(sql).toContain("day.source_needs_review");
    expect(sql).toContain("day.learning_summary");
    expect(sql).toContain("v_source_full_after is distinct from v_expected_source_full_after");
    expect(sql).toContain("v_source_eligible_after is distinct from v_expected_source_eligible_after");
    expect(sql).toMatch(/source_row\.pattern_sort_order,\s*source_row\.pattern_id,\s*source_row\.entity_order,\s*source_row\.example_sort_order,\s*source_row\.entity_id/gu);
  });

  it("emits one fail-closed atomic eight-row source transition before the v2 sync", () => {
    const current = artifact();
    const sql = renderMigration(current);
    const sourceUpdateIndex = sql.indexOf("update public.wct_examples");
    const postSourceCheckIndex = sql.indexOf(
      "if v_source_full_after is distinct from v_expected_source_full_after"
    );
    const syncIndex = sql.indexOf("perform public.sync_wct_standard_quiz_sets");

    expect(sql.match(/update public\.wct_examples/gu)).toHaveLength(1);
    expect(sourceUpdateIndex).toBeGreaterThan(-1);
    expect(postSourceCheckIndex).toBeGreaterThan(sourceUpdateIndex);
    expect(postSourceCheckIndex).toBeLessThan(syncIndex);
    expect(syncIndex).toBeGreaterThan(sourceUpdateIndex);
    expect(sql).toContain("jsonb_to_recordset(v_source_corrections)");
    expect(sql).toMatch(/update public\.wct_examples[\s\S]*from \(values/u);
    expect(sql).toMatch(/join public\.wct_patterns[\s\S]*join public\.wct_days/u);
    expect(sql).toContain("WCT v2 source correction exact old source preimage or parent graph mismatch");
    expect(sql).toContain("get diagnostics v_count = row_count");
    expect(sql).toContain("if v_count <> 8 then");
    expect(sql).toMatch(/english_text = case[\s\S]*meaning_ko = case/u);
    expect(sql).toMatch(/pg_advisory_xact_lock[\s\S]*lock table public\.wct_books/u);
    expect(sql).toContain(`sourceCorrectionManifestHash=${current.sourceCorrectionManifestHash}`);
    expect(sql).toContain(`preSourceInventoryHash=${current.preSourceInventoryHash}`);
    expect(sql).toContain(`postSourceInventoryHash=${current.postSourceInventoryHash}`);
    for (const correction of SOURCE_CORRECTIONS) {
      expect(sql).toContain(correction.exampleId);
      expect(sql).toContain(correction.oldEnglishText.replaceAll("'", "''"));
      expect(sql).toContain(correction.newEnglishText.replaceAll("'", "''"));
      expect(sql).toContain(correction.oldMeaningKo);
      expect(sql).toContain(correction.newMeaningKo);
    }
  });

  it("seeds the exact old source preimage in the executable fixture", () => {
    const sql = renderFixture(artifact());
    const examplesSql = sql.slice(
      sql.indexOf("insert into public.wct_examples"),
      sql.indexOf("insert into public.wct_quiz_sets")
    );

    for (const correction of SOURCE_CORRECTIONS) {
      expect(examplesSql).toContain(correction.exampleId);
      expect(examplesSql).toContain(correction.oldEnglishText.replaceAll("'", "''"));
      expect(examplesSql).toContain(correction.oldMeaningKo);
      if (correction.oldEnglishText !== correction.newEnglishText) {
        expect(examplesSql).not.toContain(correction.newEnglishText.replaceAll("'", "''"));
      }
      if (correction.oldMeaningKo !== correction.newMeaningKo) {
        expect(examplesSql).not.toContain(correction.newMeaningKo);
      }
    }
  });

  it("renders target and Premium progress sentinels in the local-only fixture", () => {
    const current = artifact();
    const sql = renderFixture(current);

    expect(sql).toContain("insert into auth.users");
    expect(sql).toMatch(/-- fixture-target-standard-progress\s+insert into public\.wct_quiz_progress/u);
    expect(sql).toMatch(/-- fixture-premium-progress\s+insert into public\.wct_quiz_progress/u);
    expect(sql.match(/fixture-target-pop-/gu)).toHaveLength(2);
    expect(sql).toContain("'wct_premium'");
    expect(sql).toContain(`${current.targetV1SetSnapshot[0].id}'::uuid`);
    expect(sql).toContain(current.targetV1SetSnapshot[0].sourceHash);
    expect(sql).not.toContain(current.sets[0].sourceHash);
    expect(current.targetV1SetSnapshot[0].questions).toSatisfy((questions: unknown) => (
      Array.isArray(questions)
      && questions.length === 5
      && questions.every((question) => (
        typeof question === "object"
        && question !== null
        && Array.isArray((question as { choices?: unknown }).choices)
        && (question as { choices: unknown[] }).choices.length === 4
        && !("format" in question)
        && !("feedback" in question)
      ))
    ));
  });

  it("uses approved full-source book metadata in the local fixture", () => {
    const current = artifact();
    for (const row of current.sourceInventory) {
      const source = row as Record<string, unknown>;
      if (source.domain === "full"
        && source.entity === "day"
        && source.level === "prenovice") {
        source.bookLevelLabel = "Approved Pre Novice";
        source.bookSortOrder = 41;
      }
      if (source.domain === "full"
        && source.entity === "day"
        && source.dayNumber === 1
        && source.level === "prenovice") {
        source.learningSummary = "Approved learning summary";
      }
    }

    const sql = renderFixture(current);

    expect(sql).toMatch(/'WCT Prenovice',\s*'Approved Pre Novice',\s*41/u);
    expect(sql).toContain("'Approved learning summary'");
  });
});

describe("WCT v2 hosted environment and package guards", () => {
  it("rejects stale post-B progress and reports only strictly newer approved attempts", () => {
    const current = artifact();
    const approvedSetId = current.targetV1SetSnapshot[0].id;
    const installedAt = "2026-08-05T01:00:00.000Z";
    const newQuizProgress = [{
      quiz_set_id: approvedSetId,
      user_id: current.targetBooks[0].ownerId,
      completed_at: "2026-08-05T01:00:00.000001Z",
      updated_at: "2026-08-05T01:00:00.000002Z"
    }];
    const newPopProgress = [{
      owner_id: current.targetBooks[0].ownerId,
      book_id: current.targetBooks[0].id,
      attempt_id: "77000000-0000-4000-8000-000000000001",
      questions: [{ sourceQuizSetId: approvedSetId }],
      started_at: "2026-08-05T01:00:00.000001Z",
      updated_at: "2026-08-05T01:00:00.000002Z"
    }];

    expect(classifyPostMigrationProgress(
      current,
      installedAt,
      newQuizProgress,
      newPopProgress
    )).toEqual({
      quiz: [{
        quizSetId: approvedSetId,
        userId: current.targetBooks[0].ownerId,
        completedAt: "2026-08-05T01:00:00.000001Z",
        updatedAt: "2026-08-05T01:00:00.000002Z"
      }],
      pop: [{
        bookId: current.targetBooks[0].id,
        attemptId: "77000000-0000-4000-8000-000000000001",
        sourceQuizSetIds: [approvedSetId],
        startedAt: "2026-08-05T01:00:00.000001Z",
        updatedAt: "2026-08-05T01:00:00.000002Z"
      }]
    });

    expect(() => classifyPostMigrationProgress(current, installedAt, [{
      ...newQuizProgress[0],
      completed_at: installedAt
    }], [])).toThrow("stale target progress from before checkpoint B");
    expect(() => classifyPostMigrationProgress(current, installedAt, [], [{
      ...newPopProgress[0],
      started_at: "2026-08-05T00:59:59.999Z"
    }])).toThrow("stale target progress from before checkpoint B");
    expect(() => classifyPostMigrationProgress(current, installedAt, [], [{
      ...newPopProgress[0],
      questions: [{ sourceQuizSetId: "77000000-0000-4000-8000-999999999999" }]
    }])).toThrow("approved v2 set IDs");
  });

  it("binds post-B Pop source set IDs to their exact approved target book", () => {
    const current = artifact();
    const installedAt = "2026-08-05T01:00:00.000Z";
    const prenoviceBook = current.targetBooks.find((book) => book.level === "prenovice")!;
    const noviceBook = current.targetBooks.find((book) => book.level === "novice")!;
    const prenoviceSetId = current.targetV1SetSnapshot.find((set) => (
      set.bookId === prenoviceBook.id
    ))!.id;
    const noviceSetId = current.targetV1SetSnapshot.find((set) => (
      set.bookId === noviceBook.id
    ))!.id;
    const popProgress = (
      bookId: string,
      sourceQuizSetId: string,
      attemptId: string
    ) => ({
      owner_id: prenoviceBook.ownerId,
      book_id: bookId,
      attempt_id: attemptId,
      questions: [{ sourceQuizSetId }],
      started_at: "2026-08-05T01:00:00.000001Z",
      updated_at: "2026-08-05T01:00:00.000002Z"
    });

    expect(classifyPostMigrationProgress(current, installedAt, [], [
      popProgress(
        prenoviceBook.id,
        prenoviceSetId,
        "77000000-0000-4000-8000-000000000011"
      ),
      popProgress(
        noviceBook.id,
        noviceSetId,
        "77000000-0000-4000-8000-000000000012"
      )
    ]).pop).toHaveLength(2);
    expect(() => classifyPostMigrationProgress(current, installedAt, [], [
      popProgress(
        prenoviceBook.id,
        noviceSetId,
        "77000000-0000-4000-8000-000000000013"
      )
    ])).toThrow("exact approved target book");
    expect(() => classifyPostMigrationProgress(current, installedAt, [], [
      popProgress(
        noviceBook.id,
        prenoviceSetId,
        "77000000-0000-4000-8000-000000000014"
      )
    ])).toThrow("exact approved target book");
    expect(() => classifyPostMigrationProgress(current, installedAt, [], [
      popProgress(
        prenoviceBook.id,
        "77000000-0000-4000-8000-999999999999",
        "77000000-0000-4000-8000-000000000015"
      )
    ])).toThrow("exact approved target book");
  });

  it("runs post-B verify from the live v2 lifecycle without requiring a live v1 snapshot", async () => {
    const current = artifact();
    const legacyByLesson = new Map(current.targetV1SetSnapshot.map((set) => (
      [set.lessonKey, set] as const
    )));
    const stored = current.sets.map((set) => ({
      id: legacyByLesson.get(set.lessonKey)!.id,
      owner_id: legacyByLesson.get(set.lessonKey)!.ownerId,
      lesson_key: set.lessonKey,
      source_kind: "wct_day",
      source_id: set.sourceId,
      generator_version: "wct-review-v2",
      source_hash: set.sourceHash,
      questions: set.questions
    }));
    let postLifecycleReached = false;
    let inventoryVerificationReached = false;

    const result = await runCommand(parseV2QuizCommand([
      "verify",
      "--artifact",
      "/tmp/approved-artifact.json"
    ]), {
      createReadOnlyHostedClient: () => ({
        client: {} as never,
        projectRef: "ccawzrrkxuirrwvaecvw",
        host: "ccawzrrkxuirrwvaecvw.supabase.co"
      }),
      readArtifact: () => current,
      buildLiveArtifact: async () => {
        throw new Error("verify must not require the pre-B v1 lifecycle");
      },
      buildPostApplyLiveState: async () => {
        postLifecycleReached = true;
        return current;
      },
      verifyAppliedInventory: async () => {
        inventoryVerificationReached = true;
        verifyAppliedSetRows(current, stored);
        return {
          standardSets: 44,
          quizProgressCount: 0,
          popProgressCount: 0,
          checkpointBInstalledAt: "2026-08-05T01:00:00.000Z",
          newProgressAfterMigration: { quiz: [], pop: [] }
        };
      }
    });

    expect(postLifecycleReached).toBe(true);
    expect(inventoryVerificationReached).toBe(true);
    expect(result).toEqual({
      command: "verify",
      standardSets: 44,
      quizProgressCount: 0,
      popProgressCount: 0,
      checkpointBInstalledAt: "2026-08-05T01:00:00.000Z",
      newProgressAfterMigration: { quiz: [], pop: [] }
    });
  });

  it("post-verify requires the exact approved legacy set UUIDs on v2 rows", () => {
    const current = artifact();
    const legacyByLesson = new Map(current.targetV1SetSnapshot.map((set) => (
      [set.lessonKey, set] as const
    )));
    const stored = current.sets.map((set) => ({
      id: legacyByLesson.get(set.lessonKey)!.id,
      owner_id: legacyByLesson.get(set.lessonKey)!.ownerId,
      lesson_key: set.lessonKey,
      source_kind: "wct_day",
      source_id: set.sourceId,
      generator_version: "wct-review-v2",
      source_hash: set.sourceHash,
      questions: set.questions
    }));

    expect(verifyAppliedSetRows(current, stored)).toHaveLength(44);
    stored[0].id = "76000000-0000-4000-8000-000000000001";
    expect(() => verifyAppliedSetRows(current, stored))
      .toThrow("preserve approved target set UUIDs");
  });

  it("accepts only the exact main/production ref and host", () => {
    expect(verifyMainProjectEnvironment({
      NEXT_PUBLIC_SUPABASE_URL: "https://ccawzrrkxuirrwvaecvw.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "read-only-client-key"
    })).toEqual({
      projectRef: "ccawzrrkxuirrwvaecvw",
      host: "ccawzrrkxuirrwvaecvw.supabase.co"
    });
    expect(() => verifyMainProjectEnvironment({
      NEXT_PUBLIC_SUPABASE_URL: "https://wrong.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "key"
    })).toThrow("expected ccawzrrkxuirrwvaecvw.supabase.co");
    for (const unsafeUrl of [
      "http://ccawzrrkxuirrwvaecvw.supabase.co",
      "https://ccawzrrkxuirrwvaecvw.supabase.co:444",
      "https://reader@ccawzrrkxuirrwvaecvw.supabase.co",
      "https://reader:secret@ccawzrrkxuirrwvaecvw.supabase.co"
    ]) {
      expect(() => verifyMainProjectEnvironment({
        NEXT_PUBLIC_SUPABASE_URL: unsafeUrl,
        SUPABASE_SERVICE_ROLE_KEY: "key"
      })).toThrow("exact HTTPS main/production origin");
    }
  });

  it("never enables the local empty-fixture marker in the production migration runner", () => {
    const runner = readFileSync(
      path.join(process.cwd(), "scripts/db-migrations.mjs"),
      "utf8"
    );

    expect(runner).not.toContain("app.wct_v2_allow_empty_fixture");
  });

  it("exposes five guarded scripts and removes only the unsafe v1 generator entry", () => {
    const packageJson = JSON.parse(readFileSync(
      path.join(process.cwd(), "package.json"),
      "utf8"
    )) as { scripts: Record<string, string> };

    expect(packageJson.scripts).toMatchObject({
      "wct:quiz-v2:audit": expect.stringContaining(" audit"),
      "wct:quiz-v2:approve": expect.stringContaining(" approve"),
      "wct:quiz-v2:generate": expect.stringContaining(" generate"),
      "wct:quiz-v2:fixture": expect.stringContaining(" fixture"),
      "wct:quiz-v2:verify": expect.stringContaining(" verify")
    });
    expect(packageJson.scripts["wct:quiz-backfill:generate"]).toBeUndefined();
    expect(packageJson.scripts["wct:quiz-backfill:verify"]).toBeTruthy();
  });
});
