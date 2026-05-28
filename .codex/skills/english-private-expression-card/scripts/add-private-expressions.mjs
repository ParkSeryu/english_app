#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";

const PERSONAL_EXPRESSION_MARKER = "__personal_expression__";
const PROJECT_REFS = {
  dev: "uixpyibcpleuwsgemdno",
  main: "ccawzrrkxuirrwvaecvw"
};

function usage() {
  console.error(`Usage: node add-private-expressions.mjs --env dev|main --payload <file.json> [--repo <path>] [--apply] [--confirm-production]\n\nDry-run is the default. Use --apply to write. Main writes also require --confirm-production.`);
}

function parseArgs(argv) {
  const args = { env: "dev", repo: process.cwd(), apply: false, confirmProduction: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--env") args.env = argv[++i];
    else if (arg === "--payload") args.payload = argv[++i];
    else if (arg === "--repo") args.repo = argv[++i];
    else if (arg === "--apply") args.apply = true;
    else if (arg === "--confirm-production") args.confirmProduction = true;
    else if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (!args.payload) throw new Error("Missing --payload <file.json>");
  if (!Object.hasOwn(PROJECT_REFS, args.env)) throw new Error("--env must be dev or main");
  return args;
}

function parseEnvFile(filePath) {
  const env = {};
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index < 0) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function projectRefFromUrl(url) {
  const match = String(url).match(/^https:\/\/([a-z0-9-]+)\.supabase\.co\/?$/i);
  return match?.[1] ?? null;
}

function normalizeUuid(value, fieldName) {
  if (typeof value !== "string") throw new Error(`${fieldName} must be a UUID string`);
  const trimmed = value.trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed)) {
    throw new Error(`${fieldName} is not a valid UUID: ${value}`);
  }
  return trimmed;
}

function normalizeOptionalString(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed ? trimmed : null;
}

function normalizeBool(value, fallback) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "n", "off"].includes(normalized)) return false;
  }
  return fallback;
}

function readPayload(filePath) {
  const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const targetUserId = normalizeUuid(payload.targetUserId ?? payload.target_user_id, "targetUserId");
  const targetExpressionDayIdValue = payload.targetExpressionDayId ?? payload.target_expression_day_id ?? null;
  const targetExpressionDayId = targetExpressionDayIdValue ? normalizeUuid(targetExpressionDayIdValue, "targetExpressionDayId") : null;
  const targetExpressionDayTitle = normalizeOptionalString(payload.targetExpressionDayTitle ?? payload.target_expression_day_title ?? payload.topicTitle ?? payload.topic_title);
  const targetExpressionDayDate = normalizeOptionalString(payload.targetExpressionDayDate ?? payload.target_expression_day_date ?? payload.dayDate ?? payload.day_date);
  if (!targetExpressionDayId && !targetExpressionDayTitle) throw new Error("Provide targetExpressionDayId or targetExpressionDayTitle");
  if (!Array.isArray(payload.cards) || payload.cards.length === 0) throw new Error("cards must be a non-empty array");

  const defaultMemorization = normalizeBool(payload.isMemorizationEnabled ?? payload.is_memorization_enabled, true);
  const cards = payload.cards.map((card, index) => {
    const english = normalizeOptionalString(card.english ?? card.expression);
    const koreanPrompt = normalizeOptionalString(card.koreanPrompt ?? card.korean_prompt ?? card.meaningKo ?? card.meaning_ko);
    if (!english) throw new Error(`cards[${index}].english is required`);
    if (!koreanPrompt) throw new Error(`cards[${index}].koreanPrompt is required`);
    return {
      english,
      koreanPrompt,
      grammarNote: normalizeOptionalString(card.grammarNote ?? card.grammar_note),
      userMemo: normalizeOptionalString(card.userMemo ?? card.user_memo),
      isMemorizationEnabled: normalizeBool(card.isMemorizationEnabled ?? card.is_memorization_enabled, defaultMemorization)
    };
  });

  return { targetUserId, targetExpressionDayId, targetExpressionDayTitle, targetExpressionDayDate, cards };
}

async function loadSupabase(repo) {
  const requireFromRepo = createRequire(path.join(repo, "package.json"));
  const { createClient } = requireFromRepo("@supabase/supabase-js");
  return { createClient };
}

function envFileFor(repo, envName) {
  return path.join(repo, envName === "main" ? ".env.main.local" : ".env.local");
}

