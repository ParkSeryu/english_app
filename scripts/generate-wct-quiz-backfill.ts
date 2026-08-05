import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
  buildPremiumWctQuizSource,
  buildLegacyStandardWctQuizSource
} from "../lib/wct/quiz/adapters.ts";
import {
  generateLegacyWctQuizSetDraft,
  generatePremiumWctQuizSetDraft
} from "../lib/wct/quiz/generator.ts";
import type { WctQuizSetCreateInput } from "../lib/wct/quiz/types.ts";
import {
  listWctPremiumLessons,
  type WctPremiumLesson
} from "../lib/wct/premium-lessons.ts";
import {
  normalizeWctIdentity,
  stableStringify
} from "../lib/wct/normalization.ts";
import type {
  WctBook,
  WctDay,
  WctSourceKind
} from "../lib/wct/types.ts";

const ROOT = process.cwd();
const ENV_FILE = ".env.local";
const PROJECT_REF = "ccawzrrkxuirrwvaecvw";
const TARGET_BOOKS = ["wct prenovice", "wct novice"] as const;
const QUIZ_SET_SELECT = [
  "id",
  "owner_id",
  "lesson_key",
  "source_kind",
  "source_id",
  "generator_version",
  "source_hash",
  "questions"
].join(",");

type Row = Record<string, unknown>;

export function wctBackfillUsage() {
  return `Usage: generate-wct-quiz-backfill.ts <generate|verify> [--output file]

Hosted target:
  main -> ${ENV_FILE} -> project ${PROJECT_REF}`;
}

export function parseWctBackfillArgs(args: readonly string[]) {
  const command = args.find((argument) => !argument.startsWith("-"));
  const allowedOptions = new Set(["--help", "-h", "--output"]);
  const unknownOption = args.find((argument) => (
    argument.startsWith("-") && !allowedOptions.has(argument)
  ));
  if (unknownOption) throw new Error(`Unknown option: ${unknownOption}`);
  if (args.includes("--help") || args.includes("-h")) {
    return { command: "help" as const, output: null };
  }
  if (command !== "generate" && command !== "verify") {
    throw new Error(wctBackfillUsage());
  }
  const outputIndex = args.indexOf("--output");
  const output = outputIndex < 0 ? null : args[outputIndex + 1] ?? null;
  return { command, output };
}

export type BackfillBook = Omit<WctBook, "days"> & {
  ownerId: string;
  days: WctDay[];
};

export type StandardBackfillRow = Omit<
  WctQuizSetCreateInput,
  "sourceKind"
> & {
  sourceKind: "wct_day";
  normalizedBookTitle: string;
  dayNumber: number;
};

export type PremiumBackfillRow = Omit<
  WctQuizSetCreateInput,
  "sourceKind"
> & {
  sourceKind: "wct_premium";
  premiumDayId: string;
};

export type BackfillRow = StandardBackfillRow | PremiumBackfillRow;

export function buildBackfillRows(
  books: readonly BackfillBook[],
  premiumLessons: readonly WctPremiumLesson[]
): BackfillRow[] {
  const standardRows = books.flatMap((book) => (
    book.days.map((day): StandardBackfillRow => {
      const draft = generateLegacyWctQuizSetDraft(
        buildLegacyStandardWctQuizSource(book, day, book.days)
      );
      if (draft.sourceKind !== "wct_day") {
        throw new Error("Standard WCT backfill generated the wrong source kind");
      }
      return {
        ...draft,
        sourceKind: "wct_day",
        normalizedBookTitle: normalizeWctIdentity(book.title),
        dayNumber: day.dayNumber
      };
    })
  ));
  const premiumRows = premiumLessons.map((lesson): PremiumBackfillRow => {
    const draft = generatePremiumWctQuizSetDraft(
      buildPremiumWctQuizSource(lesson)
    );
    if (draft.sourceKind !== "wct_premium") {
      throw new Error("Premium WCT backfill generated the wrong source kind");
    }
    return {
      ...draft,
      sourceKind: "wct_premium",
      premiumDayId: lesson.id
    };
  });
  return [...standardRows, ...premiumRows];
}

function rows(value: unknown): Row[] {
  return Array.isArray(value) ? value as Row[] : [];
}

function nullableString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
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
        .sort((left, right) => left.sortOrder - right.sortOrder)
    }))
    .sort((left, right) => left.sortOrder - right.sortOrder);
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
    concepts: rows(row.wct_day_concepts)
      .map((concept) => ({
        id: String(concept.id),
        text: String(concept.text),
        sourceKind: String(concept.source_kind) as WctSourceKind,
        sortOrder: Number(concept.sort_order ?? 0)
      }))
      .sort((left, right) => left.sortOrder - right.sortOrder),
    patterns,
    importantNotes: rows(row.wct_important_notes)
      .map((note) => ({
        id: String(note.id),
        patternId: nullableString(note.pattern_id),
        noteText: String(note.note_text),
        sourcePage: nullableNumber(note.source_page),
        sortOrder: Number(note.sort_order ?? 0)
      }))
      .sort((left, right) => left.sortOrder - right.sortOrder),
    practicePrompts: rows(row.wct_practice_prompts)
      .map((prompt) => ({
        id: String(prompt.id),
        patternId: nullableString(prompt.pattern_id),
        promptText: String(prompt.prompt_text),
        meaningKo: nullableString(prompt.meaning_ko),
        sourcePage: nullableNumber(prompt.source_page),
        sortOrder: Number(prompt.sort_order ?? 0)
      }))
      .sort((left, right) => left.sortOrder - right.sortOrder)
  };
}

