import { NextResponse } from "next/server";

import { getAdminWctQuizStore } from "@/lib/wct-quiz-store";
import { getAdminWctStore } from "@/lib/wct-store";
import { getE2EFakeUserId, isE2EMemoryMode } from "@/lib/test-mode";
import { getWctPremiumLesson } from "@/lib/wct/premium-lessons";
import {
  ensureImportedWctQuizzes,
  ensurePremiumWctQuiz
} from "@/lib/wct/quiz/ensure";
import {
  premiumWctLessonKey,
  standardWctLessonKey
} from "@/lib/wct/quiz/keys";
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
  const prenoviceTitle = "WCT Pattern book Prenovice";
  const prenoviceDays = Array.from({ length: 16 }, (_, index) => {
    const dayNumber = index + 1;
    if (dayNumber === 1) return day(dayNumber, "수동태", passiveQuizPatterns());
    if (dayNumber === 13) return day(dayNumber, "if 가능", conditionalQuizPatterns());
    if (dayNumber === 16) return day(dayNumber, "간접의문문", indirectQuizPatterns());
    return day(dayNumber, naturalTopic(dayNumber), naturalPatterns(dayNumber));
  });
  const result = await store.importApprovedBatch({
    idempotencyKey: "e2e-wct-prenovice-book-v2",
    payloadHash: "e2e-wct-prenovice-book-hash-v2",
    book: { title: prenoviceTitle, levelLabel: "Pre Novice" },
    days: prenoviceDays
  });
  await ensureImportedWctQuizzes(
    store,
    getAdminWctQuizStore(user),
    result
  );

  const noviceTitle = "WCT Pattern book Novice";
  const noviceDays = Array.from({ length: 28 }, (_, index) => (
    day(index + 1, naturalTopic(index + 1), naturalPatterns(index + 1))
  ));
  const noviceResult = await store.importApprovedBatch({
    idempotencyKey: "e2e-wct-novice-book-v2",
    payloadHash: "e2e-wct-novice-book-hash-v2",
    book: { title: noviceTitle, levelLabel: "Novice" },
    days: noviceDays
  });
  await ensureImportedWctQuizzes(
    store,
    getAdminWctQuizStore(user),
    noviceResult
  );

  const premiumLesson = getWctPremiumLesson("day-1");
  if (!premiumLesson) throw new Error("WCT E2E seed could not find Premium Day 1");
  const premiumQuizStore = getAdminWctQuizStore(user);
  await ensurePremiumWctQuiz(premiumQuizStore, premiumLesson);
  const premiumQuizSet = await premiumQuizStore.getSetByLessonKey(
    premiumWctLessonKey(premiumLesson.id)
  );
  if (!premiumQuizSet) throw new Error("WCT E2E seed could not create the Premium quiz");

  const otherOwner = { id: OTHER_OWNER_ID, email: "other@example.com" };
  const otherOwnerStore = getAdminWctStore(otherOwner);
  const otherOwnerResult = await otherOwnerStore.importApprovedBatch({
      idempotencyKey: "e2e-other-wct-book-v1",
      payloadHash: "e2e-other-wct-book-hash-v1",
      book: { title: "Other Owner WCT" },
      days: [day(1, "비공개", passivePatterns())]
    });
  const day13Id = result.operations.find(
    (operation) => operation.dayNumber === 13
  )?.dayId;
  const noviceDay13Id = noviceResult.operations.find(
    (operation) => operation.dayNumber === 13
  )?.dayId;
  const otherOwnerDayId = otherOwnerResult.operations[0]?.dayId;
  if (!day13Id || !noviceDay13Id || !otherOwnerDayId) {
    throw new Error("WCT E2E seed did not create the expected Days");
  }

  const questions = await seededQuestions(user, [
    {
      level: "prenovice",
      title: prenoviceTitle,
      days: prenoviceDays,
      operations: result.operations
    },
    {
      level: "novice",
      title: noviceTitle,
      days: noviceDays,
      operations: noviceResult.operations
    }
  ]);

  return NextResponse.json({
    bookId: result.bookId,
    day13Id,
    prenoviceBookId: result.bookId,
    prenoviceDayCount: prenoviceDays.length,
    prenoviceDay13Id: day13Id,
    noviceBookId: noviceResult.bookId,
    noviceDayCount: noviceDays.length,
    noviceDay13Id,
    questions,
    premiumQuizSet: {
      generatorVersion: premiumQuizSet.generatorVersion,
      questions: premiumQuizSet.questions
    },
    otherOwnerBookId: otherOwnerResult.bookId,
    otherOwnerDayId
  });
}

