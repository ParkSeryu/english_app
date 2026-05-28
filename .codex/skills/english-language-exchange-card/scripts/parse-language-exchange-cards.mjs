#!/usr/bin/env node
import fs from "node:fs";

const rawInput = fs.readFileSync(0, "utf8").trim();

function fail(message) {
  console.error(message);
  process.exit(1);
}

function normalizeDate(value) {
  const compact = value.trim().replaceAll("-", "");
  const expanded = compact.length === 6 ? `20${compact}` : compact;
  const match = /^(\d{4})(\d{2})(\d{2})$/.exec(expanded);
  if (!match) fail("Could not parse date. Use YYYY-MM-DD, YYYYMMDD, or YYMMDD.");
  const [, year, month, day] = match;
  const normalized = `${year}-${month}-${day}`;
  const date = new Date(`${normalized}T00:00:00.000Z`);
  if (date.toISOString().slice(0, 10) !== normalized) fail(`Invalid date: ${value}`);
  return normalized;
}

function extractTopic(text) {
  const topicDateLine = text.match(/토픽(?:은|:)?\s*([^\n,]+?)\s*,\s*날짜(?:는|:)?/u);
  if (topicDateLine?.[1]?.trim()) return topicDateLine[1].trim();
  const topicBeforeDate = text.match(/^\s*(.+?)\s*토픽\s+\d{2,4}-?\d{2}-?\d{2}\s*날짜/mu);
  if (topicBeforeDate?.[1]?.trim()) return topicBeforeDate[1].trim();
  const topicLine = text.match(/토픽(?:은|:)?\s*([^\n]+)/u);
  if (topicLine?.[1]?.trim()) return topicLine[1].trim().replace(/[,，]\s*$/, "");
  return null;
}

function extractDate(text) {
  const match = text.match(/날짜(?:는|:)?\s*(\d{2,4}-?\d{2}-?\d{2})/u) ?? text.match(/(\d{2,4}-?\d{2}-?\d{2})\s*날짜/u);
  return match?.[1] ? normalizeDate(match[1]) : null;
}

function extractCards(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const cards = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const singleLine = /^\d+[.)]\s*(.+)\s*[（(]([^()（）]+)[）)]\s*$/u.exec(line);
    if (singleLine) {
      cards.push({
        english: singleLine[1].trim(),
        korean_prompt: singleLine[2].trim(),
        examples: []
      });
      continue;
    }

    const englishLine = /^\d+[.)]\s*(.+?)\s*$/u.exec(line);
    const koreanLine = /^[（(]([^()（）]+)[）)]\s*$/u.exec(lines[index + 1] ?? "");
    if (englishLine && koreanLine) {
      cards.push({
        english: englishLine[1].trim(),
        korean_prompt: koreanLine[1].trim(),
        examples: []
      });
      index += 1;
    }
  }

  return cards;
}

if (!rawInput) fail("No input provided on stdin.");

const title = extractTopic(rawInput);
const dayDate = extractDate(rawInput);
const expressions = extractCards(rawInput);

if (!title) fail("Could not parse topic. Include a line like: 토픽은 with keyri, 날짜는 2026-05-27");
if (!dayDate) fail("Could not parse date. Include a line like: 날짜는 2026-05-27");
if (expressions.length === 0) fail("Could not parse any cards. Use numbered lines like: 1. English (한국말)");

console.log(JSON.stringify({
  expression_day: {
    title,
    raw_input: rawInput,
    source_note: "언어교환 표현",
    day_date: dayDate,
    folder_slug: "language-exchange"
  },
  expressions
}, null, 2));
