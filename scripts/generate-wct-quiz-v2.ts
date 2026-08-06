import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
  auditStandardWctQuizInventory,
  type WctStandardAuditFailure,
  type WctStandardAuditRow
} from "../lib/wct/quiz/standard/audit.ts";
import { generateStandardWctQuizBook } from "../lib/wct/quiz/standard/generator.ts";
import { standardWctLessonKey } from "../lib/wct/quiz/keys.ts";
import type { WctGeneratedStandardQuizBook } from "../lib/wct/quiz/standard/types.ts";
import {
  normalizeWctIdentity,
  stableStringify
} from "../lib/wct/normalization.ts";
import type { WctQuizQuestion } from "../lib/wct/quiz/types.ts";
import {
  wctQuizSetCreateSchema,
  wctStandardQuizSetCreateSchema
} from "../lib/wct/quiz/validation.ts";
import type {
  WctBook,
  WctDay,
  WctSourceKind
} from "../lib/wct/types.ts";

const ROOT = process.cwd();
const ENV_FILE = ".env.local";
const PROJECT_REF = "ccawzrrkxuirrwvaecvw";
const PROJECT_HOST = `${PROJECT_REF}.supabase.co`;
const GENERATOR_VERSION = "wct-review-v2" as const;
const PRENOVICE_BOOK_ID = "4a71e072-96de-4722-8874-c35b3ca97ec1";
const NOVICE_BOOK_ID = "c4ab0760-3c31-4533-9631-0e2ead3bfe90";
const TARGET_BOOK_IDS = [PRENOVICE_BOOK_ID, NOVICE_BOOK_ID] as const;
const TARGET_DAY_NUMBERS = new Map<string, readonly number[]>([
  [PRENOVICE_BOOK_ID, Array.from({ length: 16 }, (_item, index) => index + 1)],
  [NOVICE_BOOK_ID, [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
    27, 28, 29, 30, 31
  ]]
]);

export type WctV2SourceCorrection = {
  bookId: string;
  dayId: string;
  patternId: string;
  exampleId: string;
  oldEnglishText: string;
  newEnglishText: string;
  oldMeaningKo: string;
  newMeaningKo: string;
};

export const WCT_V2_SOURCE_CORRECTIONS: readonly WctV2SourceCorrection[] = [
  {
    bookId: PRENOVICE_BOOK_ID,
    dayId: "e8e5db91-bbfc-47a0-8099-f5ec5cff4811",
    patternId: "e69bea89-5281-4c06-ae52-1586e540ccd7",
    exampleId: "80c15412-b4a4-4518-8e4e-097166547134",
    oldEnglishText: "I want a cup of beer.",
    newEnglishText: "I want a glass of beer.",
    oldMeaningKo: "나는 맥주 한 잔을 원한다.",
    newMeaningKo: "나는 맥주 한 잔을 원한다."
  },
  {
    bookId: NOVICE_BOOK_ID,
    dayId: "2ce7ef73-5d80-4fe7-8817-c89e3cac9e56",
    patternId: "557eee5b-879f-44dc-ac63-a2e495638139",
    exampleId: "37ff0120-8494-4377-b64e-a83d70bdfda0",
    oldEnglishText: "The weather is depressing.",
    newEnglishText: "The weather is depressing.",
    oldMeaningKo: "그 날씨는 우울하게 해요.",
    newMeaningKo: "그 날씨는 사람을 우울하게 만들어요."
  },
  {
    bookId: NOVICE_BOOK_ID,
    dayId: "46ce66c2-ef77-45e0-8cd5-6b65d8140d62",
    patternId: "9b5e0d86-b351-4273-90e3-05feb8962a88",
    exampleId: "5aebbaaa-e258-4139-b4dd-7cfc1211cec0",
    oldEnglishText: "I heard about you a lot.",
    newEnglishText: "I've heard a lot about you.",
    oldMeaningKo: "당신에 관해 많이 들었어요.",
    newMeaningKo: "당신에 관해 많이 들었어요."
  },
  {
    bookId: NOVICE_BOOK_ID,
    dayId: "a4cfd9cb-2356-4e8d-844b-704204424d05",
    patternId: "83e1401a-1d72-4eca-8957-a9e0c0ceb5bf",
    exampleId: "763e2bbe-40da-41aa-b58b-86b9744a8c6a",
    oldEnglishText: "If I was you, I wouldn't date him.",
    newEnglishText: "If I were you, I wouldn't date him.",
    oldMeaningKo: "내가 너라면 그와 사귀지 않을 거예요.",
    newMeaningKo: "내가 너라면 그와 사귀지 않을 거예요."
  },
  {
    bookId: NOVICE_BOOK_ID,
    dayId: "a4cfd9cb-2356-4e8d-844b-704204424d05",
    patternId: "83e1401a-1d72-4eca-8957-a9e0c0ceb5bf",
    exampleId: "d8ba0f89-5d79-4435-8597-723d4f1a59b5",
    oldEnglishText: "If I was a bird, I would fly in the sky.",
    newEnglishText: "If I were a bird, I would fly in the sky.",
    oldMeaningKo: "내가 새라면 하늘을 날 텐데요.",
    newMeaningKo: "내가 새라면 하늘을 날 텐데요."
  },
  {
    bookId: NOVICE_BOOK_ID,
    dayId: "d4f98cf6-124d-45af-bd51-154705280896",
    patternId: "311f0464-a282-4a08-9f0e-119af0a16dbd",
    exampleId: "c4b5112c-47b9-4e5a-9224-e59a7b58ae7a",
    oldEnglishText: "I want you to be with me.",
    newEnglishText: "I want you to be with me.",
    oldMeaningKo: "당신이 나와 함께 있기를 원해요.",
    newMeaningKo: "나는 당신이 나와 함께 있기를 원해요."
  },
  {
    bookId: NOVICE_BOOK_ID,
    dayId: "774c1597-2faf-48d5-b86b-1e7a8bd3ef7b",
    patternId: "e65a26dc-86e9-4c9b-99ae-ddf44fea108f",
    exampleId: "d4c92579-2365-4398-8362-cd7483ed22f0",
    oldEnglishText: "Being rich is good.",
    newEnglishText: "Being rich is good.",
    oldMeaningKo: "부자가 되는 것은 좋아요.",
    newMeaningKo: "부자인 것은 좋아요."
  },
  {
    bookId: NOVICE_BOOK_ID,
    dayId: "774c1597-2faf-48d5-b86b-1e7a8bd3ef7b",
    patternId: "e65a26dc-86e9-4c9b-99ae-ddf44fea108f",
    exampleId: "1fe994a0-225a-4970-ac7c-57fb7d2fe045",
    oldEnglishText: "To study is good for your future.",
    newEnglishText: "To study is good for your future.",
    oldMeaningKo: "공부하는 것은 미래에 좋아요.",
    newMeaningKo: "공부하는 것은 미래에 도움이 돼요."
  }
];

export const CHECKPOINT_B_MIGRATION =
  "supabase/migrations/20260805130000_replace_wct_standard_quizzes_v2.sql";

type HostedCommand = "audit" | "generate" | "verify";
type LocalCommand = "approve" | "fixture";
export type WctV2CommandName = HostedCommand | LocalCommand;

export type WctV2QuestionArtifact = {
  schemaVersion: "wct-quiz-v2-question-artifact-v2";
  projectRef: typeof PROJECT_REF;
  generatorVersion: typeof GENERATOR_VERSION;
  generatedAt: string;
  sourceCorrectionManifest: WctV2SourceCorrection[];
  sourceCorrectionManifestHash: string;
  preSourceInventoryHash: string;
  postSourceInventoryHash: string;
  questionArtifactHash: string;
  premiumSetSnapshotHash: string;
  targetV1SetSnapshotHash: string;
  targetBooks: Array<{
    id: string;
    ownerId: string;
    title: string;
    level: "prenovice" | "novice";
    dayCount: number;
  }>;
  summary: {
    books: number;
    days: number;
    questions: number;
    prenoviceTrue: number;
    prenoviceFalse: number;
    noviceTrue: number;
    noviceFalse: number;
  };
  failures: WctStandardAuditFailure[];
  sourceInventory: unknown[];
  premiumSetSnapshot: PremiumSetSnapshotRow[];
  targetV1SetSnapshot: TargetV1SetSnapshotRow[];
  sets: WctV2ArtifactSet[];
  rows: WctStandardAuditRow[] | unknown[];
};

export type WctV2ApprovalManifest = {
  schemaVersion: "wct-quiz-v2-approval-v2";
  approved: boolean;
  reviewer: string;
  reviewedRows: number;
  approvedAt: string;
  generatorVersion: typeof GENERATOR_VERSION;
  sourceCorrectionManifestHash: string;
  preSourceInventoryHash: string;
  postSourceInventoryHash: string;
  questionArtifactHash: string;
  premiumSetSnapshotHash: string;
  targetV1SetSnapshotHash: string;
  approvalMetadataHash: string;
  releaseEnvelopeHash: string;
};

type WctV2ArtifactSet = {
  bookId: string;
  level: "prenovice" | "novice";
  dayNumber: number;
  lessonKey: string;
  sourceId: string;
  sourceHash: string;
  questions: WctQuizQuestion[];
};

type PremiumSetSnapshotRow = {
  id: string;
  ownerId: string;
  lessonKey: string;
  sourceKind: "wct_premium";
  sourceId: string;
  generatorVersion: string;
  sourceHash: string;
  questions: unknown;
};

type TargetV1SetSnapshotRow = {
  id: string;
  ownerId: string;
  bookId: string;
  dayNumber: number;
  lessonKey: string;
  sourceKind: "wct_day";
  sourceId: string;
  generatorVersion: "wct-review-v1";
  sourceHash: string;
  questions: WctQuizQuestion[];
};

type Row = Record<string, unknown>;
type ReleaseBook = Omit<WctBook, "days"> & {
  ownerId: string;
  days: WctDay[];
};

export type ParsedCommand =
  | { command: "audit"; json: string; markdown: string }
  | { command: "approve"; artifact: string; reviewer: string; output: string }
  | { command: "generate"; artifact: string; approval: string; output: string }
  | { command: "fixture"; artifact: string; approval: string; output: string }
  | { command: "verify"; artifact: string };

export function wctV2QuizUsage() {
  return `Usage: generate-wct-quiz-v2.ts <audit|approve|generate|fixture|verify> [options]

Hosted target:
  audit, generate, and verify read main/production only
  ${ENV_FILE} -> ${PROJECT_HOST}

Local-only:
  approve and fixture read and write only explicitly named local files`;
}

export function commandUsesHostedReads(command: WctV2CommandName) {
  return command === "audit" || command === "generate" || command === "verify";
}