async function seededQuestions(
  user: { id: string; email: string },
  books: Array<{
    level: "prenovice" | "novice";
    title: string;
    days: WctImportDayInput[];
    operations: Array<{ dayId: string; dayNumber: number }>;
  }>
) {
  const quizStore = getAdminWctQuizStore(user);
  const questions: Array<{
    id: string;
    level: "prenovice" | "novice";
    dayNumber: number;
    format: "multiple_choice" | "fill_blank" | "true_false";
    prompt: string;
    choiceTexts: string[];
    correctChoiceText: string;
    dayId: string;
    sourceText: string;
  }> = [];
  for (const { level, title, days, operations } of books) {
    const dayIdByNumber = new Map(operations.map((operation) => [operation.dayNumber, operation.dayId]));
    const dayTopicByNumber = new Map(days.map((seedDay) => [seedDay.dayNumber, seedDay.shortLabel]));
    const sets = await quizStore.listSetsByLessonKeys(
      operations.map((operation) => standardWctLessonKey(title, operation.dayNumber))
    );
    for (const set of sets) {
      const dayNumber = operations.find((operation) => (
        standardWctLessonKey(title, operation.dayNumber) === set.lessonKey
      ))?.dayNumber;
      if (!dayNumber) throw new Error("WCT E2E seed could not map a quiz set to its Day");
      const dayId = dayIdByNumber.get(dayNumber);
      if (!dayId) throw new Error("WCT E2E seed could not map a quiz set Day ID");
      const dayTopic = dayTopicByNumber.get(dayNumber);
      if (!dayTopic) throw new Error("WCT E2E seed could not map a quiz set Day topic");
      for (const question of set.questions) {
        if (!question.format) {
          throw new Error("WCT E2E standard seed unexpectedly created a v1 question");
        }
        const correctChoiceText = question.choices.find((choice) => choice.id === question.correctChoiceId)?.text;
        if (!correctChoiceText) throw new Error("WCT E2E seed could not find a correct quiz choice");
        questions.push({
          id: question.id,
          level,
          dayNumber,
          format: question.format,
          prompt: question.prompt,
          choiceTexts: question.choices.map((choice) => choice.text),
          correctChoiceText,
          dayId,
          sourceText: `Day ${dayNumber} · ${dayTopic}`
        });
      }
    }
  }
  return questions;
}

const NATURAL_TOPICS = [
  ["아침 준비", "prepare breakfast", "아침을 준비할"],
  ["도서관 이용", "visit the library", "도서관을 방문할"],
  ["숙제 계획", "finish the homework", "숙제를 끝낼"],
  ["친구와 약속", "meet a friend", "친구를 만날"],
  ["주말 산책", "take a walk", "산책할"],
  ["저녁 요리", "cook dinner", "저녁을 요리할"],
  ["방 정리", "clean the room", "방을 청소할"],
  ["음악 연습", "practice the piano", "피아노를 연습할"],
  ["사진 촬영", "take a photo", "사진을 찍을"],
  ["버스 타기", "catch the bus", "버스를 탈"],
  ["선물 고르기", "choose a gift", "선물을 고를"],
  ["회의 준비", "prepare for the meeting", "회의를 준비할"],
  ["전화 걸기", "call a friend", "친구에게 전화할"],
  ["여행 계획", "plan the trip", "여행을 계획할"],
  ["책 읽기", "finish the book", "책을 다 읽을"],
  ["질문하기", "ask the teacher", "선생님께 질문할"],
  ["옷 고르기", "choose an outfit", "옷을 고를"],
  ["식물 돌보기", "water the plants", "식물에 물을 줄"],
  ["박물관 관람", "visit the museum", "박물관을 방문할"],
  ["발표 연습", "practice the speech", "발표를 연습할"],
  ["기차 예약", "book a train ticket", "기차표를 예약할"],
  ["점심 주문", "order lunch", "점심을 주문할"],
  ["공원 운동", "exercise in the park", "공원에서 운동할"],
  ["편지 쓰기", "write a letter", "편지를 쓸"],
  ["시장 방문", "visit the market", "시장을 방문할"],
  ["영화 선택", "choose a movie", "영화를 고를"],
  ["가방 챙기기", "pack the bag", "가방을 챙길"],
  ["날씨 확인", "check the weather", "날씨를 확인할"]
] as const;

function naturalTopic(dayNumber: number) {
  return NATURAL_TOPICS[(dayNumber - 1) % NATURAL_TOPICS.length][0];
}

