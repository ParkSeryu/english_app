import { randomUUID } from "node:crypto";

import { formatWctDayLabel, normalizeWctIdentity } from "@/lib/wct/normalization";
import type {
  WctApprovedImportInput,
  WctBook,
  WctBookSummary,
  WctDay,
  WctImportDayInput,
  WctImportOperation,
  WctImportResult,
  WctPattern
} from "@/lib/wct/types";
import type { UserIdentity } from "@/lib/types";
import type { WctDuplicate, WctStore } from "@/lib/wct-store/contract";

type StoredWctBook = {
  id: string;
  ownerId: string;
  title: string;
  levelLabel: string | null;
  sortOrder: number;
  days: WctDay[];
};

type StoredReceipt = {
  ownerId: string;
  payloadHash: string;
  result: WctImportResult;
};

type MemoryWctState = {
  books: Map<string, StoredWctBook>;
  receipts: Map<string, StoredReceipt>;
};

const memoryWctStateKey = Symbol.for("english-app.memory-wct-store");

function getState(): MemoryWctState {
  const globalState = globalThis as typeof globalThis & {
    [memoryWctStateKey]?: MemoryWctState;
  };
  return (globalState[memoryWctStateKey] ??= {
    books: new Map(),
    receipts: new Map()
  });
}

export function resetMemoryWctStoreForTests() {
  const state = getState();
  state.books.clear();
  state.receipts.clear();
}

export class MemoryWctStore implements WctStore {
  constructor(private readonly user: UserIdentity) {}

  async listBooks(): Promise<WctBookSummary[]> {
    return [...getState().books.values()]
      .filter((book) => book.ownerId === this.user.id)
      .sort((left, right) => left.sortOrder - right.sortOrder || left.title.localeCompare(right.title))
      .map(toBookSummary)
      .map(clone);
  }

  async getBook(bookId: string): Promise<WctBook | null> {
    const book = getState().books.get(bookId);
    if (!book || book.ownerId !== this.user.id) return null;
    return clone({
      ...toBookSummary(book),
      days: sortDays(book.days).map(toDaySummary)
    });
  }

  async getDay(dayId: string): Promise<WctDay | null> {
    for (const book of getState().books.values()) {
      if (book.ownerId !== this.user.id) continue;
      const day = book.days.find((candidate) => candidate.id === dayId);
      if (day) return clone(sortDayChildren(day));
    }
    return null;
  }

  async getDays(dayIds: string[]): Promise<WctDay[]> {
    if (dayIds.length === 0) return [];
    const requested = new Set(dayIds);
    return [...getState().books.values()]
      .filter((book) => book.ownerId === this.user.id)
      .flatMap((book) => book.days)
      .filter((day) => requested.has(day.id))
      .map((day) => clone(sortDayChildren(day)));
  }

  async findDuplicateDays(bookTitle: string, dayNumbers: number[]): Promise<WctDuplicate[]> {
    const normalizedTitle = normalizeWctIdentity(bookTitle);
    const requestedDays = new Set(dayNumbers);
    const book = [...getState().books.values()].find((candidate) => (
      candidate.ownerId === this.user.id
      && normalizeWctIdentity(candidate.title) === normalizedTitle
    ));
    if (!book) return [];

    return sortDays(book.days)
      .filter((day) => requestedDays.has(day.dayNumber))
      .map((day) => ({
        dayNumber: day.dayNumber,
        existingDayId: day.id,
        existingDisplayLabel: day.displayLabel
      }));
  }