function option(
  args: readonly string[],
  name: string,
  required = true
) {
  const index = args.indexOf(name);
  const value = index === -1 ? null : args[index + 1] ?? null;
  if (required && (!value || value.startsWith("--"))) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function rejectUnknownOptions(
  args: readonly string[],
  valueOptions: readonly string[],
  flags: readonly string[] = []
) {
  const allowed = new Set([...valueOptions, ...flags]);
  for (let index = 1; index < args.length; index += 1) {
    const argument = args[index];
    if (!argument.startsWith("--")) continue;
    if (!allowed.has(argument)) throw new Error(`Unknown option: ${argument}`);
    if (valueOptions.includes(argument)) index += 1;
  }
}

function normalizedPath(value: string) {
  return value.replaceAll("\\", "/").replace(/^\.\//u, "");
}

function isMigrationPath(value: string) {
  const resolved = path.resolve(ROOT, normalizedPath(value)).replaceAll("\\", "/");
  return /(?:^|\/)supabase\/migrations(?:\/|$)/u.test(resolved);
}

function samePath(left: string, right: string) {
  return path.resolve(ROOT, left) === path.resolve(ROOT, right);
}

function assertLocalOutput(command: "audit" | "approve" | "fixture", output: string) {
  if (isMigrationPath(output)) {
    throw new Error(`WCT v2 ${command} output must stay outside supabase/migrations`);
  }
}

function assertDifferentPaths(label: string, inputs: readonly string[], outputs: readonly string[]) {
  if (outputs.some((output, index) => (
    inputs.some((input) => samePath(input, output))
    || outputs.some((other, otherIndex) => otherIndex !== index && samePath(other, output))
  ))) {
    throw new Error(`WCT v2 ${label} input and output paths must differ`);
  }
}

function assertSafeMigrationOutput(command: WctV2CommandName, output: string) {
  const normalized = normalizedPath(output);
  if (command === "generate") {
    if (normalized !== CHECKPOINT_B_MIGRATION) {
      throw new Error("WCT v2 generate refuses to overwrite an applied migration");
    }
    assertNewOutputPath(output);
    return;
  }
}

function existingPathParts(absolutePath: string) {
  const root = path.parse(absolutePath).root;
  const parts = absolutePath.slice(root.length).split(path.sep).filter(Boolean);
  const existing: string[] = [];
  let current = root;
  for (const part of parts) {
    current = path.join(current, part);
    try {
      fs.lstatSync(current);
    } catch (error) {
      if (isRecord(error) && error.code === "ENOENT") break;
      throw error;
    }
    existing.push(current);
  }
  return existing;
}

export function assertNewOutputPath(filePath: string) {
  const absolute = path.resolve(ROOT, filePath);
  for (const existing of existingPathParts(absolute)) {
    if (fs.lstatSync(existing).isSymbolicLink()) {
      throw new Error(`WCT v2 output path contains a symlink: ${existing}`);
    }
  }
  if (fs.existsSync(absolute)) {
    throw new Error(`WCT v2 output already exists: ${filePath}`);
  }
}

export function parseV2QuizCommand(args: readonly string[]): ParsedCommand {
  const command = args[0];
  if (!command || !["audit", "approve", "generate", "fixture", "verify"].includes(command)) {
    throw new Error(wctV2QuizUsage());
  }
  if (command === "audit") {
    rejectUnknownOptions(args, ["--json", "--markdown"]);
    const parsed: ParsedCommand = {
      command,
      json: normalizedPath(option(args, "--json")!),
      markdown: normalizedPath(option(args, "--markdown")!)
    };
    assertLocalOutput(command, parsed.json);
    assertLocalOutput(command, parsed.markdown);
    assertDifferentPaths("audit", [], [parsed.json, parsed.markdown]);
    return parsed;
  }
  if (command === "approve") {
    rejectUnknownOptions(
      args,
      ["--artifact", "--reviewer", "--output"],
      ["--confirm-reviewed-220"]
    );
    const artifact = option(args, "--artifact");
    if (!args.includes("--confirm-reviewed-220")) {
      throw new Error("--confirm-reviewed-220 is required");
    }
    const parsed: ParsedCommand = {
      command,
      artifact: artifact!,
      reviewer: option(args, "--reviewer")!,
      output: normalizedPath(option(args, "--output")!)
    };
    assertLocalOutput(command, parsed.output);
    assertDifferentPaths("approve", [parsed.artifact], [parsed.output]);
    return parsed;
  }
  if (command === "generate") {
    rejectUnknownOptions(args, ["--artifact", "--approval", "--output"]);
    const parsed: ParsedCommand = {
      command,
      artifact: option(args, "--artifact")!,
      approval: option(args, "--approval")!,
      output: normalizedPath(option(args, "--output")!)
    };
    assertSafeMigrationOutput(command, parsed.output);
    assertDifferentPaths("generate", [parsed.artifact, parsed.approval], [parsed.output]);
    return parsed;
  }
  if (command === "fixture") {
    rejectUnknownOptions(args, ["--artifact", "--approval", "--output"]);
    const parsed: ParsedCommand = {
      command,
      artifact: option(args, "--artifact")!,
      approval: option(args, "--approval")!,
      output: normalizedPath(option(args, "--output")!)
    };
    assertLocalOutput(command, parsed.output);
    assertDifferentPaths("fixture", [parsed.artifact, parsed.approval], [parsed.output]);
    return parsed;
  }
  rejectUnknownOptions(args, ["--artifact"]);
  return { command: "verify", artifact: option(args, "--artifact")! };
}

function sha256(value: unknown) {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function isRecord(value: unknown): value is Row {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasExactSourceCorrectionManifest(
  manifest: readonly WctV2SourceCorrection[]
) {
  return manifest.length === 8
    && new Set(manifest.map((entry) => entry.exampleId)).size === 8
    && manifest.every((entry) => (
      isUuid(entry.bookId)
      && isUuid(entry.dayId)
      && isUuid(entry.patternId)
      && isUuid(entry.exampleId)
      && Number(entry.oldEnglishText !== entry.newEnglishText)
        + Number(entry.oldMeaningKo !== entry.newMeaningKo) === 1
    ))
    && stableStringify(manifest) === stableStringify(WCT_V2_SOURCE_CORRECTIONS);
}

export function projectWctV2SourceCorrections<
  T extends { id: string; days: WctDay[] }
>(books: readonly T[]): T[] {
  const targets = WCT_V2_SOURCE_CORRECTIONS.map((correction) => {
    const matchingBooks = books.filter((book) => book.id === correction.bookId);
    const matchingDays = matchingBooks.flatMap((book) => (
      book.days.filter((day) => day.id === correction.dayId)
    ));
    const matchingPatterns = matchingDays.flatMap((day) => (
      day.patterns.filter((pattern) => pattern.id === correction.patternId)
    ));
    const matchingExamples = matchingPatterns.flatMap((pattern) => (
      pattern.examples.filter((example) => example.id === correction.exampleId)
    ));
    if (matchingBooks.length !== 1
      || matchingDays.length !== 1
      || matchingPatterns.length !== 1
      || matchingExamples.length !== 1) {
      throw new Error("WCT v2 source correction requires the exact source parent graph");
    }
    const example = matchingExamples[0];
    if (example.englishText !== correction.oldEnglishText
      || example.meaningKo !== correction.oldMeaningKo) {
      throw new Error("WCT v2 source correction requires the exact old source preimage");
    }
    return correction;
  });

  const projected = structuredClone(books) as T[];
  for (const correction of targets) {
    const example = projected
      .find((book) => book.id === correction.bookId)!.days
      .find((day) => day.id === correction.dayId)!.patterns
      .find((pattern) => pattern.id === correction.patternId)!.examples
      .find((candidate) => candidate.id === correction.exampleId)!;
    example.englishText = correction.newEnglishText;
    example.meaningKo = correction.newMeaningKo;
  }
  return projected;
}

function assertWctV2SourceCorrectionPostimage<
  T extends { id: string; days: WctDay[] }
>(books: readonly T[]) {
  for (const correction of WCT_V2_SOURCE_CORRECTIONS) {
    const matchingBooks = books.filter((book) => book.id === correction.bookId);
    const matchingDays = matchingBooks.flatMap((book) => (
      book.days.filter((day) => day.id === correction.dayId)
    ));
    const matchingPatterns = matchingDays.flatMap((day) => (
      day.patterns.filter((pattern) => pattern.id === correction.patternId)
    ));
    const matchingExamples = matchingPatterns.flatMap((pattern) => (
      pattern.examples.filter((example) => example.id === correction.exampleId)
    ));
    if (matchingBooks.length !== 1
      || matchingDays.length !== 1
      || matchingPatterns.length !== 1
      || matchingExamples.length !== 1) {
      throw new Error("WCT v2 source correction requires the exact source parent graph");
    }
    const example = matchingExamples[0];
    if (example.englishText !== correction.newEnglishText
      || example.meaningKo !== correction.newMeaningKo) {
      throw new Error("WCT v2 source correction requires the exact new source postimage");
    }
  }
}

function projectPostSourceInventoryToPreimage(
  sourceInventory: readonly unknown[],
  manifest: readonly WctV2SourceCorrection[]
) {
  if (!hasExactSourceCorrectionManifest(manifest)) {
    throw new Error("WCT v2 source correction manifest mismatch");
  }
  const sourceRows = sourceInventory.filter(isRecord);
  const projected = structuredClone(sourceInventory);
  for (const correction of manifest) {
    const dayRows = sourceRows.filter((row) => row.domain === "full"
      && row.entity === "day"
      && row.bookId === correction.bookId
      && row.sourceId === correction.dayId);
    const patternRows = sourceRows.filter((row) => row.domain === "full"
      && row.entity === "pattern"
      && row.sourceId === correction.dayId
      && row.patternId === correction.patternId);
    const fullExamples = sourceRows.filter((row) => row.domain === "full"
      && row.entity === "example"
      && row.sourceId === correction.dayId
      && row.patternId === correction.patternId
      && row.exampleId === correction.exampleId);
    const eligibleExamples = sourceRows.filter((row) => row.domain === "eligible"
      && row.sourceId === correction.dayId
      && row.patternId === correction.patternId
      && row.exampleId === correction.exampleId);
    if (dayRows.length !== 1 || patternRows.length !== 1
      || fullExamples.length !== 1 || eligibleExamples.length !== 1) {
      throw new Error("WCT v2 source correction artifact parent graph mismatch");
    }
    if ([...fullExamples, ...eligibleExamples].some((row) => (
      row.englishText !== correction.newEnglishText
      || row.meaningKo !== correction.newMeaningKo
    ))) {
      throw new Error("WCT v2 source correction artifact postimage mismatch");
    }
    for (const row of projected) {
      if (!isRecord(row)
        || row.exampleId !== correction.exampleId
        || row.sourceId !== correction.dayId
        || row.patternId !== correction.patternId) continue;
      row.englishText = correction.oldEnglishText;
      row.meaningKo = correction.oldMeaningKo;
    }
  }
  return projected;
}

function releaseEnvelope(artifact: WctV2QuestionArtifact) {
  return {
    projectRef: artifact.projectRef,
    generatorVersion: artifact.generatorVersion,
    sourceCorrectionManifest: artifact.sourceCorrectionManifest,
    sourceCorrectionManifestHash: artifact.sourceCorrectionManifestHash,
    preSourceInventoryHash: artifact.preSourceInventoryHash,
    postSourceInventoryHash: artifact.postSourceInventoryHash,
    targetBooks: artifact.targetBooks,
    targetV1SetSnapshot: artifact.targetV1SetSnapshot,
    sets: artifact.sets
  };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(value);
}

function actualReleaseSummary(artifact: WctV2QuestionArtifact) {
  const truthCount = (level: "prenovice" | "novice", answer: "O" | "X") => (
    artifact.sets.filter((set) => set.level === level).filter((set) => (
      set.questions.some((question) => question.format === "true_false"
        && question.choices.find((choice) => choice.id === question.correctChoiceId)?.text === answer)
    )).length
  );
  return {
    books: new Set(artifact.sets.map((set) => set.bookId)).size,
    days: artifact.sets.length,
    questions: artifact.sets.reduce((total, set) => total + set.questions.length, 0),
    prenoviceTrue: truthCount("prenovice", "O"),
    prenoviceFalse: truthCount("prenovice", "X"),
    noviceTrue: truthCount("novice", "O"),
    noviceFalse: truthCount("novice", "X")
  };
}

function approvalMetadata(value: Pick<
  WctV2ApprovalManifest,
  "approved" | "reviewer" | "reviewedRows" | "approvedAt" | "generatorVersion"
>) {
  return {
    approved: value.approved,
    reviewer: value.reviewer,
    reviewedRows: value.reviewedRows,
    approvedAt: value.approvedAt,
    generatorVersion: value.generatorVersion
  };
}

function isCanonicalIsoTimestamp(value: string) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value;
}

function exactReleaseArtifact(artifact: WctV2QuestionArtifact) {
  let hasExactSourceTransition = false;
  if (Array.isArray(artifact.sourceCorrectionManifest)) {
    try {
      const preSourceInventory = projectPostSourceInventoryToPreimage(
        artifact.sourceInventory,
        artifact.sourceCorrectionManifest
      );
      hasExactSourceTransition = hasExactSourceCorrectionManifest(
        artifact.sourceCorrectionManifest
      )
        && artifact.sourceCorrectionManifestHash
          === sha256(artifact.sourceCorrectionManifest)
        && artifact.preSourceInventoryHash === sha256(preSourceInventory)
        && artifact.postSourceInventoryHash === sha256(artifact.sourceInventory)
        && artifact.preSourceInventoryHash !== artifact.postSourceInventoryHash;
    } catch {
      hasExactSourceTransition = false;
    }
  }
  const targetById = new Map(artifact.targetBooks.map((book) => [book.id, book]));
  const prenovice = targetById.get(PRENOVICE_BOOK_ID);
  const novice = targetById.get(NOVICE_BOOK_ID);
  const owners = new Set(artifact.targetBooks.map((book) => book.ownerId));
  const hasExactSetGraph = [...TARGET_DAY_NUMBERS].every(([bookId, dayNumbers]) => {
    const sets = artifact.sets
      .filter((set) => set.bookId === bookId)
      .sort((left, right) => left.dayNumber - right.dayNumber);
    return sets.length === dayNumbers.length && sets.every((set, index) => (
      set.dayNumber === dayNumbers[index]
      && set.level === (bookId === PRENOVICE_BOOK_ID ? "prenovice" : "novice")
    ));
  });
  const rowsByLesson = new Map<string, Array<{
    slotIndex: number;
    question: unknown;
    sourceId: string;
    sourceHash: string;
  }>>();
  for (const value of artifact.rows) {
    if (!isRecord(value) || !isRecord(value.sourceReference)
      || typeof value.sourceReference.lessonKey !== "string"
      || typeof value.sourceReference.sourceId !== "string"
      || typeof value.sourceReference.sourceHash !== "string"
      || typeof value.slotIndex !== "number"
      || !isRecord(value.question)) return false;
    const lessonRows = rowsByLesson.get(value.sourceReference.lessonKey) ?? [];
    lessonRows.push({
      slotIndex: value.slotIndex,
      question: value.question,
      sourceId: value.sourceReference.sourceId,
      sourceHash: value.sourceReference.sourceHash
    });
    rowsByLesson.set(value.sourceReference.lessonKey, lessonRows);
  }
  const setsMatchRows = artifact.sets.every((set) => {
    const lessonRows = rowsByLesson.get(set.lessonKey)?.sort((left, right) => (
      left.slotIndex - right.slotIndex
    ));
    return lessonRows?.length === 5
      && lessonRows.every((row) => (
        row.sourceId === set.sourceId && row.sourceHash === set.sourceHash
      ))
      && stableStringify(lessonRows.map((row) => row.question))
        === stableStringify(set.questions);
  });
  const setsAreSchemaValid = artifact.sets.every((set) => (
    wctStandardQuizSetCreateSchema.safeParse({
      lessonKey: set.lessonKey,
      sourceKind: "wct_day",
      sourceId: set.sourceId,
      generatorVersion: GENERATOR_VERSION,
      sourceHash: set.sourceHash,
      questions: set.questions
    }).success
  ));
  const v1ByLesson = new Map(artifact.targetV1SetSnapshot?.map((set) => [set.lessonKey, set]));
  const v1Ids = artifact.targetV1SetSnapshot?.map((set) => set.id) ?? [];
  const hasExactV1Graph = artifact.targetV1SetSnapshot?.length === 44
    && new Set(v1Ids).size === 44
    && artifact.sets.every((set) => {
      const legacy = v1ByLesson.get(set.lessonKey);
      const ownerId = targetById.get(set.bookId)?.ownerId;
      return Boolean(legacy
        && isUuid(legacy.id)
        && isUuid(legacy.ownerId)
        && isUuid(legacy.sourceId)
        && legacy.ownerId === ownerId
        && legacy.bookId === set.bookId
        && legacy.dayNumber === set.dayNumber
        && legacy.sourceKind === "wct_day"
        && legacy.sourceId === set.sourceId
        && legacy.generatorVersion === "wct-review-v1"
        && /^[0-9a-f]{64}$/u.test(legacy.sourceHash)
        && wctQuizSetCreateSchema.safeParse({
          lessonKey: legacy.lessonKey,
          sourceKind: legacy.sourceKind,
          sourceId: legacy.sourceId,
          generatorVersion: legacy.generatorVersion,
          sourceHash: legacy.sourceHash,
          questions: legacy.questions
        }).success);
    });
  const fullSource = sourceInventoryDomain(artifact, "full");
  const eligibleSource = sourceInventoryDomain(artifact, "eligible");
  const fullDays = fullSource.filter((row) => isRecord(row) && row.entity === "day");
  const fullPatterns = fullSource.filter((row) => isRecord(row) && row.entity === "pattern");
  const fullExamples = fullSource.filter((row) => isRecord(row) && row.entity === "example");
  const sourceIds = new Set(artifact.sets.map((set) => set.sourceId));
  const eligibleSourceKeys = [
    "dayNumber", "domain", "englishText", "exampleId", "lessonKey", "level",
    "meaningKo", "patternId", "patternMeaningKo", "patternText", "sourceId",
    "topic", "usageNote"
  ];
  const hasExplicitSourceDomains = fullDays.length === 44
    && fullPatterns.length > 0
    && fullExamples.length > 0
    && eligibleSource.length > 0
    && new Set(fullDays.map((row) => String(row.sourceId))).size === 44
    && fullDays.every((row) => sourceIds.has(String(row.sourceId))
      && isUuid(String(row.sourceId))
      && typeof row.sourceNeedsReview === "boolean")
    && fullPatterns.every((row) => sourceIds.has(String(row.sourceId))
      && isUuid(String(row.patternId))
      && typeof row.sortOrder === "number"
      && typeof row.sourceNeedsReview === "boolean")
    && fullExamples.every((row) => sourceIds.has(String(row.sourceId))
      && isUuid(String(row.patternId))
      && isUuid(String(row.exampleId))
      && typeof row.sortOrder === "number"
      && typeof row.sourceNeedsReview === "boolean")
    && eligibleSource.every((row) => stableStringify(Object.keys(row).sort())
      === stableStringify(eligibleSourceKeys)
      && sourceIds.has(String(row.sourceId))
      && isUuid(String(row.patternId))
      && isUuid(String(row.exampleId)));
  const hasValidPremiumSnapshot = artifact.premiumSetSnapshot.length > 0
    && artifact.premiumSetSnapshot.every((set) => isUuid(set.id)
      && isUuid(set.ownerId)
      && set.ownerId === artifact.targetBooks[0]?.ownerId
      && /^[0-9a-f]{64}$/u.test(set.sourceHash)
      && wctQuizSetCreateSchema.safeParse({
        lessonKey: set.lessonKey,
        sourceKind: set.sourceKind,
        sourceId: set.sourceId,
        generatorVersion: set.generatorVersion,
        sourceHash: set.sourceHash,
        questions: set.questions
      }).success);
  return artifact.schemaVersion === "wct-quiz-v2-question-artifact-v2"
    && artifact.generatorVersion === GENERATOR_VERSION
    && artifact.projectRef === PROJECT_REF
    && artifact.summary.books === 2
    && artifact.summary.days === 44
    && artifact.summary.questions === 220
    && stableStringify(artifact.summary) === stableStringify(actualReleaseSummary(artifact))
    && artifact.targetBooks.length === 2
    && Boolean(prenovice && novice)
    && prenovice?.level === "prenovice"
    && prenovice.dayCount === 16
    && novice?.level === "novice"
    && novice.dayCount === 28
    && owners.size === 1
    && isUuid(artifact.targetBooks[0]?.ownerId ?? "")
    && artifact.sets.every((set) => isUuid(set.sourceId))
    && artifact.sets.length === 44
    && hasExactSetGraph
    && setsAreSchemaValid
    && hasExactV1Graph
    && hasExplicitSourceDomains
    && hasExactSourceTransition
    && hasValidPremiumSnapshot
    && setsMatchRows
    && artifact.rows.length === 220
    && artifact.failures.length === 0
    && artifact.questionArtifactHash === sha256(artifact.rows)
    && artifact.premiumSetSnapshotHash === sha256(artifact.premiumSetSnapshot)
    && artifact.targetV1SetSnapshotHash === sha256(artifact.targetV1SetSnapshot);
}

export function buildApprovalManifest(
  artifact: WctV2QuestionArtifact,
  reviewer: string,
  approvedAt = new Date().toISOString()
): WctV2ApprovalManifest {
  if (!reviewer.trim()) throw new Error("WCT v2 reviewer is required");
  if (!isCanonicalIsoTimestamp(approvedAt)) {
    throw new Error("WCT v2 approvedAt must be a canonical ISO timestamp");
  }
  if (!exactReleaseArtifact(artifact)) {
    throw new Error(
      "WCT v2 approval requires exactly 44 sets, 220 reviewed rows, and zero failures"
    );
  }
  const manifest = {
    schemaVersion: "wct-quiz-v2-approval-v2",
    approved: true,
    reviewer: reviewer.trim(),
    reviewedRows: 220,
    approvedAt,
    generatorVersion: artifact.generatorVersion,
    sourceCorrectionManifestHash: artifact.sourceCorrectionManifestHash,
    preSourceInventoryHash: artifact.preSourceInventoryHash,
    postSourceInventoryHash: artifact.postSourceInventoryHash,
    questionArtifactHash: artifact.questionArtifactHash,
    premiumSetSnapshotHash: artifact.premiumSetSnapshotHash,
    targetV1SetSnapshotHash: artifact.targetV1SetSnapshotHash,
    releaseEnvelopeHash: sha256(releaseEnvelope(artifact))
  } satisfies Omit<WctV2ApprovalManifest, "approvalMetadataHash">;
  return {
    ...manifest,
    approvalMetadataHash: sha256(approvalMetadata(manifest))
  };
}

export function verifyApprovalManifest(
  artifact: WctV2QuestionArtifact,
  approval: WctV2ApprovalManifest | null
) {
  if (!approval
    || approval.schemaVersion !== "wct-quiz-v2-approval-v2"
    || approval.approved !== true
    || approval.reviewedRows !== 220
    || !approval.reviewer?.trim()
    || !isCanonicalIsoTimestamp(approval.approvedAt)) {
    throw new Error("WCT v2 approval is missing or false");
  }
  if (!exactReleaseArtifact(artifact)
    || approval.generatorVersion !== artifact.generatorVersion
    || approval.sourceCorrectionManifestHash !== artifact.sourceCorrectionManifestHash
    || approval.preSourceInventoryHash !== artifact.preSourceInventoryHash
    || approval.postSourceInventoryHash !== artifact.postSourceInventoryHash
    || approval.questionArtifactHash !== artifact.questionArtifactHash
    || approval.premiumSetSnapshotHash !== artifact.premiumSetSnapshotHash
    || approval.targetV1SetSnapshotHash !== artifact.targetV1SetSnapshotHash
    || approval.approvalMetadataHash !== sha256(approvalMetadata(approval))
    || approval.releaseEnvelopeHash !== sha256(releaseEnvelope(artifact))) {
    throw new Error("WCT v2 approval hash mismatch");
  }
}

export function verifyMainProjectEnvironment(
  values: Record<string, string | undefined>
) {
  const url = values.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error(`${ENV_FILE} is missing NEXT_PUBLIC_SUPABASE_URL`);
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error(`${ENV_FILE} has an invalid NEXT_PUBLIC_SUPABASE_URL`);
  }
  const host = parsedUrl.hostname;
  if (host !== PROJECT_HOST) {
    throw new Error(`${ENV_FILE} points to ${host}, expected ${PROJECT_HOST}`);
  }
  if (parsedUrl.protocol !== "https:"
    || parsedUrl.port !== ""
    || parsedUrl.username !== ""
    || parsedUrl.password !== ""
    || parsedUrl.origin !== `https://${PROJECT_HOST}`) {
    throw new Error(`${ENV_FILE} must use the exact HTTPS main/production origin`);
  }
  if (!values.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(`${ENV_FILE} is missing SUPABASE_SERVICE_ROLE_KEY`);
  }
  return { projectRef: PROJECT_REF, host };
}

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing env file: ${ENV_FILE}`);
  const values: Record<string, string> = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 0) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if ((value.startsWith("\"") && value.endsWith("\""))
      || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

function createReadOnlyHostedClient() {
  const values = loadEnvFile(path.join(ROOT, ENV_FILE));
  const verified = verifyMainProjectEnvironment(values);
  const url = values.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = values.SUPABASE_SERVICE_ROLE_KEY!;
  return {
    ...verified,
    client: createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  };
}

function rows(value: unknown): Row[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function nullableString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function nullableNumber(value: unknown) {
  return typeof value === "number" ? value : null;
}

function mapDay(row: Row): WctDay {
  const patterns = rows(row.wct_patterns)
    .map((pattern) => ({
      id: String(pattern.id),
      patternText: String(pattern.pattern_text),
      meaningKo: nullableString(pattern.meaning_ko),
      usageNote: nullableString(pattern.usage_note),
      usageSource: String(pattern.usage_source) as WctSourceKind,
      sourcePage: nullableNumber(pattern.source_page),
      sourceNeedsReview: Boolean(pattern.source_needs_review),
      sortOrder: Number(pattern.sort_order ?? 0),
      examples: rows(pattern.wct_examples)
        .map((example) => ({
          id: String(example.id),
          englishText: String(example.english_text),
          meaningKo: nullableString(example.meaning_ko),
          sourcePage: nullableNumber(example.source_page),
          sourceNeedsReview: Boolean(example.source_needs_review),
          sortOrder: Number(example.sort_order ?? 0)
        }))
        .sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id))
    }))
    .sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id));
  const dayNumber = Number(row.day_number);
  const shortLabel = String(row.short_label);
  return {
    id: String(row.id),
    bookId: String(row.book_id),
    dayNumber,
    shortLabel,
    displayLabel: `Day ${dayNumber} (${shortLabel})`,
    sourcePageStart: nullableNumber(row.source_page_start),
    sourcePageEnd: nullableNumber(row.source_page_end),
    sourceNeedsReview: Boolean(row.source_needs_review),
    learningSummary: nullableString(row.learning_summary),
    concepts: [],
    patterns,
    importantNotes: [],
    practicePrompts: []
  };
}

function mapBook(row: Row): ReleaseBook {
  const days = rows(row.wct_days)
    .map(mapDay)
    .sort((left, right) => left.dayNumber - right.dayNumber || left.id.localeCompare(right.id));
  return {
    id: String(row.id),
    ownerId: String(row.owner_id),
    title: String(row.title),
    levelLabel: nullableString(row.level_label),
    dayCount: days.length,
    sortOrder: Number(row.sort_order ?? 0),
    days
  };
}

function hasPendingReview(bookRows: readonly Row[]) {
  return bookRows.some((book) => rows(book.wct_days).some((day) => (
    Boolean(day.source_needs_review)
    || rows(day.wct_patterns).some((pattern) => (
      Boolean(pattern.source_needs_review)
      || rows(pattern.wct_examples).some((example) => Boolean(example.source_needs_review))
    ))
  )));
}

async function readTargetBooks(client: SupabaseClient) {
  const { data, error } = await client
    .from("wct_books")
    .select(`
      id,owner_id,title,level_label,sort_order,
      wct_days(
        id,book_id,day_number,short_label,learning_summary,
        source_page_start,source_page_end,source_needs_review,
        wct_patterns(
          id,pattern_text,meaning_ko,usage_note,usage_source,
          source_page,source_needs_review,sort_order,
          wct_examples(
            id,english_text,meaning_ko,source_page,source_needs_review,sort_order
          )
        )
      )
    `)
    .in("id", [...TARGET_BOOK_IDS]);
  if (error) throw new Error(`WCT v2 source read failed: ${error.message}`);
  const bookRows = rows(data);
  if (bookRows.length !== 2 || hasPendingReview(bookRows)) {
    throw new Error("WCT v2 requires two exact books with no pending-review content");
  }
  const books = bookRows.map(mapBook).sort((left, right) => (
    TARGET_BOOK_IDS.indexOf(left.id as (typeof TARGET_BOOK_IDS)[number])
    - TARGET_BOOK_IDS.indexOf(right.id as (typeof TARGET_BOOK_IDS)[number])
  ));
  const byId = new Map(books.map((book) => [book.id, book]));
  const prenovice = byId.get(PRENOVICE_BOOK_ID);
  const novice = byId.get(NOVICE_BOOK_ID);
  if (!prenovice || !novice
    || normalizeWctIdentity(prenovice.title) !== "wct prenovice"
    || normalizeWctIdentity(prenovice.levelLabel ?? "") !== "pre novice"
    || normalizeWctIdentity(novice.title) !== "wct novice"
    || normalizeWctIdentity(novice.levelLabel ?? "") !== "novice"
    || prenovice.days.length !== 16
    || novice.days.length !== 28
    || new Set(books.map((book) => book.ownerId)).size !== 1) {
    throw new Error("WCT v2 source inventory does not match the exact 16/28 production books");
  }
  return books;
}

async function readPremiumSetSnapshot(client: SupabaseClient, ownerId: string) {
  const { data, error } = await client
    .from("wct_quiz_sets")
    .select("id,owner_id,lesson_key,source_kind,source_id,generator_version,source_hash,questions")
    .eq("owner_id", ownerId)
    .eq("source_kind", "wct_premium");
  if (error) throw new Error(`WCT v2 Premium snapshot read failed: ${error.message}`);
  const snapshot = rows(data).map((row): PremiumSetSnapshotRow => ({
    id: String(row.id),
    ownerId: String(row.owner_id),
    lessonKey: String(row.lesson_key),
    sourceKind: "wct_premium",
    sourceId: String(row.source_id),
    generatorVersion: String(row.generator_version),
    sourceHash: String(row.source_hash),
    questions: row.questions
  })).sort((left, right) => left.lessonKey.localeCompare(right.lessonKey) || left.id.localeCompare(right.id));
  if (snapshot.length === 0
    || snapshot.some((row) => row.generatorVersion !== "wct-review-v1")) {
    throw new Error("WCT v2 requires an unchanged Premium v1 set snapshot");
  }
  return snapshot;
}

async function readTargetV1SetSnapshot(
  client: SupabaseClient,
  books: readonly ReleaseBook[]
) {
  const ownerId = books[0]?.ownerId;
  const dayGraph = new Map(books.flatMap((book) => book.days.map((day) => [
    day.id,
    { bookId: book.id, dayNumber: day.dayNumber }
  ] as const)));
  const { data, error } = await client
    .from("wct_quiz_sets")
    .select("id,owner_id,lesson_key,source_kind,source_id,generator_version,source_hash,questions")
    .eq("owner_id", ownerId)
    .eq("source_kind", "wct_day")
    .in("source_id", [...dayGraph.keys()]);
  if (error) throw new Error(`WCT v2 legacy target snapshot read failed: ${error.message}`);
  const snapshot = rows(data).map((row): TargetV1SetSnapshotRow => {
    const sourceId = String(row.source_id);
    const day = dayGraph.get(sourceId);
    return {
      id: String(row.id),
      ownerId: String(row.owner_id),
      bookId: day?.bookId ?? "",
      dayNumber: day?.dayNumber ?? 0,
      lessonKey: String(row.lesson_key),
      sourceKind: "wct_day",
      sourceId,
      generatorVersion: String(row.generator_version) as "wct-review-v1",
      sourceHash: String(row.source_hash),
      questions: Array.isArray(row.questions) ? row.questions as WctQuizQuestion[] : []
    };
  }).sort((left, right) => (
    TARGET_BOOK_IDS.indexOf(left.bookId as (typeof TARGET_BOOK_IDS)[number])
      - TARGET_BOOK_IDS.indexOf(right.bookId as (typeof TARGET_BOOK_IDS)[number])
    || left.dayNumber - right.dayNumber
    || left.lessonKey.localeCompare(right.lessonKey)
    || left.id.localeCompare(right.id)
  ));
  if (snapshot.length !== 44
    || snapshot.some((row) => row.generatorVersion !== "wct-review-v1")) {
    throw new Error("WCT v2 requires the exact 44-set legacy v1 target snapshot");
  }
  return snapshot;
}

function generatedSets(books: readonly WctGeneratedStandardQuizBook[]) {
  return books.flatMap((book) => book.sets.map((set): WctV2ArtifactSet => ({
    bookId: book.bookId,
    level: book.level,
    dayNumber: set.source.dayNumber,
    lessonKey: set.draft.lessonKey,
    sourceId: set.draft.sourceId,
    sourceHash: set.draft.sourceHash,
    questions: set.draft.questions
  })));
}

function releaseSourceInventory(
  books: readonly ReleaseBook[],
  eligibleRows: readonly unknown[]
) {
  const full = books.flatMap((book, bookIndex) => book.days.flatMap((day) => [
    {
      domain: "full",
      entity: "day",
      bookId: book.id,
      level: bookIndex === 0 ? "prenovice" : "novice",
      bookTitle: book.title,
      bookLevelLabel: book.levelLabel,
      bookSortOrder: book.sortOrder,
      dayNumber: day.dayNumber,
      lessonKey: standardWctLessonKey(book.title, day.dayNumber),
      sourceId: day.id,
      shortLabel: day.shortLabel,
      learningSummary: day.learningSummary,
      sourcePageStart: day.sourcePageStart,
      sourcePageEnd: day.sourcePageEnd,
      sourceNeedsReview: day.sourceNeedsReview
    },
    ...day.patterns.flatMap((pattern) => [
      {
        domain: "full",
        entity: "pattern",
        sourceId: day.id,
        patternId: pattern.id,
        patternText: pattern.patternText,
        patternMeaningKo: pattern.meaningKo,
        usageNote: pattern.usageNote,
        usageSource: pattern.usageSource,
        sourcePage: pattern.sourcePage,
        sourceNeedsReview: pattern.sourceNeedsReview,
        sortOrder: pattern.sortOrder
      },
      ...pattern.examples.map((example) => ({
        domain: "full",
        entity: "example",
        sourceId: day.id,
        patternId: pattern.id,
        exampleId: example.id,
        englishText: example.englishText,
        meaningKo: example.meaningKo,
        sourcePage: example.sourcePage,
        sourceNeedsReview: example.sourceNeedsReview,
        sortOrder: example.sortOrder
      }))
    ])
  ]));
  const eligible = eligibleRows.filter(isRecord).map((row) => ({
    domain: "eligible",
    level: row.level,
    dayNumber: row.dayNumber,
    lessonKey: row.lessonKey,
    sourceId: row.sourceId,
    topic: row.topic,
    patternId: row.patternId,
    exampleId: row.exampleId,
    patternText: row.patternText,
    patternMeaningKo: row.patternMeaningKo,
    usageNote: row.usageNote,
    englishText: row.englishText,
    meaningKo: row.meaningKo
  }));
  return [...full, ...eligible];
}

async function buildLiveArtifact(client: SupabaseClient): Promise<WctV2QuestionArtifact> {
  const liveBooks = await readTargetBooks(client);
  const books = projectWctV2SourceCorrections(liveBooks);
  const generated = books.map((book) => generateStandardWctQuizBook(book, book.days));
  const audit = auditStandardWctQuizInventory(generated);
  const premiumSetSnapshot = await readPremiumSetSnapshot(client, books[0].ownerId);
  const targetV1SetSnapshot = await readTargetV1SetSnapshot(client, liveBooks);
  const sourceInventory = releaseSourceInventory(books, audit.sourceInventory);
  const sourceCorrectionManifest = WCT_V2_SOURCE_CORRECTIONS.map((entry) => ({
    ...entry
  }));
  const preSourceInventory = projectPostSourceInventoryToPreimage(
    sourceInventory,
    sourceCorrectionManifest
  );
  const artifact: WctV2QuestionArtifact = {
    schemaVersion: "wct-quiz-v2-question-artifact-v2",
    projectRef: PROJECT_REF,
    generatorVersion: GENERATOR_VERSION,
    generatedAt: new Date().toISOString(),
    sourceCorrectionManifest,
    sourceCorrectionManifestHash: sha256(sourceCorrectionManifest),
    preSourceInventoryHash: sha256(preSourceInventory),
    postSourceInventoryHash: sha256(sourceInventory),
    questionArtifactHash: audit.questionArtifactHash,
    premiumSetSnapshotHash: sha256(premiumSetSnapshot),
    targetV1SetSnapshotHash: sha256(targetV1SetSnapshot),
    targetBooks: books.map((book, index) => ({
      id: book.id,
      ownerId: book.ownerId,
      title: book.title,
      level: index === 0 ? "prenovice" : "novice",
      dayCount: book.days.length
    })),
    summary: audit.summary,
    failures: audit.failures,
    sourceInventory,
    premiumSetSnapshot,
    targetV1SetSnapshot,
    sets: generatedSets(generated),
    rows: audit.rows
  };
  if (!exactReleaseArtifact(artifact)) {
    throw new Error(
      `WCT v2 audit failed: sets=${artifact.sets.length} rows=${artifact.rows.length} failures=${artifact.failures.length}`
    );
  }
  return artifact;
}

export type WctV2PostApplyLiveState = Pick<
  WctV2QuestionArtifact,
  | "sourceCorrectionManifestHash"
  | "postSourceInventoryHash"
  | "questionArtifactHash"
  | "premiumSetSnapshotHash"
  | "targetBooks"
  | "sourceInventory"
  | "premiumSetSnapshot"
  | "sets"
  | "rows"
>;

async function buildPostApplyLiveState(
  client: SupabaseClient
): Promise<WctV2PostApplyLiveState> {
  const books = await readTargetBooks(client);
  assertWctV2SourceCorrectionPostimage(books);
  const generated = books.map((book) => generateStandardWctQuizBook(book, book.days));
  const audit = auditStandardWctQuizInventory(generated);
  const premiumSetSnapshot = await readPremiumSetSnapshot(client, books[0].ownerId);
  const sourceInventory = releaseSourceInventory(books, audit.sourceInventory);
  return {
    sourceCorrectionManifestHash: sha256(WCT_V2_SOURCE_CORRECTIONS),
    postSourceInventoryHash: sha256(sourceInventory),
    questionArtifactHash: audit.questionArtifactHash,
    premiumSetSnapshotHash: sha256(premiumSetSnapshot),
    targetBooks: books.map((book, index) => ({
      id: book.id,
      ownerId: book.ownerId,
      title: book.title,
      level: index === 0 ? "prenovice" : "novice",
      dayCount: book.days.length
    })),
    sourceInventory,
    premiumSetSnapshot,
    sets: generatedSets(generated),
    rows: audit.rows
  };
}

function markdownForArtifact(artifact: WctV2QuestionArtifact) {
  const auditRows = artifact.rows as WctStandardAuditRow[];
  const sections = auditRows.map((row, index) => {
    const choices = row.choices.map((choice) => (
      `- ${choice.text === row.correctAnswer ? "[correct]" : "[distractor]"} ${choice.text}`
    )).join("\n");
    const mutations = row.mutationEvidence.length === 0
      ? "- none (verbatim source or correct answer)"
      : row.mutationEvidence.map((mutation) => (
          `- ${mutation.ruleFamily}/${mutation.recipe}: `
          + `\`${mutation.changedFrom}\` → \`${mutation.changedTo}\` — ${mutation.reason}`
        )).join("\n");
    return `## ${index + 1}. ${row.level} Day ${row.dayNumber} · slot ${row.slotIndex + 1}

- topic: ${row.topic}
- format/kind: ${row.format} / ${row.kind}
- source: ${row.sourceSentence}
- pattern: ${row.pattern}
- prompt: ${row.prompt}
- correct answer: ${row.correctAnswer}
- explanation: ${row.question.explanation}
- feedback reason: ${row.reason}

Choices:
${choices}

Mutation evidence:
${mutations}`;
  });
  return `# WCT v2 question audit

- project: main/production ${artifact.projectRef}
- generator: ${artifact.generatorVersion}
- books/days/questions: ${artifact.summary.books}/${artifact.summary.days}/${artifact.summary.questions}
- source correction manifest hash: ${artifact.sourceCorrectionManifestHash}
- pre-correction source inventory hash: ${artifact.preSourceInventoryHash}
- post-correction source inventory hash: ${artifact.postSourceInventoryHash}
- question artifact hash: ${artifact.questionArtifactHash}
- Premium-set snapshot hash: ${artifact.premiumSetSnapshotHash}
- machine failures: ${artifact.failures.length}

${sections.join("\n\n---\n\n")}
`;
}

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(path.resolve(ROOT, filePath), "utf8"));
}