function naturalPatterns(dayNumber: number): WctImportDayInput["patterns"] {
  const [, activity, koreanActivity] = NATURAL_TOPICS[
    (dayNumber - 1) % NATURAL_TOPICS.length
  ];
  return [
    {
      patternText: "can + base verb (ability modal)",
      meaningKo: "~할 수 있다",
      usageSource: "book",
      examples: [
        {
          englishText: `I can ${activity} today.`,
          meaningKo: `나는 오늘 ${koreanActivity} 수 있다.`
        },
        {
          englishText: `She can ${activity} after lunch.`,
          meaningKo: `그녀는 점심 후 ${koreanActivity} 수 있다.`
        }
      ]
    },
    {
      patternText: "will + base verb (future modal)",
      meaningKo: "~할 것이다",
      usageSource: "book",
      examples: [
        {
          englishText: `We will ${activity} tomorrow.`,
          meaningKo: `우리는 내일 ${koreanActivity} 것이다.`
        },
        {
          englishText: `He will ${activity} this weekend.`,
          meaningKo: `그는 이번 주말 ${koreanActivity} 것이다.`
        }
      ]
    },
    {
      patternText: "should + base verb (advice modal)",
      meaningKo: "~하는 게 좋다",
      usageSource: "book",
      examples: [
        {
          englishText: `You should ${activity} carefully.`,
          meaningKo: `너는 ${koreanActivity} 때 신중하게 하는 게 좋다.`
        }
      ]
    }
  ];
}

function passiveQuizPatterns(): WctImportDayInput["patterns"] {
  return [
    {
      patternText: "can be + past participle (passive modal)",
      meaningKo: "~될 수 있다",
      usageSource: "book",
      examples: [
        { englishText: "The room can be cleaned today.", meaningKo: "그 방은 오늘 청소될 수 있다." },
        { englishText: "The package can be delivered tomorrow.", meaningKo: "그 소포는 내일 배달될 수 있다." }
      ]
    },
    {
      patternText: "will be + past participle (future passive modal)",
      meaningKo: "~될 것이다",
      usageSource: "book",
      examples: [
        { englishText: "The bridge will be repaired soon.", meaningKo: "그 다리는 곧 수리될 것이다." },
        { englishText: "The results will be shared later.", meaningKo: "그 결과는 나중에 공유될 것이다." }
      ]
    },
    {
      patternText: "should be + past participle (advice passive modal)",
      meaningKo: "~되어야 한다",
      usageSource: "book",
      examples: [
        { englishText: "The form should be checked carefully.", meaningKo: "그 양식은 꼼꼼히 확인되어야 한다." }
      ]
    }
  ];
}

function conditionalQuizPatterns(): WctImportDayInput["patterns"] {
  return [
    {
      patternText: "conditional: if + present tense, will + base verb",
      meaningKo: "~하면 ~할 것이다",
      usageSource: "ai_supplement",
      examples: [
        { englishText: "If I have time, I will call you.", meaningKo: "시간이 있으면 전화할게." },
        { englishText: "If it rains, we will stay home.", meaningKo: "비가 오면 우리는 집에 있을 것이다." }
      ]
    },
    {
      patternText: "conditional: unless + present tense, will + base verb",
      meaningKo: "~하지 않으면 ~할 것이다",
      usageSource: "book",
      examples: [
        { englishText: "Unless you hurry, you will miss the bus.", meaningKo: "서두르지 않으면 버스를 놓칠 것이다." },
        { englishText: "Unless she calls, I will leave early.", meaningKo: "그녀가 전화하지 않으면 나는 일찍 떠날 것이다." }
      ]
    },
    {
      patternText: "conditional: when + present tense, will + base verb",
      meaningKo: "~할 때 ~할 것이다",
      usageSource: "book",
      examples: [
        { englishText: "When he arrives, we will start dinner.", meaningKo: "그가 도착하면 우리는 저녁을 시작할 것이다." }
      ]
    }
  ];
}

function indirectQuizPatterns(): WctImportDayInput["patterns"] {
  return [
    {
      patternText: "indirect question word order: where + subject + can",
      meaningKo: "어디에서 ~할 수 있는지",
      usageSource: "book",
      examples: [
        { englishText: "Do you know where she can park?", meaningKo: "그녀가 어디에 주차할 수 있는지 아니?" },
        { englishText: "Can you tell me where we can wait?", meaningKo: "우리가 어디에서 기다릴 수 있는지 말해 줄래?" }
      ]
    },
    {
      patternText: "indirect question word order: when + subject + will",
      meaningKo: "언제 ~할 것인지",
      usageSource: "book",
      examples: [
        { englishText: "Do you know when he will arrive?", meaningKo: "그가 언제 도착할지 아니?" },
        { englishText: "Can you tell me when they will leave?", meaningKo: "그들이 언제 떠날지 말해 줄래?" }
      ]
    },
    {
      patternText: "indirect question word order: why + subject + is",
      meaningKo: "왜 ~한지",
      usageSource: "book",
      examples: [
        { englishText: "Do you know why he is upset?", meaningKo: "그가 왜 속상해하는지 아니?" }
      ]
    }
  ];
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
