import { beforeEach, describe, expect, it } from "vitest";

import {
  MemoryWctStore,
  resetMemoryWctStoreForTests
} from "@/lib/wct-store/memory-store";
import type { WctApprovedImportInput, WctDuplicateAction } from "@/lib/wct/types";

const USER_A = "00000000-0000-4000-8000-000000000001";
const USER_B = "00000000-0000-4000-8000-000000000002";

function importInput(overrides: {
  idempotencyKey?: string;
  payloadHash?: string;
  duplicateAction?: WctDuplicateAction;
  patternText?: string;
  exampleText?: string;
  shortLabel?: string;
} = {}): WctApprovedImportInput {
  return {
    idempotencyKey: overrides.idempotencyKey ?? "wct-v1",
    payloadHash: overrides.payloadHash ?? `hash-${overrides.idempotencyKey ?? "wct-v1"}`,
    book: { title: "WCT Pattern book Prenovice", levelLabel: "Pre Novice" },
    days: [{
      dayNumber: 1,
      shortLabel: overrides.shortLabel ?? "수동태",
      sourcePageStart: 7,
      sourcePageEnd: 14,
      duplicateAction: overrides.duplicateAction ?? "create",
      concepts: [{ text: "행위보다 대상을 강조한다.", sourceKind: "book" }],
      patterns: [{
        patternText: overrides.patternText ?? "be + p.p.",
        meaningKo: "수동태",
        usageSource: "book",
        examples: [{
          englishText: overrides.exampleText ?? "It is made of wood.",
          meaningKo: "그것은 나무로 만들어진다."
        }]
      }],
      importantNotes: [{ patternIndex: 0, noteText: "by는 행위자를 나타낸다." }],
      practicePrompts: [{ patternIndex: 0, promptText: "이것은 한국에서 만들어진다." }]
    }]
  };
}

describe("MemoryWctStore", () => {
  beforeEach(() => resetMemoryWctStoreForTests());

  it("isolates books and guessed IDs by owner", async () => {
    const ownerA = new MemoryWctStore({ id: USER_A });
    const ownerB = new MemoryWctStore({ id: USER_B });
    const inserted = await ownerA.importApprovedBatch(importInput());

    expect(await ownerA.listBooks()).toMatchObject([{
      title: "WCT Pattern book Prenovice",
      dayCount: 1
    }]);
    expect(await ownerB.listBooks()).toEqual([]);
    expect(await ownerB.getBook(inserted.bookId)).toBeNull();
    expect(await ownerB.getDay(inserted.operations[0].dayId)).toBeNull();
  });

  it("replays the same key and hash without inserting twice", async () => {
    const store = new MemoryWctStore({ id: USER_A });
    const input = importInput({ idempotencyKey: "same", payloadHash: "hash-a" });

    const first = await store.importApprovedBatch(input);
    const replay = await store.importApprovedBatch(input);

    expect(first.replayed).toBe(false);
    expect(replay).toEqual({ ...first, replayed: true });
    expect(await store.listBooks()).toHaveLength(1);
    expect((await store.getBook(first.bookId))?.days).toHaveLength(1);
  });

  it("rejects an idempotency key reused with another payload hash", async () => {
    const store = new MemoryWctStore({ id: USER_A });
    await store.importApprovedBatch(importInput({
      idempotencyKey: "same",
      payloadHash: "hash-a"
    }));

    await expect(store.importApprovedBatch(importInput({
      idempotencyKey: "same",
      payloadHash: "hash-b"
    }))).rejects.toThrow("Idempotency key already used with a different payload");
  });

  it("replaces an existing Day and its children", async () => {
    const store = new MemoryWctStore({ id: USER_A });
    const seeded = await store.importApprovedBatch(importInput({ idempotencyKey: "seed" }));
    const originalDayId = seeded.operations[0].dayId;

    const result = await store.importApprovedBatch(importInput({
      idempotencyKey: "replace",
      duplicateAction: "replace",
      patternText: "get + p.p.",
      exampleText: "It gets broken."
    }));
    const day = await store.getDay(result.operations[0].dayId);

    expect(result.operations).toEqual([{
      dayNumber: 1,
      action: "replaced",
      dayId: originalDayId
    }]);
    expect(day?.patterns.map((pattern) => pattern.patternText)).toEqual(["get + p.p."]);
    expect(day?.patterns[0].examples.map((example) => example.englishText))
      .toEqual(["It gets broken."]);
  });

  it("merges normalized-missing children and keeps linked notes on one pattern", async () => {
    const store = new MemoryWctStore({ id: USER_A });
    await store.importApprovedBatch(importInput({
      idempotencyKey: "seed",
      patternText: "Be + P.P."
    }));

    const result = await store.importApprovedBatch(importInput({
      idempotencyKey: "merge",
      duplicateAction: "merge",
      patternText: "  be + p.p.  ",
      exampleText: "It gets broken."
    }));
    const day = await store.getDay(result.operations[0].dayId);

    expect(result.operations[0].action).toBe("merged");
    expect(day?.patterns).toHaveLength(1);
    expect(day?.patterns[0].examples.map((example) => example.englishText))
      .toEqual(["It is made of wood.", "It gets broken."]);
    expect(day?.importantNotes).toHaveLength(1);
    expect(day?.importantNotes[0].patternId).toBe(day?.patterns[0].id);
    expect(day?.practicePrompts).toHaveLength(1);
  });

  it("skips an existing Day without changing it", async () => {
    const store = new MemoryWctStore({ id: USER_A });
    const seeded = await store.importApprovedBatch(importInput({ idempotencyKey: "seed" }));
    const before = await store.getDay(seeded.operations[0].dayId);

    const result = await store.importApprovedBatch(importInput({
      idempotencyKey: "skip",
      duplicateAction: "skip",
      patternText: "ignored"
    }));

    expect(result.operations[0].action).toBe("skipped");
    expect(await store.getDay(result.operations[0].dayId)).toEqual(before);
  });

  it("finds duplicate Days using normalized book identity", async () => {
    const store = new MemoryWctStore({ id: USER_A });
    await store.importApprovedBatch(importInput());

    await expect(store.findDuplicateDays("  wct  pattern BOOK prenovice ", [1, 2]))
      .resolves.toEqual([{
        dayNumber: 1,
        existingDayId: expect.any(String),
        existingDisplayLabel: "Day 1 (수동태)"
      }]);
  });
});
