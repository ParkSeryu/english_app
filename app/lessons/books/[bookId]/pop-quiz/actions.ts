"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireCurrentUser } from "@/lib/auth";
import { getWctPopQuizStore } from "@/lib/wct-pop-quiz-store";
import { startWctPopQuiz } from "@/lib/wct/pop-quiz/service";
import { WctPopQuizRestartRequiredError } from "@/lib/wct/pop-quiz/types";
import { getWctQuizStore } from "@/lib/wct-quiz-store";
import { getWctStore } from "@/lib/wct-store";

export type PopQuizActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

const startSchema = z.object({
  bookId: z.uuid(),
  mode: z.enum(["start", "retake"])
}).strict();

const confirmSchema = z.object({
  bookId: z.uuid(),
  attemptId: z.uuid(),
  questionId: z.string().trim().min(1).max(160),
  choiceId: z.string().trim().min(1).max(160)
}).strict();

const completeSchema = z.object({
  bookId: z.uuid(),
  attemptId: z.uuid()
}).strict();

const restartRequiredMessage = "Pop Quiz가 변경됐어요. 새로 시작해 주세요.";

export async function startWctPopQuizAction(input: unknown): Promise<PopQuizActionResult<never>> {
  const parsed = startSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Pop Quiz 요청을 확인해 주세요." };

  try {
    const user = await requireCurrentUser();
    await startWctPopQuiz({
      wctStore: getWctStore(user),
      wctQuizStore: getWctQuizStore(user),
      wctPopQuizStore: getWctPopQuizStore(user)
    }, parsed.data);
  } catch (error) {
    if (error instanceof WctPopQuizRestartRequiredError) {
      return { ok: false, message: restartRequiredMessage };
    }
    if (error instanceof Error && error.message === "Pop Quiz needs one eligible question per Day") {
      return { ok: false, message: "Pop Quiz 문제를 준비하지 못했습니다" };
    }
    return { ok: false, message: "Pop Quiz를 시작하지 못했어요. 다시 시도해 주세요." };
  }

  const bookPath = `/lessons/books/${parsed.data.bookId}`;
  revalidatePath(bookPath);
  revalidatePath(`${bookPath}/pop-quiz`);
  redirect(`${bookPath}/pop-quiz`);
}

export async function confirmWctPopQuizAnswerAction(
  input: unknown
): Promise<PopQuizActionResult<Awaited<ReturnType<ReturnType<typeof getWctPopQuizStore>["confirmAnswer"]>>>> {
  const parsed = confirmSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "답안을 확인해 주세요." };

  try {
    const user = await requireCurrentUser();
    const data = await getWctPopQuizStore(user).confirmAnswer(parsed.data);
    return { ok: true, data };
  } catch (error) {
    if (error instanceof WctPopQuizRestartRequiredError) {
      return { ok: false, message: restartRequiredMessage };
    }
    return { ok: false, message: "답안을 저장하지 못했어요. 다시 시도해 주세요." };
  }
}

export async function completeWctPopQuizAction(
  input: unknown
): Promise<PopQuizActionResult<Awaited<ReturnType<ReturnType<typeof getWctPopQuizStore>["completeAttempt"]>>>> {
  const parsed = completeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "결과를 확인해 주세요." };

  try {
    const user = await requireCurrentUser();
    const data = await getWctPopQuizStore(user).completeAttempt(parsed.data);
    return { ok: true, data };
  } catch (error) {
    if (error instanceof WctPopQuizRestartRequiredError) {
      return { ok: false, message: restartRequiredMessage };
    }
    return { ok: false, message: "결과를 저장하지 못했어요. 다시 시도해 주세요." };
  }
}
