"use server";

import { requireCurrentUser } from "@/lib/auth";
import { getWctQuizStore } from "@/lib/wct-quiz-store";
import { getWctStore } from "@/lib/wct-store";
import {
  isCurrentStandardWctQuizSet
} from "@/lib/wct/quiz/current-set";
import { standardWctLessonKey } from "@/lib/wct/quiz/keys";
import type {
  WctQuizActionResult,
  WctQuizSourceContext,
  WctQuizSubmission
} from "@/lib/wct/quiz/types";
import { wctQuizSubmissionSchema } from "@/lib/wct/quiz/validation";
import type { WctDay } from "@/lib/wct/types";

const staleQuizMessage = "퀴즈가 변경되어 다시 준비해야 해요.";

function parseActionInput(input: unknown): {
  submission: WctQuizSubmission;
  sourceContext?: WctQuizSourceContext;
} | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const raw = input as Record<string, unknown>;
  if (Object.keys(raw).some((key) => ![
    "quizSetId",
    "answers",
    "sourceContext"
  ].includes(key))) return null;
  const submission = wctQuizSubmissionSchema.safeParse({
    quizSetId: raw.quizSetId,
    answers: raw.answers
  });
  if (!submission.success) return null;
  if (raw.sourceContext === undefined) return { submission: submission.data };
  if (
    !raw.sourceContext
    || typeof raw.sourceContext !== "object"
    || Array.isArray(raw.sourceContext)
  ) return null;
  const context = raw.sourceContext as Record<string, unknown>;
  if (
    Object.keys(context).length !== 2
    || typeof context.bookId !== "string"
    || !context.bookId.trim()
    || context.bookId.length > 240
    || typeof context.dayId !== "string"
    || !context.dayId.trim()
    || context.dayId.length > 240
  ) return null;
  return {
    submission: submission.data,
    sourceContext: {
      bookId: context.bookId.trim(),
      dayId: context.dayId.trim()
    }
  };
}

export async function submitWctQuizAttemptAction(
  input: unknown
): Promise<WctQuizActionResult> {
  const parsed = parseActionInput(input);
  if (!parsed) {
    return { ok: false, message: "답안을 확인해 주세요." };
  }

  try {
    const user = await requireCurrentUser();
    const quizStore = getWctQuizStore(user);
    if (parsed.sourceContext) {
      const wctStore = getWctStore(user);
      const book = await wctStore.getBook(parsed.sourceContext.bookId);
      if (!book) return { ok: false, message: staleQuizMessage };
      const [day, ...loadedDays] = await Promise.all([
        wctStore.getDay(parsed.sourceContext.dayId),
        ...book.days.map((item) => wctStore.getDay(item.id))
      ]);
      if (
        !day
        || day.bookId !== book.id
        || loadedDays.some((item) => item === null)
      ) {
        return { ok: false, message: staleQuizMessage };
      }
      const allDays = loadedDays as WctDay[];
      const quizSet = await quizStore.getSetByLessonKey(
        standardWctLessonKey(book.title, day.dayNumber)
      );
      if (
        !quizSet
        || quizSet.id !== parsed.submission.quizSetId
        || !isCurrentStandardWctQuizSet({ book, day, allDays, quizSet })
      ) {
        return { ok: false, message: staleQuizMessage };
      }
    }

    const result = await quizStore.submitAttempt(parsed.submission);
    return { ok: true, ...result };
  } catch {
    return {
      ok: false,
      message: "결과를 저장하지 못했어요. 다시 시도해 주세요."
    };
  }
}