  async importApprovedBatch(input: WctApprovedImportInput): Promise<WctImportResult> {
    const state = getState();
    const receiptKey = `${this.user.id}:${input.idempotencyKey}`;
    const existingReceipt = state.receipts.get(receiptKey);
    if (existingReceipt) {
      if (existingReceipt.payloadHash !== input.payloadHash) {
        throw new Error("Idempotency key already used with a different payload");
      }
      return clone({ ...existingReceipt.result, replayed: true });
    }

    const books = structuredClone(state.books);
    const receipts = structuredClone(state.receipts);
    let book = [...books.values()].find((candidate) => (
      candidate.ownerId === this.user.id
      && normalizeWctIdentity(candidate.title) === normalizeWctIdentity(input.book.title)
    ));

    if (!book) {
      book = {
        id: randomUUID(),
        ownerId: this.user.id,
        title: input.book.title.trim(),
        levelLabel: input.book.levelLabel?.trim() || null,
        sortOrder: input.book.sortOrder ?? 0,
        days: []
      };
      books.set(book.id, book);
    } else {
      book.title = input.book.title.trim();
      book.levelLabel = input.book.levelLabel?.trim() || null;
      book.sortOrder = input.book.sortOrder ?? book.sortOrder;
    }

    const operations: WctImportOperation[] = [];
    for (const dayInput of input.days) {
      const existingIndex = book.days.findIndex((day) => day.dayNumber === dayInput.dayNumber);
      const existingDay = existingIndex >= 0 ? book.days[existingIndex] : null;

      if (!existingDay) {
        if (dayInput.duplicateAction !== "create") {
          throw new Error(`Day ${dayInput.dayNumber} does not exist for ${dayInput.duplicateAction}`);
        }
        const created = buildDay(book.id, dayInput);
        book.days.push(created);
        operations.push({ dayNumber: dayInput.dayNumber, action: "created", dayId: created.id });
        continue;
      }

      if (dayInput.duplicateAction === "create") {
        throw new Error(`Day ${dayInput.dayNumber} already exists`);
      }
      if (dayInput.duplicateAction === "skip") {
        operations.push({ dayNumber: dayInput.dayNumber, action: "skipped", dayId: existingDay.id });
        continue;
      }
      if (dayInput.duplicateAction === "replace") {
        const replacement = buildDay(book.id, dayInput, existingDay.id);
        book.days[existingIndex] = replacement;
        operations.push({ dayNumber: dayInput.dayNumber, action: "replaced", dayId: replacement.id });
        continue;
      }

      const merged = mergeDay(existingDay, dayInput);
      book.days[existingIndex] = merged;
      operations.push({ dayNumber: dayInput.dayNumber, action: "merged", dayId: merged.id });
    }

    const receiptId = randomUUID();
    const result: WctImportResult = {
      bookId: book.id,
      receiptId,
      replayed: false,
      operations,
      bookUrl: `/lessons/books/${book.id}`,
      dayUrls: operations.map(({ dayId }) => `/lessons/books/${book.id}/days/${dayId}`)
    };
    receipts.set(receiptKey, {
      ownerId: this.user.id,
      payloadHash: input.payloadHash,
      result: clone(result)
    });

    state.books = books;
    state.receipts = receipts;
    return clone(result);
  }
}

function buildDay(bookId: string, input: WctImportDayInput, id: string = randomUUID()): WctDay {
  const patterns = input.patterns.map((pattern, index): WctPattern => ({
    id: randomUUID(),
    patternText: pattern.patternText.trim(),
    meaningKo: pattern.meaningKo?.trim() || null,
    usageNote: pattern.usageNote?.trim() || null,
    usageSource: pattern.usageSource,
    sourcePage: pattern.sourcePage ?? null,
    sourceNeedsReview: pattern.sourceNeedsReview ?? false,
    sortOrder: index,
    examples: pattern.examples.map((example, exampleIndex) => ({
      id: randomUUID(),
      englishText: example.englishText.trim(),
      meaningKo: example.meaningKo?.trim() || null,
      sourcePage: example.sourcePage ?? null,
      sourceNeedsReview: example.sourceNeedsReview ?? false,
      sortOrder: exampleIndex
    }))
  }));

  return {
    id,
    bookId,
    dayNumber: input.dayNumber,
    shortLabel: input.shortLabel.trim(),
    displayLabel: formatWctDayLabel(input.dayNumber, input.shortLabel),
    learningSummary: input.learningSummary?.trim() || null,
    sourcePageStart: input.sourcePageStart ?? null,
    sourcePageEnd: input.sourcePageEnd ?? null,
    sourceNeedsReview: input.sourceNeedsReview ?? false,
    concepts: input.concepts.map((concept, index) => ({
      id: randomUUID(),
      text: concept.text.trim(),
      sourceKind: concept.sourceKind,
      sortOrder: index
    })),
    patterns,
    importantNotes: input.importantNotes.map((note, index) => ({
      id: randomUUID(),
      patternId: note.patternIndex == null ? null : patterns[note.patternIndex]?.id ?? null,
      noteText: note.noteText.trim(),
      sourcePage: note.sourcePage ?? null,
      sortOrder: index
    })),
    practicePrompts: input.practicePrompts.map((prompt, index) => ({
      id: randomUUID(),
      patternId: prompt.patternIndex == null ? null : patterns[prompt.patternIndex]?.id ?? null,
      promptText: prompt.promptText.trim(),
      meaningKo: prompt.meaningKo?.trim() || null,
      sourcePage: prompt.sourcePage ?? null,
      sortOrder: index
    }))
  };
}