async function getTargetUser(client, targetUserId) {
  const result = await client.auth.admin.getUserById(targetUserId);
  if (result.error) throw new Error(`Could not verify target auth user: ${result.error.message}`);
  if (!result.data?.user) throw new Error(`Target auth user not found: ${targetUserId}`);
  return result.data.user;
}

async function canReadDay(client, day, targetUserId) {
  if (day.created_by === "user") return day.owner_id === targetUserId;
  if (day.created_by === "llm") {
    if (!day.folder_id) return false;
    const { data, error } = await client.rpc("can_read_content_folder", {
      auth_user_id: targetUserId,
      folder_id: day.folder_id
    });
    if (error) throw new Error(`Could not verify topic ACL: ${error.message}`);
    return data === true;
  }
  return false;
}

async function resolveDay(client, payload) {
  const columns = "id,owner_id,title,day_date,folder_id,created_by,created_at";
  let candidates = [];
  if (payload.targetExpressionDayId) {
    const { data, error } = await client.from("expression_days").select(columns).eq("id", payload.targetExpressionDayId).maybeSingle();
    if (error) throw new Error(`Could not load target topic: ${error.message}`);
    if (!data) throw new Error(`Target topic not found: ${payload.targetExpressionDayId}`);
    candidates = [data];
  } else {
    let query = client.from("expression_days").select(columns).eq("title", payload.targetExpressionDayTitle).order("created_at", { ascending: false });
    if (payload.targetExpressionDayDate) query = query.eq("day_date", payload.targetExpressionDayDate);
    const { data, error } = await query;
    if (error) throw new Error(`Could not search target topic: ${error.message}`);
    candidates = data ?? [];
  }

  const visible = [];
  for (const day of candidates) {
    if (await canReadDay(client, day, payload.targetUserId)) visible.push(day);
  }

  if (visible.length === 0) {
    const candidateSummary = candidates.map((day) => `${day.id} ${day.title} ${day.day_date ?? ""}`).join("; ") || "none";
    throw new Error(`No target-user-visible topic resolved. Candidates: ${candidateSummary}`);
  }
  if (visible.length > 1) {
    const summary = visible.map((day) => `${day.id} | ${day.title} | ${day.day_date ?? "no-date"}`).join("\n");
    throw new Error(`Topic title/date is ambiguous for target user. Use targetExpressionDayId.\n${summary}`);
  }
  return visible[0];
}

async function getNextSourceOrder(client, expressionDayId) {
  const { data, error } = await client
    .from("expressions")
    .select("source_order")
    .eq("expression_day_id", expressionDayId)
    .order("source_order", { ascending: false })
    .limit(1);
  if (error) throw new Error(`Could not inspect source_order: ${error.message}`);
  return (data?.[0]?.source_order ?? -1) + 1;
}

async function findExistingExpression(client, expressionDayId, targetUserId, card) {
  let query = client
    .from("expressions")
    .select("id,english,korean_prompt,grammar_note,source_order")
    .eq("expression_day_id", expressionDayId)
    .eq("owner_id", targetUserId)
    .eq("user_memo", PERSONAL_EXPRESSION_MARKER)
    .eq("english", card.english)
    .eq("korean_prompt", card.koreanPrompt)
    .order("created_at", { ascending: false })
    .limit(1);
  query = card.grammarNote ? query.eq("grammar_note", card.grammarNote) : query.is("grammar_note", null);
  const { data, error } = await query;
  if (error) throw new Error(`Could not check duplicate expression: ${error.message}`);
  return data?.[0] ?? null;
}

async function insertOrReuseExpression(client, expressionDayId, targetUserId, card, sourceOrder, timestamp, apply) {
  const existing = await findExistingExpression(client, expressionDayId, targetUserId, card);
  if (existing) return { expression: existing, reused: true, nextSourceOrder: sourceOrder };

  if (!apply) {
    return {
      expression: { id: `(dry-run-new-${sourceOrder})`, english: card.english, korean_prompt: card.koreanPrompt, grammar_note: card.grammarNote, source_order: sourceOrder },
      reused: false,
      nextSourceOrder: sourceOrder + 1
    };
  }

  const insert = {
    expression_day_id: expressionDayId,
    owner_id: targetUserId,
    english: card.english,
    korean_prompt: card.koreanPrompt,
    nuance_note: null,
    structure_note: null,
    grammar_note: card.grammarNote,
    user_memo: PERSONAL_EXPRESSION_MARKER,
    source_order: sourceOrder,
    updated_at: timestamp
  };
  const { data, error } = await client.from("expressions").insert(insert).select("id,english,korean_prompt,grammar_note,source_order").single();
  if (error) throw new Error(`Could not insert private expression: ${error.message}`);
  return { expression: data, reused: false, nextSourceOrder: sourceOrder + 1 };
}