function readArtifact(filePath: string): WctV2QuestionArtifact {
  const value = readJson(filePath);
  if (!isRecord(value)
    || value.schemaVersion !== "wct-quiz-v2-question-artifact-v2") {
    throw new Error("Invalid WCT v2 question artifact");
  }
  const artifact = value as WctV2QuestionArtifact;
  if (!exactReleaseArtifact(artifact)) {
    throw new Error("Invalid WCT v2 question artifact");
  }
  return artifact;
}

function readApproval(filePath: string): WctV2ApprovalManifest | null {
  const value = readJson(filePath);
  return isRecord(value) ? value as WctV2ApprovalManifest : null;
}

export function writeRequestedFile(filePath: string, contents: string) {
  const safePath = normalizedPath(filePath);
  const absolute = path.resolve(ROOT, safePath);
  assertNewOutputPath(safePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  assertNewOutputPath(safePath);
  try {
    fs.writeFileSync(absolute, contents, { encoding: "utf8", flag: "wx" });
  } catch (error) {
    if (isRecord(error) && error.code === "EEXIST") {
      throw new Error(`WCT v2 output already exists: ${safePath}`);
    }
    throw error;
  }
}

function sqlLiteral(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

function syncPayload(artifact: WctV2QuestionArtifact) {
  return artifact.targetBooks.map((book) => ({
    bookId: book.id,
    sets: artifact.sets.filter((set) => set.bookId === book.id).map((set) => ({
      lessonKey: set.lessonKey,
      sourceKind: "wct_day",
      sourceId: set.sourceId,
      generatorVersion: GENERATOR_VERSION,
      sourceHash: set.sourceHash,
      questions: set.questions
    }))
  }));
}

function orderedTargetSets(artifact: WctV2QuestionArtifact) {
  return artifact.targetBooks.flatMap((book) => artifact.sets
    .filter((set) => set.bookId === book.id)
    .sort((left, right) => left.dayNumber - right.dayNumber));
}

function sourceInventoryDomain(
  artifact: WctV2QuestionArtifact,
  domain: "full" | "eligible"
) {
  return artifact.sourceInventory.filter(isRecord).filter((row) => row.domain === domain);
}

function expectedTargetBefore(artifact: WctV2QuestionArtifact) {
  return artifact.targetV1SetSnapshot;
}

function expectedTargetAfter(artifact: WctV2QuestionArtifact) {
  const legacyByLesson = new Map(artifact.targetV1SetSnapshot.map((set) => (
    [set.lessonKey, set] as const
  )));
  return orderedTargetSets(artifact).map((set) => ({
    id: legacyByLesson.get(set.lessonKey)?.id,
    ownerId: legacyByLesson.get(set.lessonKey)?.ownerId,
    bookId: set.bookId,
    dayNumber: set.dayNumber,
    lessonKey: set.lessonKey,
    sourceKind: "wct_day",
    sourceId: set.sourceId,
    generatorVersion: GENERATOR_VERSION,
    sourceHash: set.sourceHash,
    questions: set.questions
  }));
}

export function renderMigration(artifact: WctV2QuestionArtifact) {
  const ownerId = artifact.targetBooks[0]?.ownerId;
  const payload = syncPayload(artifact);
  const expectedBooks = artifact.targetBooks;
  const expectedSourceFullAfter = sourceInventoryDomain(artifact, "full");
  const expectedSourceEligibleAfter = sourceInventoryDomain(artifact, "eligible");
  const preSourceInventory = projectPostSourceInventoryToPreimage(
    artifact.sourceInventory,
    artifact.sourceCorrectionManifest
  );
  const expectedSourceFullBefore = preSourceInventory
    .filter(isRecord)
    .filter((row) => row.domain === "full");
  const expectedSourceEligibleBefore = preSourceInventory
    .filter(isRecord)
    .filter((row) => row.domain === "eligible");
  const expectedBefore = expectedTargetBefore(artifact);
  const expectedAfter = expectedTargetAfter(artifact);
  const expectedPremium = artifact.premiumSetSnapshot;
  const sourceCorrectionValues = artifact.sourceCorrectionManifest.map((correction) => (
    `(${sqlLiteral(correction.bookId)}::uuid, ${sqlLiteral(correction.dayId)}::uuid, `
    + `${sqlLiteral(correction.patternId)}::uuid, ${sqlLiteral(correction.exampleId)}::uuid, `
    + `${sqlLiteral(correction.oldEnglishText)}, ${sqlLiteral(correction.newEnglishText)}, `
    + `${sqlLiteral(correction.oldMeaningKo)}, ${sqlLiteral(correction.newMeaningKo)})`
  )).join(",\n    ");
  const body = `declare
  v_owner_id uuid := ${sqlLiteral(ownerId)}::uuid;
  v_payload jsonb := ${sqlLiteral(JSON.stringify(payload))}::jsonb;
  v_expected_books jsonb := ${sqlLiteral(JSON.stringify(expectedBooks))}::jsonb;
  v_source_corrections jsonb := ${sqlLiteral(JSON.stringify(artifact.sourceCorrectionManifest))}::jsonb;
  v_expected_source_full_before jsonb := ${sqlLiteral(JSON.stringify(expectedSourceFullBefore))}::jsonb;
  v_expected_source_full_after jsonb := ${sqlLiteral(JSON.stringify(expectedSourceFullAfter))}::jsonb;
  v_expected_source_eligible_before jsonb := ${sqlLiteral(JSON.stringify(expectedSourceEligibleBefore))}::jsonb;
  v_expected_source_eligible_after jsonb := ${sqlLiteral(JSON.stringify(expectedSourceEligibleAfter))}::jsonb;
  v_expected_target_before jsonb := ${sqlLiteral(JSON.stringify(expectedBefore))}::jsonb;
  v_expected_target_after jsonb := ${sqlLiteral(JSON.stringify(expectedAfter))}::jsonb;
  v_expected_premium jsonb := ${sqlLiteral(JSON.stringify(expectedPremium))}::jsonb;
  v_count integer;
  v_target_book_count integer;
  v_question_count integer;
  v_current_books jsonb;
  v_current_target_graph jsonb;
  v_target_set_ids_before jsonb;
  v_target_set_ids_after jsonb;
  v_source_full_before jsonb;
  v_source_full_after jsonb;
  v_source_eligible_before jsonb;
  v_source_eligible_after jsonb;
  v_premium_before jsonb;
  v_premium_after jsonb;
  v_premium_progress_before jsonb;
  v_premium_progress_after jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended(
    v_owner_id::text || ':' || ${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid::text, 0
  ));
  perform pg_advisory_xact_lock(hashtextextended(
    v_owner_id::text || ':' || ${sqlLiteral(NOVICE_BOOK_ID)}::uuid::text, 0
  ));

  lock table public.wct_books, public.wct_days, public.wct_patterns, public.wct_examples
  in share row exclusive mode;
  lock table public.wct_quiz_sets, public.wct_quiz_progress, public.wct_pop_quiz_progress
  in share row exclusive mode;

  select count(*)::integer
  into v_target_book_count
  from public.wct_books
  where id in (
    ${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid,
    ${sqlLiteral(NOVICE_BOOK_ID)}::uuid
  );

  if current_setting('app.wct_v2_allow_empty_fixture', true) = 'on'
    and v_target_book_count = 0 then
    return;
  end if;

  if v_target_book_count <> 2
    or (select count(*) from public.wct_books where id in (
      ${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid,
      ${sqlLiteral(NOVICE_BOOK_ID)}::uuid
    ) and owner_id = v_owner_id) <> 2 then
    raise exception 'WCT v2 exact target book inventory mismatch';
  end if;

  if (select count(*) from public.wct_days where book_id = ${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid) <> 16
    or (select count(*) from public.wct_days where book_id = ${sqlLiteral(NOVICE_BOOK_ID)}::uuid) <> 28 then
    raise exception 'WCT v2 exact 16/28 Day inventory mismatch';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', book.id::text,
    'ownerId', book.owner_id::text,
    'title', book.title,
    'level', case regexp_replace(lower(coalesce(book.level_label, '')), '[[:space:]]+', '', 'g')
      when 'prenovice' then 'prenovice'
      when 'novice' then 'novice'
      else regexp_replace(lower(coalesce(book.level_label, '')), '[[:space:]]+', '', 'g')
    end,
    'dayCount', (select count(*) from public.wct_days day where day.book_id = book.id)
  ) order by case book.id
    when ${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid then 0 else 1 end), '[]'::jsonb)
  into v_current_books
  from public.wct_books book
  where book.id in (
    ${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid,
    ${sqlLiteral(NOVICE_BOOK_ID)}::uuid
  );
  if v_current_books is distinct from v_expected_books then
    raise exception 'WCT v2 current target book metadata does not match approved release';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', quiz.id::text,
    'ownerId', quiz.owner_id::text,
    'bookId', day.book_id::text,
    'dayNumber', day.day_number,
    'lessonKey', quiz.lesson_key,
    'sourceKind', quiz.source_kind,
    'sourceId', quiz.source_id,
    'generatorVersion', quiz.generator_version,
    'sourceHash', quiz.source_hash,
    'questions', quiz.questions
  ) order by case day.book_id
    when ${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid then 0 else 1 end,
    day.day_number, quiz.lesson_key, quiz.id), '[]'::jsonb)
  into v_current_target_graph
  from public.wct_quiz_sets quiz
  join public.wct_days day on day.id::text = quiz.source_id
  where quiz.owner_id = v_owner_id
    and quiz.source_kind = 'wct_day'
    and day.book_id in (
      ${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid,
      ${sqlLiteral(NOVICE_BOOK_ID)}::uuid
    );
  if v_current_target_graph is distinct from v_expected_target_before then
    raise exception 'WCT v2 current target graph does not match exact 44-set v1 inventory';
  end if;

  select coalesce(jsonb_agg(quiz.id order by case day.book_id
    when ${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid then 0 else 1 end,
    day.day_number, quiz.lesson_key), '[]'::jsonb)
  into v_target_set_ids_before
  from public.wct_quiz_sets quiz
  join public.wct_days day on day.id::text = quiz.source_id
  where quiz.owner_id = v_owner_id
    and quiz.source_kind = 'wct_day'
    and day.book_id in (
      ${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid,
      ${sqlLiteral(NOVICE_BOOK_ID)}::uuid
    );

  select coalesce(jsonb_agg(source_row.payload order by
    source_row.book_order, source_row.day_number, source_row.pattern_sort_order,
    source_row.pattern_id, source_row.entity_order,
    source_row.example_sort_order, source_row.entity_id
  ), '[]'::jsonb)
  into v_source_full_before
  from (
    select case day.book_id when ${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid then 0 else 1 end as book_order,
      day.day_number, -2147483648 as pattern_sort_order, ''::text as pattern_id,
      0 as entity_order,
      -2147483648 as example_sort_order, day.id::text as entity_id,
      jsonb_build_object(
        'domain', 'full', 'entity', 'day', 'bookId', book.id::text,
        'level', case book.id when ${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid then 'prenovice' else 'novice' end,
        'bookTitle', book.title, 'bookLevelLabel', book.level_label,
        'bookSortOrder', book.sort_order, 'dayNumber', day.day_number,
        'lessonKey', quiz.lesson_key, 'sourceId', day.id::text,
        'shortLabel', day.short_label, 'learningSummary', day.learning_summary,
        'sourcePageStart', day.source_page_start,
        'sourcePageEnd', day.source_page_end, 'sourceNeedsReview', day.source_needs_review
      ) as payload
    from public.wct_books book
    join public.wct_days day on day.book_id = book.id
    join public.wct_quiz_sets quiz on quiz.source_id = day.id::text
      and quiz.owner_id = v_owner_id and quiz.source_kind = 'wct_day'
    where book.id in (${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid, ${sqlLiteral(NOVICE_BOOK_ID)}::uuid)
    union all
    select case day.book_id when ${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid then 0 else 1 end,
      day.day_number, pattern.sort_order, pattern.id::text, 0, -2147483648, pattern.id::text,
      jsonb_build_object(
        'domain', 'full', 'entity', 'pattern', 'sourceId', day.id::text,
        'patternId', pattern.id::text, 'patternText', pattern.pattern_text,
        'patternMeaningKo', pattern.meaning_ko, 'usageNote', pattern.usage_note,
        'usageSource', pattern.usage_source, 'sourcePage', pattern.source_page,
        'sourceNeedsReview', pattern.source_needs_review, 'sortOrder', pattern.sort_order
      )
    from public.wct_days day
    join public.wct_patterns pattern on pattern.day_id = day.id
    where day.book_id in (${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid, ${sqlLiteral(NOVICE_BOOK_ID)}::uuid)
    union all
    select case day.book_id when ${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid then 0 else 1 end,
      day.day_number, pattern.sort_order, pattern.id::text, 1, example.sort_order, example.id::text,
      jsonb_build_object(
        'domain', 'full', 'entity', 'example', 'sourceId', day.id::text,
        'patternId', pattern.id::text, 'exampleId', example.id::text,
        'englishText', example.english_text, 'meaningKo', example.meaning_ko,
        'sourcePage', example.source_page, 'sourceNeedsReview', example.source_needs_review,
        'sortOrder', example.sort_order
      )
    from public.wct_days day
    join public.wct_patterns pattern on pattern.day_id = day.id
    join public.wct_examples example on example.pattern_id = pattern.id
    where day.book_id in (${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid, ${sqlLiteral(NOVICE_BOOK_ID)}::uuid)
  ) source_row;

  select coalesce(jsonb_agg(jsonb_build_object(
    'domain', 'eligible',
    'level', expected.level,
    'dayNumber', day.day_number,
    'lessonKey', quiz.lesson_key,
    'sourceId', day.id::text,
    'topic', regexp_replace(btrim(day.short_label), '[[:space:]]+', ' ', 'g'),
    'patternId', pattern.id::text,
    'exampleId', example.id::text,
    'patternText', regexp_replace(btrim(pattern.pattern_text), '[[:space:]]+', ' ', 'g'),
    'patternMeaningKo', nullif(regexp_replace(btrim(coalesce(pattern.meaning_ko, '')), '[[:space:]]+', ' ', 'g'), ''),
    'usageNote', nullif(regexp_replace(btrim(coalesce(pattern.usage_note, '')), '[[:space:]]+', ' ', 'g'), ''),
    'englishText', regexp_replace(btrim(example.english_text), '[[:space:]]+', ' ', 'g'),
    'meaningKo', nullif(regexp_replace(btrim(coalesce(example.meaning_ko, '')), '[[:space:]]+', ' ', 'g'), '')
  ) order by case day.book_id when ${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid then 0 else 1 end,
    day.day_number, pattern.id::text, example.id::text), '[]'::jsonb)
  into v_source_eligible_before
  from jsonb_to_recordset(v_expected_source_eligible_before) as expected(
    level text, "patternId" text, "exampleId" text
  )
  join public.wct_patterns pattern on pattern.id::text = expected."patternId"
  join public.wct_examples example on example.id::text = expected."exampleId"
    and example.pattern_id = pattern.id
  join public.wct_days day on day.id = pattern.day_id
  join public.wct_quiz_sets quiz on quiz.source_id = day.id::text
    and quiz.owner_id = v_owner_id and quiz.source_kind = 'wct_day';
  if v_source_full_before is distinct from v_expected_source_full_before
    or v_source_eligible_before is distinct from v_expected_source_eligible_before then
    raise exception 'WCT v2 current source inventory does not match approved source';
  end if;

  select count(*)::integer
  into v_count
  from (values
    ${sourceCorrectionValues}
  ) as correction(
    "bookId", "dayId", "patternId", "exampleId",
    "oldEnglishText", "newEnglishText", "oldMeaningKo", "newMeaningKo"
  )
  join public.wct_days day on day.id = correction."dayId"
    and day.book_id = correction."bookId"
  join public.wct_patterns pattern on pattern.id = correction."patternId"
    and pattern.day_id = day.id
  join public.wct_examples example on example.id = correction."exampleId"
    and example.pattern_id = pattern.id
    and example.english_text is not distinct from correction."oldEnglishText"
    and example.meaning_ko is not distinct from correction."oldMeaningKo";
  if v_count <> 8 then
    raise exception 'WCT v2 source correction exact old source preimage or parent graph mismatch';
  end if;

  update public.wct_examples as example
  set english_text = case
      when correction."oldEnglishText" is distinct from correction."newEnglishText"
        then correction."newEnglishText"
      else example.english_text
    end,
    meaning_ko = case
      when correction."oldMeaningKo" is distinct from correction."newMeaningKo"
        then correction."newMeaningKo"
      else example.meaning_ko
    end
  from (values
    ${sourceCorrectionValues}
  ) as correction(
    "bookId", "dayId", "patternId", "exampleId",
    "oldEnglishText", "newEnglishText", "oldMeaningKo", "newMeaningKo"
  )
  join public.wct_patterns pattern on pattern.id = correction."patternId"
  join public.wct_days day on day.id = correction."dayId"
    and day.book_id = correction."bookId"
    and pattern.day_id = day.id
  where example.id = correction."exampleId"
    and example.pattern_id = pattern.id
    and example.english_text is not distinct from correction."oldEnglishText"
    and example.meaning_ko is not distinct from correction."oldMeaningKo";
  get diagnostics v_count = row_count;
  if v_count <> 8 then
    raise exception 'WCT v2 source correction did not update exactly eight rows';
  end if;

  if (
    select count(*)
    from jsonb_to_recordset(v_source_corrections) as correction(
      "bookId" uuid, "dayId" uuid, "patternId" uuid, "exampleId" uuid,
      "oldEnglishText" text, "newEnglishText" text,
      "oldMeaningKo" text, "newMeaningKo" text
    )
    join public.wct_days day on day.id = correction."dayId"
      and day.book_id = correction."bookId"
    join public.wct_patterns pattern on pattern.id = correction."patternId"
      and pattern.day_id = day.id
    join public.wct_examples example on example.id = correction."exampleId"
      and example.pattern_id = pattern.id
      and example.english_text is not distinct from correction."newEnglishText"
      and example.meaning_ko is not distinct from correction."newMeaningKo"
  ) <> 8 then
    raise exception 'WCT v2 source correction exact postimage mismatch';
  end if;

  select coalesce(jsonb_agg(source_row.payload order by
    source_row.book_order, source_row.day_number, source_row.pattern_sort_order,
    source_row.pattern_id, source_row.entity_order,
    source_row.example_sort_order, source_row.entity_id
  ), '[]'::jsonb)
  into v_source_full_after
  from (
    select case day.book_id when ${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid then 0 else 1 end as book_order,
      day.day_number, -2147483648 as pattern_sort_order, ''::text as pattern_id,
      0 as entity_order,
      -2147483648 as example_sort_order, day.id::text as entity_id,
      jsonb_build_object(
        'domain', 'full', 'entity', 'day', 'bookId', book.id::text,
        'level', case book.id when ${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid then 'prenovice' else 'novice' end,
        'bookTitle', book.title, 'bookLevelLabel', book.level_label,
        'bookSortOrder', book.sort_order, 'dayNumber', day.day_number,
        'lessonKey', quiz.lesson_key, 'sourceId', day.id::text,
        'shortLabel', day.short_label, 'learningSummary', day.learning_summary,
        'sourcePageStart', day.source_page_start,
        'sourcePageEnd', day.source_page_end, 'sourceNeedsReview', day.source_needs_review
      ) as payload
    from public.wct_books book
    join public.wct_days day on day.book_id = book.id
    join public.wct_quiz_sets quiz on quiz.source_id = day.id::text
      and quiz.owner_id = v_owner_id and quiz.source_kind = 'wct_day'
    where book.id in (${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid, ${sqlLiteral(NOVICE_BOOK_ID)}::uuid)
    union all
    select case day.book_id when ${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid then 0 else 1 end,
      day.day_number, pattern.sort_order, pattern.id::text, 0, -2147483648, pattern.id::text,
      jsonb_build_object(
        'domain', 'full', 'entity', 'pattern', 'sourceId', day.id::text,
        'patternId', pattern.id::text, 'patternText', pattern.pattern_text,
        'patternMeaningKo', pattern.meaning_ko, 'usageNote', pattern.usage_note,
        'usageSource', pattern.usage_source, 'sourcePage', pattern.source_page,
        'sourceNeedsReview', pattern.source_needs_review, 'sortOrder', pattern.sort_order
      )
    from public.wct_days day
    join public.wct_patterns pattern on pattern.day_id = day.id
    where day.book_id in (${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid, ${sqlLiteral(NOVICE_BOOK_ID)}::uuid)
    union all
    select case day.book_id when ${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid then 0 else 1 end,
      day.day_number, pattern.sort_order, pattern.id::text, 1, example.sort_order, example.id::text,
      jsonb_build_object(
        'domain', 'full', 'entity', 'example', 'sourceId', day.id::text,
        'patternId', pattern.id::text, 'exampleId', example.id::text,
        'englishText', example.english_text, 'meaningKo', example.meaning_ko,
        'sourcePage', example.source_page, 'sourceNeedsReview', example.source_needs_review,
        'sortOrder', example.sort_order
      )
    from public.wct_days day
    join public.wct_patterns pattern on pattern.day_id = day.id
    join public.wct_examples example on example.pattern_id = pattern.id
    where day.book_id in (${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid, ${sqlLiteral(NOVICE_BOOK_ID)}::uuid)
  ) source_row;

  select coalesce(jsonb_agg(jsonb_build_object(
    'domain', 'eligible', 'level', expected.level, 'dayNumber', day.day_number,
    'lessonKey', quiz.lesson_key, 'sourceId', day.id::text,
    'topic', regexp_replace(btrim(day.short_label), '[[:space:]]+', ' ', 'g'),
    'patternId', pattern.id::text, 'exampleId', example.id::text,
    'patternText', regexp_replace(btrim(pattern.pattern_text), '[[:space:]]+', ' ', 'g'),
    'patternMeaningKo', nullif(regexp_replace(btrim(coalesce(pattern.meaning_ko, '')), '[[:space:]]+', ' ', 'g'), ''),
    'usageNote', nullif(regexp_replace(btrim(coalesce(pattern.usage_note, '')), '[[:space:]]+', ' ', 'g'), ''),
    'englishText', regexp_replace(btrim(example.english_text), '[[:space:]]+', ' ', 'g'),
    'meaningKo', nullif(regexp_replace(btrim(coalesce(example.meaning_ko, '')), '[[:space:]]+', ' ', 'g'), '')
  ) order by case day.book_id when ${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid then 0 else 1 end,
    day.day_number, pattern.id::text, example.id::text), '[]'::jsonb)
  into v_source_eligible_after
  from jsonb_to_recordset(v_expected_source_eligible_after) as expected(
    level text, "patternId" text, "exampleId" text
  )
  join public.wct_patterns pattern on pattern.id::text = expected."patternId"
  join public.wct_examples example on example.id::text = expected."exampleId"
    and example.pattern_id = pattern.id
  join public.wct_days day on day.id = pattern.day_id
  join public.wct_quiz_sets quiz on quiz.source_id = day.id::text
    and quiz.owner_id = v_owner_id and quiz.source_kind = 'wct_day';
  if v_source_full_after is distinct from v_expected_source_full_after
    or v_source_eligible_after is distinct from v_expected_source_eligible_after then
    raise exception 'WCT v2 post-correction source inventory mismatch';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', quiz.id::text,
    'ownerId', quiz.owner_id::text,
    'lessonKey', quiz.lesson_key,
    'sourceKind', quiz.source_kind,
    'sourceId', quiz.source_id,
    'generatorVersion', quiz.generator_version,
    'sourceHash', quiz.source_hash,
    'questions', quiz.questions
  ) order by quiz.lesson_key, quiz.id), '[]'::jsonb)
  into v_premium_before
  from public.wct_quiz_sets quiz
  where quiz.owner_id = v_owner_id
    and quiz.source_kind = 'wct_premium';
  if v_premium_before is distinct from v_expected_premium then
    raise exception 'WCT v2 current Premium inventory does not match approved snapshot';
  end if;

  select coalesce(jsonb_agg(to_jsonb(progress) order by progress.quiz_set_id, progress.user_id), '[]'::jsonb)
  into v_premium_progress_before
  from public.wct_quiz_progress progress
  join public.wct_quiz_sets quiz on quiz.id = progress.quiz_set_id
  where quiz.owner_id = v_owner_id
    and quiz.source_kind = 'wct_premium';

  perform public.sync_wct_standard_quiz_sets(v_owner_id, v_payload);

  select count(*), coalesce(sum(jsonb_array_length(quiz.questions)), 0)::integer
  into v_count, v_question_count
  from public.wct_quiz_sets quiz
  join public.wct_days day on day.id::text = quiz.source_id
  where quiz.owner_id = v_owner_id
    and day.book_id in (
      ${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid,
      ${sqlLiteral(NOVICE_BOOK_ID)}::uuid
    )
    and quiz.generator_version = 'wct-review-v2';
  if v_count <> 44 or v_question_count <> 220 then
    raise exception 'WCT v2 conversion did not produce exactly 44 sets and 220 questions';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', quiz.id::text,
    'ownerId', quiz.owner_id::text,
    'bookId', day.book_id::text,
    'dayNumber', day.day_number,
    'lessonKey', quiz.lesson_key,
    'sourceKind', quiz.source_kind,
    'sourceId', quiz.source_id,
    'generatorVersion', quiz.generator_version,
    'sourceHash', quiz.source_hash,
    'questions', quiz.questions
  ) order by case day.book_id
    when ${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid then 0 else 1 end,
    day.day_number, quiz.lesson_key, quiz.id), '[]'::jsonb)
  into v_current_target_graph
  from public.wct_quiz_sets quiz
  join public.wct_days day on day.id::text = quiz.source_id
  where quiz.owner_id = v_owner_id
    and quiz.source_kind = 'wct_day'
    and day.book_id in (
      ${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid,
      ${sqlLiteral(NOVICE_BOOK_ID)}::uuid
    );
  if v_current_target_graph is distinct from v_expected_target_after then
    raise exception 'WCT v2 converted target graph does not match approved payload';
  end if;

  select coalesce(jsonb_agg(quiz.id order by case day.book_id
    when ${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid then 0 else 1 end,
    day.day_number, quiz.lesson_key), '[]'::jsonb)
  into v_target_set_ids_after
  from public.wct_quiz_sets quiz
  join public.wct_days day on day.id::text = quiz.source_id
  where quiz.owner_id = v_owner_id
    and quiz.source_kind = 'wct_day'
    and quiz.generator_version = 'wct-review-v2'
    and day.book_id in (
      ${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid,
      ${sqlLiteral(NOVICE_BOOK_ID)}::uuid
    );
  if v_target_set_ids_after is distinct from v_target_set_ids_before then
    raise exception 'WCT v2 conversion did not preserve target set UUIDs';
  end if;

  if exists (
    select 1
    from public.wct_quiz_progress progress
    join public.wct_quiz_sets quiz on quiz.id = progress.quiz_set_id
    join public.wct_days day on day.id::text = quiz.source_id
    where quiz.owner_id = v_owner_id
      and day.book_id in (
        ${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid,
        ${sqlLiteral(NOVICE_BOOK_ID)}::uuid
      )
  ) then
    raise exception 'WCT v2 target quiz progress was not reset';
  end if;

  if exists (
    select 1
    from public.wct_pop_quiz_progress progress
    where progress.owner_id = v_owner_id
      and progress.book_id in (
        ${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid,
        ${sqlLiteral(NOVICE_BOOK_ID)}::uuid
      )
  ) then
    raise exception 'WCT v2 target Pop progress was not reset';
  end if;

  select coalesce(jsonb_agg(source_row.payload order by
    source_row.book_order, source_row.day_number, source_row.pattern_sort_order,
    source_row.pattern_id, source_row.entity_order,
    source_row.example_sort_order, source_row.entity_id
  ), '[]'::jsonb)
  into v_source_full_after
  from (
    select case day.book_id when ${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid then 0 else 1 end as book_order,
      day.day_number, -2147483648 as pattern_sort_order, ''::text as pattern_id,
      0 as entity_order,
      -2147483648 as example_sort_order, day.id::text as entity_id,
      jsonb_build_object(
        'domain', 'full', 'entity', 'day', 'bookId', book.id::text,
        'level', case book.id when ${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid then 'prenovice' else 'novice' end,
        'bookTitle', book.title, 'bookLevelLabel', book.level_label,
        'bookSortOrder', book.sort_order, 'dayNumber', day.day_number,
        'lessonKey', quiz.lesson_key, 'sourceId', day.id::text,
        'shortLabel', day.short_label, 'learningSummary', day.learning_summary,
        'sourcePageStart', day.source_page_start,
        'sourcePageEnd', day.source_page_end, 'sourceNeedsReview', day.source_needs_review
      ) as payload
    from public.wct_books book
    join public.wct_days day on day.book_id = book.id
    join public.wct_quiz_sets quiz on quiz.source_id = day.id::text
      and quiz.owner_id = v_owner_id and quiz.source_kind = 'wct_day'
    where book.id in (${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid, ${sqlLiteral(NOVICE_BOOK_ID)}::uuid)
    union all
    select case day.book_id when ${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid then 0 else 1 end,
      day.day_number, pattern.sort_order, pattern.id::text, 0, -2147483648, pattern.id::text,
      jsonb_build_object(
        'domain', 'full', 'entity', 'pattern', 'sourceId', day.id::text,
        'patternId', pattern.id::text, 'patternText', pattern.pattern_text,
        'patternMeaningKo', pattern.meaning_ko, 'usageNote', pattern.usage_note,
        'usageSource', pattern.usage_source, 'sourcePage', pattern.source_page,
        'sourceNeedsReview', pattern.source_needs_review, 'sortOrder', pattern.sort_order
      )
    from public.wct_days day
    join public.wct_patterns pattern on pattern.day_id = day.id
    where day.book_id in (${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid, ${sqlLiteral(NOVICE_BOOK_ID)}::uuid)
    union all
    select case day.book_id when ${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid then 0 else 1 end,
      day.day_number, pattern.sort_order, pattern.id::text, 1, example.sort_order, example.id::text,
      jsonb_build_object(
        'domain', 'full', 'entity', 'example', 'sourceId', day.id::text,
        'patternId', pattern.id::text, 'exampleId', example.id::text,
        'englishText', example.english_text, 'meaningKo', example.meaning_ko,
        'sourcePage', example.source_page, 'sourceNeedsReview', example.source_needs_review,
        'sortOrder', example.sort_order
      )
    from public.wct_days day
    join public.wct_patterns pattern on pattern.day_id = day.id
    join public.wct_examples example on example.pattern_id = pattern.id
    where day.book_id in (${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid, ${sqlLiteral(NOVICE_BOOK_ID)}::uuid)
  ) source_row;

  select coalesce(jsonb_agg(jsonb_build_object(
    'domain', 'eligible', 'level', expected.level, 'dayNumber', day.day_number,
    'lessonKey', quiz.lesson_key, 'sourceId', day.id::text,
    'topic', regexp_replace(btrim(day.short_label), '[[:space:]]+', ' ', 'g'),
    'patternId', pattern.id::text, 'exampleId', example.id::text,
    'patternText', regexp_replace(btrim(pattern.pattern_text), '[[:space:]]+', ' ', 'g'),
    'patternMeaningKo', nullif(regexp_replace(btrim(coalesce(pattern.meaning_ko, '')), '[[:space:]]+', ' ', 'g'), ''),
    'usageNote', nullif(regexp_replace(btrim(coalesce(pattern.usage_note, '')), '[[:space:]]+', ' ', 'g'), ''),
    'englishText', regexp_replace(btrim(example.english_text), '[[:space:]]+', ' ', 'g'),
    'meaningKo', nullif(regexp_replace(btrim(coalesce(example.meaning_ko, '')), '[[:space:]]+', ' ', 'g'), '')
  ) order by case day.book_id when ${sqlLiteral(PRENOVICE_BOOK_ID)}::uuid then 0 else 1 end,
    day.day_number, pattern.id::text, example.id::text), '[]'::jsonb)
  into v_source_eligible_after
  from jsonb_to_recordset(v_expected_source_eligible_after) as expected(
    level text, "patternId" text, "exampleId" text
  )
  join public.wct_patterns pattern on pattern.id::text = expected."patternId"
  join public.wct_examples example on example.id::text = expected."exampleId"
    and example.pattern_id = pattern.id
  join public.wct_days day on day.id = pattern.day_id
  join public.wct_quiz_sets quiz on quiz.source_id = day.id::text
    and quiz.owner_id = v_owner_id and quiz.source_kind = 'wct_day';
  if v_source_full_after is distinct from v_expected_source_full_after
    or v_source_eligible_after is distinct from v_expected_source_eligible_after then
    raise exception 'WCT v2 post-correction source inventory mismatch';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', quiz.id::text,
    'ownerId', quiz.owner_id::text,
    'lessonKey', quiz.lesson_key,
    'sourceKind', quiz.source_kind,
    'sourceId', quiz.source_id,
    'generatorVersion', quiz.generator_version,
    'sourceHash', quiz.source_hash,
    'questions', quiz.questions
  ) order by quiz.lesson_key, quiz.id), '[]'::jsonb)
  into v_premium_after
  from public.wct_quiz_sets quiz
  where quiz.owner_id = v_owner_id
    and quiz.source_kind = 'wct_premium';
  select coalesce(jsonb_agg(to_jsonb(progress) order by progress.quiz_set_id, progress.user_id), '[]'::jsonb)
  into v_premium_progress_after
  from public.wct_quiz_progress progress
  join public.wct_quiz_sets quiz on quiz.id = progress.quiz_set_id
  where quiz.owner_id = v_owner_id
    and quiz.source_kind = 'wct_premium';
  if v_premium_after is distinct from v_expected_premium
    or v_premium_after is distinct from v_premium_before
    or v_premium_progress_after is distinct from v_premium_progress_before then
    raise exception 'WCT v2 Premium inventory changed during conversion';
  end if;
end;
`;
  let delimiterIndex = 0;
  let delimiter: string;
  do {
    delimiter = `$wct_v2_${sha256(body).slice(0, 16)}_${delimiterIndex}$`;
    delimiterIndex += 1;
  } while (body.includes(delimiter));
  return `-- Generated by scripts/generate-wct-quiz-v2.ts from an approved 220-row artifact.
-- sourceCorrectionManifestHash=${artifact.sourceCorrectionManifestHash}
-- preSourceInventoryHash=${artifact.preSourceInventoryHash}
-- postSourceInventoryHash=${artifact.postSourceInventoryHash}
-- questionArtifactHash=${artifact.questionArtifactHash}
-- premiumSetSnapshotHash=${artifact.premiumSetSnapshotHash}
-- releaseEnvelopeHash=${sha256(releaseEnvelope(artifact))}

do ${delimiter}
${body}${delimiter};
`;
}

export function renderFixture(artifact: WctV2QuestionArtifact) {
  const ownerId = artifact.targetBooks[0]?.ownerId;
  const sourceRows = projectPostSourceInventoryToPreimage(
    artifact.sourceInventory,
    artifact.sourceCorrectionManifest
  ).filter(isRecord);
  const dayRows = sourceRows.filter((row) => row.domain === "full" && row.entity === "day");
  const patternRows = sourceRows.filter((row) => row.domain === "full" && row.entity === "pattern");
  const exampleRows = sourceRows.filter((row) => row.domain === "full" && row.entity === "example");
  const sourceBookById = new Map(dayRows.map((row) => [String(row.bookId), row]));
  const booksSql = artifact.targetBooks.map((book) => {
    const sourceBook = sourceBookById.get(book.id);
    return `insert into public.wct_books (
  id, owner_id, title, level_label, sort_order
) values (
  ${sqlLiteral(book.id)}::uuid, ${sqlLiteral(ownerId)}::uuid,
  ${sqlLiteral(String(sourceBook?.bookTitle ?? book.title))},
  ${sourceBook?.bookLevelLabel === null ? "null" : sqlLiteral(String(sourceBook?.bookLevelLabel))},
  ${Number(sourceBook?.bookSortOrder)}
);`;
  }).join("\n\n");
  const daysSql = dayRows.map((row) => `insert into public.wct_days (
  id, book_id, day_number, short_label, learning_summary,
  source_page_start, source_page_end, source_needs_review
) values (
  ${sqlLiteral(String(row.sourceId))}::uuid,
  ${sqlLiteral(String(row.bookId))}::uuid,
  ${Number(row.dayNumber)}, ${sqlLiteral(String(row.shortLabel))},
  ${row.learningSummary === null ? "null" : sqlLiteral(String(row.learningSummary))},
  ${row.sourcePageStart === null ? "null" : Number(row.sourcePageStart)},
  ${row.sourcePageEnd === null ? "null" : Number(row.sourcePageEnd)},
  ${Boolean(row.sourceNeedsReview)}
);`).join("\n\n");
  const patternsSql = patternRows.map((row) => `insert into public.wct_patterns (
  id, day_id, pattern_text, meaning_ko, usage_note, usage_source,
  source_page, source_needs_review, sort_order
) values (
  ${sqlLiteral(String(row.patternId))}::uuid, ${sqlLiteral(String(row.sourceId))}::uuid,
  ${sqlLiteral(String(row.patternText))}, ${row.patternMeaningKo === null ? "null" : sqlLiteral(String(row.patternMeaningKo))},
  ${row.usageNote === null ? "null" : sqlLiteral(String(row.usageNote))}, ${sqlLiteral(String(row.usageSource))},
  ${row.sourcePage === null ? "null" : Number(row.sourcePage)},
  ${Boolean(row.sourceNeedsReview)}, ${Number(row.sortOrder)}
);`).join("\n\n");
  const examplesSql = exampleRows.map((row) => `insert into public.wct_examples (
  id, pattern_id, english_text, meaning_ko, source_page, source_needs_review, sort_order
) values (
  ${sqlLiteral(String(row.exampleId))}::uuid, ${sqlLiteral(String(row.patternId))}::uuid,
  ${sqlLiteral(String(row.englishText))}, ${row.meaningKo === null ? "null" : sqlLiteral(String(row.meaningKo))},
  ${row.sourcePage === null ? "null" : Number(row.sourcePage)},
  ${Boolean(row.sourceNeedsReview)}, ${Number(row.sortOrder)}
);`).join("\n\n");
  const setSql = artifact.targetV1SetSnapshot.map((set) => `insert into public.wct_quiz_sets (
  id, owner_id, lesson_key, source_kind, source_id, generator_version, source_hash, questions
) values (
  ${sqlLiteral(set.id)}::uuid, ${sqlLiteral(set.ownerId)}::uuid,
  ${sqlLiteral(set.lessonKey)}, 'wct_day', ${sqlLiteral(set.sourceId)},
  'wct-review-v1', ${sqlLiteral(set.sourceHash)}, ${sqlLiteral(JSON.stringify(set.questions))}::jsonb
);`).join("\n\n");
  const premiumSql = artifact.premiumSetSnapshot.map((set) => `insert into public.wct_quiz_sets (
  id, owner_id, lesson_key, source_kind, source_id, generator_version, source_hash, questions
) values (
  ${sqlLiteral(set.id)}::uuid, ${sqlLiteral(set.ownerId)}::uuid, ${sqlLiteral(set.lessonKey)},
  'wct_premium', ${sqlLiteral(set.sourceId)}, ${sqlLiteral(set.generatorVersion)},
  ${sqlLiteral(set.sourceHash)}, ${sqlLiteral(JSON.stringify(set.questions))}::jsonb
);`).join("\n\n");
  const progressLessonKeys = artifact.targetBooks.map((book) => artifact.sets
    .filter((set) => set.bookId === book.id)
    .sort((left, right) => left.dayNumber - right.dayNumber)[0]?.lessonKey ?? "");
  const progressSql = `-- fixture-target-standard-progress
insert into public.wct_quiz_progress (
  quiz_set_id, user_id, latest_score, completed_at, updated_at
)
select quiz.id, ${sqlLiteral(ownerId)}::uuid, 3,
  '2026-08-05T00:00:00Z'::timestamptz, '2026-08-05T00:00:00Z'::timestamptz
from public.wct_quiz_sets quiz
where quiz.owner_id = ${sqlLiteral(ownerId)}::uuid
  and quiz.source_kind = 'wct_day'
  and quiz.lesson_key in (${progressLessonKeys.map(sqlLiteral).join(", ")});

-- fixture-premium-progress
insert into public.wct_quiz_progress (
  quiz_set_id, user_id, latest_score, completed_at, updated_at
)
select quiz.id, ${sqlLiteral(ownerId)}::uuid, 4,
  '2026-08-05T00:00:00Z'::timestamptz, '2026-08-05T00:00:00Z'::timestamptz
from public.wct_quiz_sets quiz
where quiz.owner_id = ${sqlLiteral(ownerId)}::uuid
  and quiz.source_kind = 'wct_premium';`;
  const popSql = artifact.targetBooks.map((book) => {
    const firstSet = artifact.sets
      .filter((set) => set.bookId === book.id)
      .sort((left, right) => left.dayNumber - right.dayNumber)[0]!;
    const firstQuestion = firstSet.questions[0];
    return `insert into public.wct_pop_quiz_progress (
  owner_id, book_id, seed, questions, answers, current_index, status,
  latest_score, incorrect_days, started_at, completed_at, updated_at
) values (
  ${sqlLiteral(ownerId)}::uuid, ${sqlLiteral(book.id)}::uuid,
  ${sqlLiteral(`fixture-target-pop-${book.level}`)},
  ${sqlLiteral(JSON.stringify([{
    sourceQuizSetId: `fixture-${book.level}-set`,
    dayId: firstSet.sourceId,
    dayNumber: firstSet.dayNumber,
    dayLabel: `Day ${firstSet.dayNumber} (fixture)`,
    dayTopic: "fixture",
    band: "early",
    question: firstQuestion
  }]))}::jsonb,
  '[]'::jsonb, 0, 'in_progress', null, '[]'::jsonb,
  '2026-08-05T00:00:00Z'::timestamptz, null,
  '2026-08-05T00:00:00Z'::timestamptz
);`;
  }).join("\n\n");
  return `-- Local-only production-shaped WCT v2 migration fixture.
insert into auth.users (id)
values (${sqlLiteral(ownerId)}::uuid)
on conflict (id) do nothing;

${booksSql}

${daysSql}

${patternsSql}

${examplesSql}

${setSql}

${premiumSql}

${progressSql}

${popSql}
`;
}

export function artifactsMatchLive(
  stored: WctV2QuestionArtifact,
  live: WctV2QuestionArtifact
) {
  return stored.sourceCorrectionManifestHash === live.sourceCorrectionManifestHash
    && stored.preSourceInventoryHash === live.preSourceInventoryHash
    && stored.postSourceInventoryHash === live.postSourceInventoryHash
    && stored.questionArtifactHash === live.questionArtifactHash
    && stored.premiumSetSnapshotHash === live.premiumSetSnapshotHash
    && stored.targetV1SetSnapshotHash === live.targetV1SetSnapshotHash
    && stableStringify(stored.targetBooks) === stableStringify(live.targetBooks)
    && stableStringify(stored.sourceCorrectionManifest)
      === stableStringify(live.sourceCorrectionManifest)
    && stableStringify(stored.sourceInventory) === stableStringify(live.sourceInventory)
    && stableStringify(stored.sets) === stableStringify(live.sets)
    && stableStringify(stored.targetV1SetSnapshot) === stableStringify(live.targetV1SetSnapshot)
    && stableStringify(stored.premiumSetSnapshot) === stableStringify(live.premiumSetSnapshot);
}

function artifactMatchesPostApplyLive(
  stored: WctV2QuestionArtifact,
  live: WctV2PostApplyLiveState
) {
  return stored.sourceCorrectionManifestHash === live.sourceCorrectionManifestHash
    && stored.postSourceInventoryHash === live.postSourceInventoryHash
    && stored.questionArtifactHash === live.questionArtifactHash
    && stored.premiumSetSnapshotHash === live.premiumSetSnapshotHash
    && stableStringify(stored.targetBooks) === stableStringify(live.targetBooks)
    && stableStringify(stored.sourceInventory) === stableStringify(live.sourceInventory)
    && stableStringify(stored.sets) === stableStringify(live.sets)
    && stableStringify(stored.premiumSetSnapshot) === stableStringify(live.premiumSetSnapshot);
}

export function verifyAppliedSetRows(
  artifact: WctV2QuestionArtifact,
  values: readonly unknown[]
) {
  const ownerId = artifact.targetBooks[0]?.ownerId;
  const stored = values.filter(isRecord).sort((left, right) => (
    String(left.lesson_key).localeCompare(String(right.lesson_key))
  ));
  const expected = [...artifact.sets].sort((left, right) => left.lessonKey.localeCompare(right.lessonKey));
  if (stored.length !== 44 || expected.some((set, index) => {
    const row = stored[index];
    return row?.lesson_key !== set.lessonKey
      || row.owner_id !== ownerId
      || row.source_kind !== "wct_day"
      || row.source_id !== set.sourceId
      || row.generator_version !== GENERATOR_VERSION
      || row.source_hash !== set.sourceHash
      || stableStringify(row.questions) !== stableStringify(set.questions);
  })) {
    throw new Error("WCT v2 post-apply semantic inventory mismatch");
  }
  const approvedIdByLesson = new Map(artifact.targetV1SetSnapshot.map((set) => (
    [set.lessonKey, set.id] as const
  )));
  if (stored.some((row) => String(row.id) !== approvedIdByLesson.get(String(row.lesson_key)))) {
    throw new Error("WCT v2 post-apply did not preserve approved target set UUIDs");
  }
  return stored.map((row) => String(row.id));
}

export function classifyPostMigrationProgress(
  artifact: WctV2QuestionArtifact,
  installedAt: string,
  quizValues: readonly unknown[],
  popValues: readonly unknown[]
) {
  const timestampMicroseconds = (value: unknown) => {
    if (typeof value !== "string") return null;
    const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,6}))?(Z|[+-]\d{2}:\d{2})$/u.exec(value);
    if (!match) return null;
    const wholeSecond = Date.parse(`${match[1]}${match[3]}`);
    if (!Number.isFinite(wholeSecond)) return null;
    const fraction = BigInt((match[2] ?? "").padEnd(6, "0"));
    return BigInt(wholeSecond) * 1_000n + fraction;
  };
  const installedTimestamp = timestampMicroseconds(installedAt);
  if (installedTimestamp === null) {
    throw new Error("WCT v2 checkpoint B ledger timestamp is invalid");
  }
  const approvedSetIds = new Set(artifact.targetV1SetSnapshot.map((set) => set.id));
  const approvedTargetByBook = new Map(artifact.targetBooks.map((book) => [
    book.id,
    {
      ownerId: book.ownerId,
      setIds: new Set(artifact.targetV1SetSnapshot
        .filter((set) => set.bookId === book.id && set.ownerId === book.ownerId)
        .map((set) => set.id))
    }
  ] as const));
  const laterThanInstall = (value: unknown) => {
    const timestamp = timestampMicroseconds(value);
    return timestamp !== null && timestamp > installedTimestamp;
  };
  const quiz = quizValues.map((value) => {
    if (!isRecord(value) || !approvedSetIds.has(String(value.quiz_set_id))) {
      throw new Error("WCT v2 post-B progress must reference approved v2 set IDs");
    }
    if (!laterThanInstall(value.completed_at) || !laterThanInstall(value.updated_at)) {
      throw new Error("WCT v2 stale target progress from before checkpoint B");
    }
    return {
      quizSetId: String(value.quiz_set_id),
      userId: String(value.user_id),
      completedAt: String(value.completed_at),
      updatedAt: String(value.updated_at)
    };
  });
  const pop = popValues.map((value) => {
    const targetBook = isRecord(value)
      ? approvedTargetByBook.get(String(value.book_id))
      : undefined;
    const questions = isRecord(value) && Array.isArray(value.questions)
      ? value.questions.filter(isRecord)
      : [];
    const sourceQuizSetIds = [...new Set(questions.map((question) => (
      String(question.sourceQuizSetId)
    )))];
    if (!isRecord(value)
      || !targetBook
      || value.owner_id !== targetBook.ownerId
      || !isUuid(String(value.attempt_id))
      || questions.length === 0
      || sourceQuizSetIds.some((id) => !targetBook.setIds.has(id))) {
      throw new Error("WCT v2 post-B Pop progress must reference approved v2 set IDs from the exact approved target book and current attempts");
    }
    if (!laterThanInstall(value.started_at) || !laterThanInstall(value.updated_at)) {
      throw new Error("WCT v2 stale target progress from before checkpoint B");
    }
    return {
      bookId: String(value.book_id),
      attemptId: String(value.attempt_id),
      sourceQuizSetIds,
      startedAt: String(value.started_at),
      updatedAt: String(value.updated_at)
    };
  });
  return { quiz, pop };
}

