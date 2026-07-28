import { NextResponse } from "next/server";

import { getAdminWctQuizStore } from "@/lib/wct-quiz-store";
import { getAdminWctStore } from "@/lib/wct-store";
import { getE2EFakeUserId, isE2EMemoryMode } from "@/lib/test-mode";
import { ensureImportedWctQuizzes } from "@/lib/wct/quiz/ensure";
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

  const user = { id: fakeUserId, email: "e2e@example.com" };
  const store = getAdminWctStore(user);
  const result = await store.importApprovedBatch({
      idempotencyKey: "e2e-wct-book-v1",
      payloadHash: "e2e-wct-book-hash-v1",
      book: { title: "WCT Pattern book Prenovice", levelLabel: "Pre Novice" },
      days: [
        day(1, "수동태", passivePatterns()),
        day(13, "if 가능", conditionalPatterns()),
        day(16, "간접의문문", indirectQuestionPatterns())
      ]
    });
  await ensureImportedWctQuizzes(
    store,
    getAdminWctQuizStore(user),
    result
  );

  const otherOwner = { id: OTHER_OWNER_ID, email: "other@example.com" };
  const otherOwnerStore = getAdminWctStore(otherOwner);
  const otherOwnerResult = await otherOwnerStore.importApprovedBatch({
      idempotencyKey: "e2e-other-wct-book-v1",
      payloadHash: "e2e-other-wct-book-hash-v1",
      book: { title: "Other Owner WCT" },
      days: [day(1, "비공개", passivePatterns())]
    });
  await ensureImportedWctQuizzes(
    otherOwnerStore,
    getAdminWctQuizStore(otherOwner),
    otherOwnerResult
  );

  const day13Id = result.operations.find(
    (operation) => operation.dayNumber === 13
  )?.dayId;
  const otherOwnerDayId = otherOwnerResult.operations[0]?.dayId;
  if (!day13Id || !otherOwnerDayId) {
    throw new Error("WCT E2E seed did not create the expected Days");
  }

  return NextResponse.json({
    bookId: result.bookId,
    day13Id,
    otherOwnerBookId: otherOwnerResult.bookId,
    otherOwnerDayId
  });
}

function passivePatterns(): WctImportDayInput["patterns"] {
  return [
    {
      patternText: "be + p.p.",
      meaningKo: "수동태",
      usageSource: "book",
      examples: [
        {
          englishText: "It is made of wood.",
          meaningKo: "그것은 나무로 만들어진다."
        },
        {
          englishText: "The room is cleaned every day.",
          meaningKo: "그 방은 매일 청소된다."
        }
      ]
    },
    {
      patternText: "was / were + p.p.",
      meaningKo: "과거 수동태",
      usageSource: "book",
      examples: [
        {
          englishText: "The bridge was built in 1990.",
          meaningKo: "그 다리는 1990년에 지어졌다."
        },
        {
          englishText: "The letters were sent yesterday.",
          meaningKo: "그 편지들은 어제 보내졌다."
        }
      ]
    }
  ];
}

function conditionalPatterns(): WctImportDayInput["patterns"] {
  return [
    {
      patternText: "If + 현재, will + 동사원형",
      meaningKo: "~하면 ~할 것이다",
      usageNote: "조건절에는 현재형을 사용한다.",
      usageSource: "ai_supplement",
      examples: [
        {
          englishText: "If I have time, I will call you.",
          meaningKo: "시간이 있으면 전화할게."
        },
        {
          englishText: "If it rains, we will stay home.",
          meaningKo: "비가 오면 우리는 집에 있을 거야."
        }
      ]
    },
    {
      patternText: "Unless + 현재, will + 동사원형",
      meaningKo: "~하지 않으면 ~할 것이다",
      usageSource: "book",
      examples: [
        {
          englishText: "Unless you hurry, you will miss the bus.",
          meaningKo: "서두르지 않으면 버스를 놓칠 거야."
        },
        {
          englishText: "Unless she calls, I will leave.",
          meaningKo: "그녀가 전화하지 않으면 나는 떠날 거야."
        }
      ]
    }
  ];
}

function indirectQuestionPatterns(): WctImportDayInput["patterns"] {
  return [
    {
      patternText: "Do you know + 의문사 + 주어 + 동사?",
      meaningKo: "~인지 아니?",
      usageSource: "book",
      examples: [
        {
          englishText: "Do you know where he lives?",
          meaningKo: "그가 어디에 사는지 아니?"
        },
        {
          englishText: "Do you know what she wants?",
          meaningKo: "그녀가 무엇을 원하는지 아니?"
        }
      ]
    },
    {
      patternText: "Can you tell me + 의문사 + 주어 + 동사?",
      meaningKo: "~인지 말해 줄래?",
      usageSource: "book",
      examples: [
        {
          englishText: "Can you tell me when it starts?",
          meaningKo: "그것이 언제 시작하는지 말해 줄래?"
        },
        {
          englishText: "Can you tell me why he left?",
          meaningKo: "그가 왜 떠났는지 말해 줄래?"
        }
      ]
    }
  ];
}