function mapBook(row: Row): BackfillBook {
  const days = rows(row.wct_days)
    .map(mapDay)
    .sort((left, right) => left.dayNumber - right.dayNumber);
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

async function readBooks(client: SupabaseClient): Promise<BackfillBook[]> {
  const { data, error } = await client
    .from("wct_books")
    .select(`
      id,owner_id,title,level_label,sort_order,
      wct_days(
        id,book_id,day_number,short_label,learning_summary,
        source_page_start,source_page_end,source_needs_review,
        wct_day_concepts(id,text,source_kind,sort_order),
        wct_patterns(
          id,pattern_text,meaning_ko,usage_note,usage_source,
          source_page,source_needs_review,sort_order,
          wct_examples(
            id,english_text,meaning_ko,source_page,source_needs_review,sort_order
          )
        ),
        wct_important_notes(id,pattern_id,note_text,source_page,sort_order),
        wct_practice_prompts(
          id,pattern_id,prompt_text,meaning_ko,source_page,sort_order
        )
      )
    `)
    .in("normalized_title", [...TARGET_BOOKS]);
  if (error) throw new Error(`WCT backfill source query failed: ${error.message}`);
  return rows(data).map(mapBook).sort((left, right) => (
    normalizeWctIdentity(left.title)
      .localeCompare(normalizeWctIdentity(right.title))
  ));
}

function assertCurrentInventory(books: readonly BackfillBook[]) {
  const counts = new Map(books.map((book) => [
    normalizeWctIdentity(book.title),
    book.days.length
  ]));
  if (counts.get("wct prenovice") !== 16 || counts.get("wct novice") !== 28) {
    throw new Error(
      `Expected WCT Prenovice 16 and WCT Novice 28, got ${JSON.stringify(
        Object.fromEntries(counts)
      )}`
    );
  }
  const owners = new Set(books.map((book) => book.ownerId));
  if (owners.size !== 1) {
    throw new Error(`Expected one current WCT owner, got ${owners.size}`);
  }
  const examples = books.flatMap((book) => (
    book.days.flatMap((day) => (
      day.patterns.flatMap((pattern) => pattern.examples)
    ))
  ));
  const missingMeaningCount = examples.filter((example) => (
    !example.meaningKo?.trim()
  )).length;
  if (examples.length !== 211 || missingMeaningCount !== 0) {
    throw new Error(
      `Expected 211 translated examples, got total=${examples.length}, missingMeaningCount=${missingMeaningCount}`
    );
  }
}

function sqlLiteral(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

function standardInsertSql(row: StandardBackfillRow) {
  return `insert into public.wct_quiz_sets (
  owner_id, lesson_key, source_kind, source_id,
  generator_version, source_hash, questions
)
select
  b.owner_id,
  ${sqlLiteral(row.lessonKey)},
  'wct_day',
  d.id::text,
  ${sqlLiteral(row.generatorVersion)},
  ${sqlLiteral(row.sourceHash)},
  ${sqlLiteral(JSON.stringify(row.questions))}::jsonb
from public.wct_books b
join public.wct_days d on d.book_id = b.id
where b.normalized_title = ${sqlLiteral(row.normalizedBookTitle)}
  and d.day_number = ${row.dayNumber}
on conflict (owner_id, lesson_key) do nothing;`;
}

function premiumInsertSql(row: PremiumBackfillRow) {
  return `insert into public.wct_quiz_sets (
  owner_id, lesson_key, source_kind, source_id,
  generator_version, source_hash, questions
)
select distinct
  b.owner_id,
  ${sqlLiteral(row.lessonKey)},
  'wct_premium',
  ${sqlLiteral(row.premiumDayId)},
  ${sqlLiteral(row.generatorVersion)},
  ${sqlLiteral(row.sourceHash)},
  ${sqlLiteral(JSON.stringify(row.questions))}::jsonb
from public.wct_books b
where b.normalized_title in ('wct prenovice', 'wct novice')
on conflict (owner_id, lesson_key) do nothing;`;
}

function renderMigration(rowsToRender: readonly BackfillRow[]) {
  const inserts = rowsToRender.map((row) => (
    row.sourceKind === "wct_day"
      ? standardInsertSql(row)
      : premiumInsertSql(row)
  )).join("\n\n");
  return `-- Generated by scripts/generate-wct-quiz-backfill.ts.
-- Source: hosted WCT Prenovice 16 + Novice 28 + code-backed Premium Day 1.

${inserts}

do $$
begin
  if exists (
    select target.owner_id
    from (
      select owner_id
      from public.wct_books
      where normalized_title in ('wct prenovice', 'wct novice')
      group by owner_id
      having count(distinct normalized_title) = 2
    ) target
    left join public.wct_quiz_sets quiz on quiz.owner_id = target.owner_id
    group by target.owner_id
    having count(quiz.id) filter (
      where quiz.generator_version = 'wct-review-v1'
        and jsonb_typeof(quiz.questions) = 'array'
        and jsonb_array_length(quiz.questions) = 5
    ) <> 45
  ) then
    raise exception 'WCT review quiz backfill did not create 45 valid sets';
  end if;
end;
$$;
`;
}

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing env file: ${path.relative(ROOT, filePath)}`);
  }
  const values: Record<string, string> = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 0) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\""))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

function requiredEnv(
  values: Record<string, string>,
  key: string
) {
  const value = values[key] || process.env[key];
  if (!value) throw new Error(`${ENV_FILE} is missing ${key}`);
  return value;
}

function createClientFromEnv() {
  const env = loadEnvFile(path.join(ROOT, ENV_FILE));
  const url = requiredEnv(env, "NEXT_PUBLIC_SUPABASE_URL");
  const projectRef = new URL(url).hostname.split(".")[0] ?? "unknown";
  if (projectRef !== PROJECT_REF) {
    throw new Error(
      `${ENV_FILE} points to ${projectRef}, expected ${PROJECT_REF}`
    );
  }
  const serviceRoleKey = requiredEnv(env, "SUPABASE_SERVICE_ROLE_KEY");
  return {
    client: createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    }),
    projectRef
  };
}

function hasCorruptText(value: unknown) {
  const serialized = JSON.stringify(value);
  return serialized.includes("???") || serialized.includes("\uFFFD");
}

async function verifyBackfill(
  client: SupabaseClient,
  projectRef: string,
  books: readonly BackfillBook[],
  expectedRows: readonly BackfillRow[]
) {
  const ownerId = books[0]?.ownerId;
  if (!ownerId) throw new Error("WCT backfill owner is missing");
  const { data, error } = await client
    .from("wct_quiz_sets")
    .select(QUIZ_SET_SELECT)
    .eq("owner_id", ownerId)
    .eq("generator_version", "wct-review-v1");
  if (error) throw new Error(`WCT backfill verify query failed: ${error.message}`);
  const storedRows = rows(data);
  if (storedRows.length !== 45) {
    throw new Error(`Expected 45 stored WCT quiz sets, got ${storedRows.length}`);
  }

  const storedByKey = new Map(storedRows.map((row) => [
    String(row.lesson_key),
    row
  ]));
  for (const expected of expectedRows) {
    const stored = storedByKey.get(expected.lessonKey);
    if (!stored) throw new Error(`Missing WCT quiz set ${expected.lessonKey}`);
    if (
      stored.source_kind !== expected.sourceKind
      || stored.source_id !== expected.sourceId
      || stored.generator_version !== expected.generatorVersion
      || stored.source_hash !== expected.sourceHash
      || stableStringify(stored.questions) !== stableStringify(expected.questions)
    ) {
      throw new Error(`Stored WCT quiz differs for ${expected.lessonKey}`);
    }
    if (
      hasCorruptText(stored.questions)
      || !/[가-힣]/.test(JSON.stringify(stored.questions))
    ) {
      throw new Error(`Stored Korean text is invalid for ${expected.lessonKey}`);
    }
  }

  console.log(`projectRef=${projectRef}`);
  console.log("standardSets=44");
  console.log("premiumSets=1");
  console.log("questionSetsMatched=45");
  console.log("koreanTextMatched=45");
}

async function main(args: readonly string[]) {
  const parsed = parseWctBackfillArgs(args);
  if (parsed.command === "help") {
    console.log(wctBackfillUsage());
    return;
  }

  const { client, projectRef } = createClientFromEnv();
  const books = await readBooks(client);
  assertCurrentInventory(books);
  const backfillRows = buildBackfillRows(books, listWctPremiumLessons());
  if (backfillRows.length !== 45) {
    throw new Error(`Expected 45 generated WCT quiz sets, got ${backfillRows.length}`);
  }

  if (parsed.command === "generate") {
    const output = parsed.output;
    if (!output) throw new Error("generate requires --output");
    fs.writeFileSync(path.resolve(ROOT, output), renderMigration(backfillRows), "utf8");
    console.log(`projectRef=${projectRef}`);
    console.log(`generatedSets=${backfillRows.length}`);
    console.log(`output=${output}`);
    return;
  }

  await verifyBackfill(client, projectRef, books, backfillRows);
}

const scriptPath = process.argv[1];
if (scriptPath && import.meta.url === pathToFileURL(scriptPath).href) {
  await main(process.argv.slice(2)).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