async function verifyAppliedInventory(
  client: SupabaseClient,
  artifact: WctV2QuestionArtifact
) {
  const ownerId = artifact.targetBooks[0]?.ownerId;
  const sourceIds = artifact.sets.map((set) => set.sourceId);
  const { data, error } = await client
    .from("wct_quiz_sets")
    .select("id,owner_id,lesson_key,source_kind,source_id,generator_version,source_hash,questions")
    .eq("owner_id", ownerId)
    .in("source_id", sourceIds);
  if (error) throw new Error(`WCT v2 post-apply set read failed: ${error.message}`);
  const setIds = verifyAppliedSetRows(artifact, data);
  const [ledgerResult, quizResult, popResult] = await Promise.all([
    client.from("app_schema_migrations")
      .select("installed_at")
      .eq("version", "20260805130000")
      .eq("success", true)
      .single(),
    client.from("wct_quiz_progress")
      .select("quiz_set_id,user_id,completed_at,updated_at")
      .in("quiz_set_id", setIds),
    client.from("wct_pop_quiz_progress")
      .select("owner_id,book_id,attempt_id,questions,started_at,updated_at")
      .eq("owner_id", ownerId)
      .in("book_id", [...TARGET_BOOK_IDS])
  ]);
  if (ledgerResult.error || !isRecord(ledgerResult.data)
    || typeof ledgerResult.data.installed_at !== "string") {
    throw new Error(`WCT v2 checkpoint B ledger read failed: ${ledgerResult.error?.message ?? "missing row"}`);
  }
  if (quizResult.error || popResult.error) {
    throw new Error(`WCT v2 progress read failed: ${quizResult.error?.message ?? popResult.error?.message}`);
  }
  const newProgressAfterMigration = classifyPostMigrationProgress(
    artifact,
    ledgerResult.data.installed_at,
    rows(quizResult.data),
    rows(popResult.data)
  );
  return {
    standardSets: setIds.length,
    quizProgressCount: newProgressAfterMigration.quiz.length,
    popProgressCount: newProgressAfterMigration.pop.length,
    checkpointBInstalledAt: ledgerResult.data.installed_at,
    newProgressAfterMigration
  };
}

