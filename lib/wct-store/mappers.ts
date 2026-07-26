import { formatWctDayLabel } from "@/lib/wct/normalization";
import type {
  WctBook,
  WctBookSummary,
  WctDay,
  WctDaySummary,
  WctExample,
  WctImportantNote,
  WctPattern,
  WctPracticePrompt,
  WctSourceKind
} from "@/lib/wct/types";

type Row = Record<string, unknown>;

function rows(value: unknown): Row[] {
  return Array.isArray(value) ? value as Row[] : [];
}

function nullableString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function nullableNumber(value: unknown) {
  return typeof value === "number" ? value : null;
}

export function mapWctDaySummary(row: Row): WctDaySummary {
  const dayNumber = Number(row.day_number);
  const shortLabel = String(row.short_label);
  return {
    id: String(row.id),
    bookId: String(row.book_id),
    dayNumber,
    shortLabel,
    displayLabel: formatWctDayLabel(dayNumber, shortLabel),
    sourcePageStart: nullableNumber(row.source_page_start),
    sourcePageEnd: nullableNumber(row.source_page_end),
    sourceNeedsReview: Boolean(row.source_needs_review)
  };
}

export function mapWctBookSummary(row: Row): WctBookSummary {
  const dayRows = rows(row.wct_days);
  const aggregateCount = dayRows[0]?.count;
  return {
    id: String(row.id),
    title: String(row.title),
    levelLabel: nullableString(row.level_label),
    dayCount: typeof aggregateCount === "number" ? aggregateCount : dayRows.length,
    sortOrder: Number(row.sort_order ?? 0)
  };
}

export function mapWctBook(row: Row): WctBook {
  const days = rows(row.wct_days)
    .map(mapWctDaySummary)
    .sort((left, right) => left.dayNumber - right.dayNumber);
  return {
    ...mapWctBookSummary({ ...row, wct_days: days.map(() => ({})) }),
    dayCount: days.length,
    days
  };
}

export function mapWctDay(row: Row): WctDay {
  const patterns = rows(row.wct_patterns)
    .map((pattern): WctPattern => ({
      id: String(pattern.id),
      patternText: String(pattern.pattern_text),
      meaningKo: nullableString(pattern.meaning_ko),
      usageNote: nullableString(pattern.usage_note),
      usageSource: String(pattern.usage_source) as WctSourceKind,
      sourcePage: nullableNumber(pattern.source_page),
      sourceNeedsReview: Boolean(pattern.source_needs_review),
      sortOrder: Number(pattern.sort_order ?? 0),
      examples: rows(pattern.wct_examples)
        .map((example): WctExample => ({
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

  return {
    ...mapWctDaySummary(row),
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
      .map((note): WctImportantNote => ({
        id: String(note.id),
        patternId: nullableString(note.pattern_id),
        noteText: String(note.note_text),
        sourcePage: nullableNumber(note.source_page),
        sortOrder: Number(note.sort_order ?? 0)
      }))
      .sort((left, right) => left.sortOrder - right.sortOrder),
    practicePrompts: rows(row.wct_practice_prompts)
      .map((prompt): WctPracticePrompt => ({
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
