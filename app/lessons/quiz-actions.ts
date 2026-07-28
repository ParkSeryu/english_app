"use server";

import { requireCurrentUser } from "@/lib/auth";
import { getWctQuizStore } from "@/lib/wct-quiz-store";
import type { WctQuizActionResult } from "@/lib/wct/quiz/types";
import { wctQuizSubmissionSchema } from "@/lib/wct/quiz/validation";

export async function submitWctQuizAttemptAction(
  input: unknown
): Promise<WctQuizActionResult> {
  const parsed = wctQuizSubmissionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "답안을 확인해 주세요." };
  }

  try {
    const user = await requireCurrentUser();
    const result = await getWctQuizStore(user).submitAttempt(parsed.data);
    return { ok: true, ...result };
  } catch {
    return {
      ok: false,
      message: "결과를 저장하지 못했어요. 다시 시도해 주세요."
    };
  }
}
