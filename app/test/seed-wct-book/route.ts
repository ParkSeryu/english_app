import { NextResponse } from "next/server";

import { getAdminWctStore } from "@/lib/wct-store";
import { getE2EFakeUserId, isE2EMemoryMode } from "@/lib/test-mode";
import type { WctImportDayInput } from "@/lib/wct/types";

const OTHER_OWNER_ID = "00000000-0000-4000-8000-000000000099";

function day(
  dayNumber: number,
  shortLabel: string,
  patterns: WctImportDayInput["patterns"] = []
): WctImportDayInput {
  return {
    dayNumber,
    shortLabel,
    learningSummary: dayNumber === 13 ? "가능성을 조건으로 말한다." : null,
    duplicateAction: "create",
    concepts: dayNumber === 13
      ? [{ text: "if 뒤에는 조건을 둔다.", sourceKind: "book" }]
      : [],
    patterns,
    importantNotes: dayNumber === 13
      ? [{ patternIndex: 0, noteText: "will을 if절에 바로 쓰지 않는다." }]
      : [],
    practicePrompts: dayNumber === 13
      ? [{ patternIndex: 0, promptText: "시간이 되면 전화할게." }]
      : []
  };
}

export async function POST() {
  if (!isE2EMemoryMode()) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const fakeUserId = getE2EFakeUserId();
  if (!fakeUserId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await getAdminWctStore({ id: fakeUserId, email: "e2e@example.com" })
    .importApprovedBatch({
      idempotencyKey: "e2e-wct-book-v1",
      payloadHash: "e2e-wct-book-hash-v1",
      book: { title: "WCT Pattern book Prenovice", levelLabel: "Pre Novice" },
      days: [
        day(1, "수동태", [{
          patternText: "be + p.p.",
          meaningKo: "수동태",
          usageSource: "book",
          examples: [{ englishText: "It is made of wood.", meaningKo: "그것은 나무로 만들어진다." }]
        }]),
        day(13, "if 가능", [{
          patternText: "If + 현재, will + 동사원형",
          meaningKo: "~하면 ~할 것이다",
          usageNote: "조건절에는 현재형을 사용한다.",
          usageSource: "ai_supplement",
          examples: [{ englishText: "If I have time, I will call you." }]
        }]),
        day(16, "간접의문문", [{
          patternText: "Do you know + 의문사 + 주어 + 동사?",
          usageSource: "book",
          examples: [{ englishText: "Do you know where he lives?" }]
        }])
      ]
    });

  const otherOwnerResult = await getAdminWctStore({ id: OTHER_OWNER_ID, email: "other@example.com" })
    .importApprovedBatch({
      idempotencyKey: "e2e-other-wct-book-v1",
      payloadHash: "e2e-other-wct-book-hash-v1",
      book: { title: "Other Owner WCT" },
      days: [day(1, "비공개")]
    });

  return NextResponse.json({
    bookId: result.bookId,
    otherOwnerBookId: otherOwnerResult.bookId
  });
}
