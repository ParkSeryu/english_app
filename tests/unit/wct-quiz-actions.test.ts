import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getWctQuizStore: vi.fn(),
  requireCurrentUser: vi.fn(),
  submitAttempt: vi.fn()
}));

vi.mock("@/lib/auth", () => ({
  requireCurrentUser: mocks.requireCurrentUser
}));

vi.mock("@/lib/wct-quiz-store", () => ({
  getWctQuizStore: mocks.getWctQuizStore
}));

const submission = {
  quizSetId: "11111111-1111-4111-8111-111111111111",
  answers: Array.from({ length: 5 }, (_, index) => ({
    questionId: `question-${index + 1}`,
    choiceId: `choice-${index + 1}-1`
  }))
};

describe("submitWctQuizAttemptAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireCurrentUser.mockResolvedValue({
      id: "22222222-2222-4222-8222-222222222222",
      email: "learner@example.com"
    });
    mocks.getWctQuizStore.mockReturnValue({
      submitAttempt: mocks.submitAttempt
    });
  });

  it("authenticates and returns the store-calculated score", async () => {
    mocks.submitAttempt.mockResolvedValue({
      score: 4,
      total: 5,
      completedAt: "2026-07-28T00:00:00Z"
    });
    const { submitWctQuizAttemptAction } = await import(
      "@/app/lessons/quiz-actions"
    );

    await expect(submitWctQuizAttemptAction(submission)).resolves.toEqual({
      ok: true,
      score: 4,
      total: 5,
      completedAt: "2026-07-28T00:00:00Z"
    });
    expect(mocks.getWctQuizStore).toHaveBeenCalledWith({
      id: "22222222-2222-4222-8222-222222222222",
      email: "learner@example.com"
    });
    expect(mocks.submitAttempt).toHaveBeenCalledWith(submission);
  });

  it("rejects invalid answers before authentication", async () => {
    const { submitWctQuizAttemptAction } = await import(
      "@/app/lessons/quiz-actions"
    );

    await expect(submitWctQuizAttemptAction({
      ...submission,
      answers: submission.answers.slice(0, 4)
    })).resolves.toEqual({
      ok: false,
      message: "답안을 확인해 주세요."
    });
    expect(mocks.requireCurrentUser).not.toHaveBeenCalled();
    expect(mocks.submitAttempt).not.toHaveBeenCalled();
  });

  it("returns a retryable message when saving fails", async () => {
    mocks.submitAttempt.mockRejectedValue(new Error("database unavailable"));
    const { submitWctQuizAttemptAction } = await import(
      "@/app/lessons/quiz-actions"
    );

    await expect(submitWctQuizAttemptAction(submission)).resolves.toEqual({
      ok: false,
      message: "결과를 저장하지 못했어요. 다시 시도해 주세요."
    });
  });
});