async function upsertProgress(client, targetUserId, expressionId, card, timestamp, apply) {
  const progress = {
    user_id: targetUserId,
    expression_id: expressionId,
    user_memo: card.userMemo,
    is_memorization_enabled: card.isMemorizationEnabled,
    known_count: 0,
    unknown_count: 0,
    review_count: 0,
    last_result: null,
    last_reviewed_at: null,
    due_at: null,
    interval_days: 0,
    updated_at: timestamp
  };
  if (!apply) return progress;
  const { error } = await client.from("expression_progress").upsert(progress, { onConflict: "user_id,expression_id" });
  if (error) throw new Error(`Could not upsert target user progress: ${error.message}`);
  return progress;
}

async function verifyWritten(client, targetUserId, expressionIds) {
  const { data: expressions, error: expressionError } = await client
    .from("expressions")
    .select("id,owner_id,user_memo,expression_day_id")
    .in("id", expressionIds);
  if (expressionError) throw new Error(`Could not verify expressions: ${expressionError.message}`);

  const { data: progress, error: progressError } = await client
    .from("expression_progress")
    .select("user_id,expression_id,is_memorization_enabled")
    .eq("user_id", targetUserId)
    .in("expression_id", expressionIds);
  if (progressError) throw new Error(`Could not verify progress: ${progressError.message}`);

  const badExpression = (expressions ?? []).find((row) => row.owner_id !== targetUserId || row.user_memo !== PERSONAL_EXPRESSION_MARKER);
  if (badExpression) throw new Error(`Verification failed for expression ${badExpression.id}: owner/marker mismatch`);
  if ((progress ?? []).length !== expressionIds.length) throw new Error(`Verification failed: expected ${expressionIds.length} progress rows, found ${(progress ?? []).length}`);
  return { expressions, progress };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const repo = path.resolve(args.repo);
  const envPath = envFileFor(repo, args.env);
  const env = parseEnvFile(envPath);
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error(`${envPath} must define NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY`);

  const actualRef = projectRefFromUrl(url);
  const expectedRef = PROJECT_REFS[args.env];
  if (actualRef !== expectedRef) throw new Error(`Refusing to use ${args.env}: expected project ${expectedRef}, got ${actualRef ?? url}`);
  if (args.env === "main" && args.apply && !args.confirmProduction) {
    throw new Error("Main/production writes require --confirm-production");
  }

  const payload = readPayload(args.payload);
  const { createClient } = await loadSupabase(repo);
  const client = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const user = await getTargetUser(client, payload.targetUserId);
  const day = await resolveDay(client, payload);
  let sourceOrder = await getNextSourceOrder(client, day.id);
  const timestamp = new Date().toISOString();

  const results = [];
  for (const card of payload.cards) {
    const expressionResult = await insertOrReuseExpression(client, day.id, payload.targetUserId, card, sourceOrder, timestamp, args.apply);
    sourceOrder = expressionResult.nextSourceOrder;
    const progress = await upsertProgress(client, payload.targetUserId, expressionResult.expression.id, card, timestamp, args.apply);
    results.push({ ...expressionResult, progress });
  }

  let verification = null;
  if (args.apply) verification = await verifyWritten(client, payload.targetUserId, results.map((result) => result.expression.id));

  const output = {
    mode: args.apply ? "applied" : "dry-run",
    environment: args.env,
    projectRef: actualRef,
    targetUser: { id: user.id, email: user.email ?? null },
    targetTopic: { id: day.id, title: day.title, day_date: day.day_date, created_by: day.created_by },
    results: results.map((result) => ({
      expressionId: result.expression.id,
      reused: result.reused,
      english: result.expression.english,
      koreanPrompt: result.expression.korean_prompt,
      isMemorizationEnabled: result.progress.is_memorization_enabled
    })),
    verification: verification ? {
      expressionRows: verification.expressions.length,
      progressRows: verification.progress.length
    } : null
  };

  console.log(JSON.stringify(output, null, 2));
}

main().catch((error) => {
  console.error(`[add-private-expressions] ${error.message}`);
  process.exitCode = 1;
});