function mergeDay(existing: WctDay, input: WctImportDayInput): WctDay {
  const day = clone(existing);
  day.shortLabel = input.shortLabel.trim();
  day.displayLabel = formatWctDayLabel(input.dayNumber, input.shortLabel);
  day.learningSummary = input.learningSummary?.trim() || day.learningSummary;
  day.sourcePageStart = input.sourcePageStart ?? day.sourcePageStart;
  day.sourcePageEnd = input.sourcePageEnd ?? day.sourcePageEnd;
  day.sourceNeedsReview ||= input.sourceNeedsReview ?? false;

  appendUnique(day.concepts, input.concepts, (item) => item.text, (item, sortOrder) => ({
    id: randomUUID(),
    text: item.text.trim(),
    sourceKind: item.sourceKind,
    sortOrder
  }));

  const inputPatternIds = new Map<number, string>();
  input.patterns.forEach((patternInput, inputIndex) => {
    let pattern = day.patterns.find((candidate) => (
      normalizeWctIdentity(candidate.patternText) === normalizeWctIdentity(patternInput.patternText)
    ));
    if (!pattern) {
      pattern = buildDay(day.bookId, {
        ...input,
        concepts: [],
        patterns: [patternInput],
        importantNotes: [],
        practicePrompts: []
      }).patterns[0];
      pattern.sortOrder = day.patterns.length;
      day.patterns.push(pattern);
    } else {
      pattern.meaningKo ||= patternInput.meaningKo?.trim() || null;
      pattern.usageNote ||= patternInput.usageNote?.trim() || null;
      pattern.sourceNeedsReview ||= patternInput.sourceNeedsReview ?? false;
      appendUnique(
        pattern.examples,
        patternInput.examples,
        (item) => item.englishText,
        (item, sortOrder) => ({
          id: randomUUID(),
          englishText: item.englishText.trim(),
          meaningKo: item.meaningKo?.trim() || null,
          sourcePage: item.sourcePage ?? null,
          sourceNeedsReview: item.sourceNeedsReview ?? false,
          sortOrder
        })
      );
    }
    inputPatternIds.set(inputIndex, pattern.id);
  });

  appendUnique(
    day.importantNotes,
    input.importantNotes,
    (item) => "noteText" in item ? item.noteText : "",
    (item, sortOrder) => ({
      id: randomUUID(),
      patternId: item.patternIndex == null ? null : inputPatternIds.get(item.patternIndex) ?? null,
      noteText: item.noteText.trim(),
      sourcePage: item.sourcePage ?? null,
      sortOrder
    })
  );
  appendUnique(
    day.practicePrompts,
    input.practicePrompts,
    (item) => "promptText" in item ? item.promptText : "",
    (item, sortOrder) => ({
      id: randomUUID(),
      patternId: item.patternIndex == null ? null : inputPatternIds.get(item.patternIndex) ?? null,
      promptText: item.promptText.trim(),
      meaningKo: item.meaningKo?.trim() || null,
      sourcePage: item.sourcePage ?? null,
      sortOrder
    })
  );
  return sortDayChildren(day);
}

function appendUnique<TExisting, TInput>(
  target: TExisting[],
  additions: TInput[],
  identity: (item: TExisting | TInput) => string,
  create: (item: TInput, sortOrder: number) => TExisting
) {
  const identities = new Set(target.map((item) => normalizeWctIdentity(identity(item))));
  for (const item of additions) {
    const normalized = normalizeWctIdentity(identity(item));
    if (identities.has(normalized)) continue;
    target.push(create(item, target.length));
    identities.add(normalized);
  }
}

function toBookSummary(book: StoredWctBook): WctBookSummary {
  return {
    id: book.id,
    title: book.title,
    levelLabel: book.levelLabel,
    dayCount: book.days.length,
    sortOrder: book.sortOrder
  };
}

function toDaySummary(day: WctDay) {
  return {
    id: day.id,
    bookId: day.bookId,
    dayNumber: day.dayNumber,
    shortLabel: day.shortLabel,
    displayLabel: day.displayLabel,
    sourcePageStart: day.sourcePageStart,
    sourcePageEnd: day.sourcePageEnd,
    sourceNeedsReview: day.sourceNeedsReview
  };
}

function sortDays(days: WctDay[]) {
  return [...days].sort((left, right) => left.dayNumber - right.dayNumber);
}

function sortDayChildren(day: WctDay): WctDay {
  return {
    ...day,
    concepts: [...day.concepts].sort((left, right) => left.sortOrder - right.sortOrder),
    patterns: [...day.patterns]
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((pattern) => ({
        ...pattern,
        examples: [...pattern.examples].sort((left, right) => left.sortOrder - right.sortOrder)
      })),
    importantNotes: [...day.importantNotes].sort((left, right) => left.sortOrder - right.sortOrder),
    practicePrompts: [...day.practicePrompts].sort((left, right) => left.sortOrder - right.sortOrder)
  };
}

function clone<T>(value: T): T {
  return structuredClone(value);
}