type RunCommandDependencies = {
  createReadOnlyHostedClient: typeof createReadOnlyHostedClient;
  readArtifact: typeof readArtifact;
  buildLiveArtifact: typeof buildLiveArtifact;
  buildPostApplyLiveState: typeof buildPostApplyLiveState;
  verifyAppliedInventory: typeof verifyAppliedInventory;
};

export async function runCommand(
  parsed: ParsedCommand,
  dependencies: Partial<RunCommandDependencies> = {}
) {
  const createHostedClient = dependencies.createReadOnlyHostedClient
    ?? createReadOnlyHostedClient;
  const loadArtifact = dependencies.readArtifact ?? readArtifact;
  const loadPreApplyLive = dependencies.buildLiveArtifact ?? buildLiveArtifact;
  const loadPostApplyLive = dependencies.buildPostApplyLiveState
    ?? buildPostApplyLiveState;
  const verifyInventory = dependencies.verifyAppliedInventory
    ?? verifyAppliedInventory;
  if (parsed.command === "approve") {
    const artifact = loadArtifact(parsed.artifact);
    const approval = buildApprovalManifest(artifact, parsed.reviewer);
    writeRequestedFile(parsed.output, `${JSON.stringify(approval, null, 2)}\n`);
    console.log(`reviewedRows=${approval.reviewedRows}`);
    console.log(`output=${parsed.output}`);
    return;
  }
  if (parsed.command === "fixture") {
    const artifact = loadArtifact(parsed.artifact);
    verifyApprovalManifest(artifact, readApproval(parsed.approval));
    writeRequestedFile(parsed.output, renderFixture(artifact));
    console.log(`fixtureSets=${artifact.sets.length}`);
    console.log(`output=${parsed.output}`);
    return;
  }

  const { client, projectRef, host } = createHostedClient();
  console.log(`readTarget=main/production projectRef=${projectRef} host=${host}`);
  if (parsed.command === "audit") {
    const artifact = await loadPreApplyLive(client);
    assertNewOutputPath(parsed.json);
    assertNewOutputPath(parsed.markdown);
    const jsonContents = `${JSON.stringify(artifact, null, 2)}\n`;
    const markdownContents = markdownForArtifact(artifact);
    writeRequestedFile(parsed.json, jsonContents);
    writeRequestedFile(parsed.markdown, markdownContents);
    console.log(`sets=${artifact.sets.length}`);
    console.log(`questions=${artifact.rows.length}`);
    console.log(`failures=${artifact.failures.length}`);
    console.log(`sourceCorrectionManifestHash=${artifact.sourceCorrectionManifestHash}`);
    console.log(`preSourceInventoryHash=${artifact.preSourceInventoryHash}`);
    console.log(`postSourceInventoryHash=${artifact.postSourceInventoryHash}`);
    console.log(`questionArtifactHash=${artifact.questionArtifactHash}`);
    console.log(`premiumSetSnapshotHash=${artifact.premiumSetSnapshotHash}`);
    return;
  }
  const artifact = loadArtifact(parsed.artifact);
  if (parsed.command === "generate") {
    const live = await loadPreApplyLive(client);
    if (!artifactsMatchLive(artifact, live)) {
      throw new Error("WCT v2 live source or Premium snapshot is stale");
    }
    verifyApprovalManifest(artifact, readApproval(parsed.approval));
    writeRequestedFile(parsed.output, renderMigration(artifact));
    console.log(`generatedSets=${artifact.sets.length}`);
    console.log(`output=${parsed.output}`);
    return;
  }
  const live = await loadPostApplyLive(client);
  if (!artifactMatchesPostApplyLive(artifact, live)) {
    throw new Error("WCT v2 live source or Premium snapshot is stale");
  }
  const result = await verifyInventory(client, artifact);
  console.log(`standardSets=${result.standardSets}`);
  console.log(`quizProgressCount=${result.quizProgressCount}`);
  console.log(`popProgressCount=${result.popProgressCount}`);
  console.log(`checkpointBInstalledAt=${result.checkpointBInstalledAt}`);
  console.log(`newProgressAfterMigration=${JSON.stringify(result.newProgressAfterMigration)}`);
  console.log(`postSourceInventoryHash=${live.postSourceInventoryHash}`);
  console.log(`premiumSetSnapshotHash=${live.premiumSetSnapshotHash}`);
  return { command: "verify" as const, ...result };
}

export async function runCli(
  args: readonly string[],
  dependencies: Partial<RunCommandDependencies> = {}
) {
  try {
    await runCommand(parseV2QuizCommand(args), dependencies);
    return 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

const scriptPath = process.argv[1];
if (scriptPath && import.meta.url === pathToFileURL(scriptPath).href) {
  process.exitCode = await runCli(process.argv.slice(2));
}
