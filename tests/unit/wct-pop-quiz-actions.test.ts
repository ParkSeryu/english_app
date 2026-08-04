import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireCurrentUser: vi.fn(),
  getWctStore: vi.fn(),
  getWctQuizStore: vi.fn(),
  getWctPopQuizStore: vi.fn(),
  startWctPopQuiz: vi.fn(),
  redirect: vi.fn()
}));

vi.mock("@/lib/auth", () => ({ requireCurrentUser: mocks.requireCurrentUser }));
vi.mock("@/lib/wct-store", () => ({ getWctStore: mocks.getWctStore }));
vi.mock("@/lib/wct-quiz-store", () => ({ getWctQuizStore: mocks.getWctQuizStore }));
vi.mock("@/lib/wct-pop-quiz-store", () => ({ getWctPopQuizStore: mocks.getWctPopQuizStore }));
vi.mock("@/lib/wct/pop-quiz/service", () => ({ startWctPopQuiz: mocks.startWctPopQuiz }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

const bookId = "11111111-1111-4111-8111-111111111111";
const attemptId = "22222222-2222-4222-8222-222222222222";

describe("WCT Pop Quiz actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireCurrentUser.mockResolvedValue({
      id: "33333333-3333-4333-8333-333333333333",
      email: "learner@example.com"
    });
  });

  it("rejects invalid confirmation before authentication", async () => {
    const { confirmWctPopQuizAnswerAction } = await import(
      "@/app/lessons/books/[bookId]/pop-quiz/actions"
    );

    await expect(confirmWctPopQuizAnswerAction({ bookId, attemptId, questionId: "", choiceId: "choice-1" }))
      .resolves.toEqual({ ok: false, message: "답안을 확인해 주세요." });
    expect(mocks.requireCurrentUser).not.toHaveBeenCalled();
  });

  it("rejects an invalid start before authentication", async () => {
    const { startWctPopQuizAction } = await import(
      "@/app/lessons/books/[bookId]/pop-quiz/actions"
    );

    await expect(startWctPopQuizAction({ bookId, mode: "invalid" })).resolves.toEqual({
      ok: false,
      message: "Pop Quiz 요청을 확인해 주세요."
    });
    expect(mocks.requireCurrentUser).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("redirects after a successful start", async () => {
    mocks.startWctPopQuiz.mockResolvedValue({ attemptId });
    const { startWctPopQuizAction } = await import(
      "@/app/lessons/books/[bookId]/pop-quiz/actions"
    );

    await expect(startWctPopQuizAction({ bookId, mode: "start" })).resolves.toBeUndefined();
    expect(mocks.startWctPopQuiz).toHaveBeenCalledWith(expect.any(Object), {
      bookId,
      mode: "start"
    });
    expect(mocks.redirect).toHaveBeenCalledWith(`/lessons/books/${bookId}/pop-quiz`);
  });

  it("returns the exact preparation message for an insufficient selector pool", async () => {
    mocks.startWctPopQuiz.mockRejectedValue(new Error("Pop Quiz needs one eligible question per Day"));
    const { startWctPopQuizAction } = await import(
      "@/app/lessons/books/[bookId]/pop-quiz/actions"
    );

    await expect(startWctPopQuizAction({ bookId, mode: "start" })).resolves.toEqual({
      ok: false,
      message: "Pop Quiz 문제를 준비하지 못했습니다"
    });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("returns a Korean start failure without redirecting", async () => {
    mocks.startWctPopQuiz.mockRejectedValue(new Error("unavailable"));
    const { startWctPopQuizAction } = await import(
      "@/app/lessons/books/[bookId]/pop-quiz/actions"
    );

    await expect(startWctPopQuizAction({ bookId, mode: "start" })).resolves.toEqual({
      ok: false,
      message: "Pop Quiz를 시작하지 못했어요. 다시 시도해 주세요."
    });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
  it("confirms a validated answer through the owner-scoped store", async () => {
    const confirmAnswer = vi.fn().mockResolvedValue({
      answer: { questionId: "question-1", choiceId: "choice-1", confirmedAt: "2026-08-03T00:00:00Z" },
      isCorrect: true,
      correctChoiceId: "choice-1",
      currentIndex: 1
    });
    mocks.getWctPopQuizStore.mockReturnValue({ confirmAnswer });
    const { confirmWctPopQuizAnswerAction } = await import(
      "@/app/lessons/books/[bookId]/pop-quiz/actions"
    );
    const input = { bookId, attemptId, questionId: "question-1", choiceId: "choice-1" };

    await expect(confirmWctPopQuizAnswerAction(input)).resolves.toEqual({
      ok: true,
      data: expect.objectContaining({ isCorrect: true, currentIndex: 1 })
    });
    expect(confirmAnswer).toHaveBeenCalledWith(input);
  });

  it("returns a Korean retry message when confirming or completing fails", async () => {
    mocks.getWctPopQuizStore.mockReturnValue({
      confirmAnswer: vi.fn().mockRejectedValue(new Error("offline")),
      completeAttempt: vi.fn().mockRejectedValue(new Error("offline"))
    });
    const { completeWctPopQuizAction, confirmWctPopQuizAnswerAction } = await import(
      "@/app/lessons/books/[bookId]/pop-quiz/actions"
    );

    await expect(confirmWctPopQuizAnswerAction({ bookId, attemptId, questionId: "question-1", choiceId: "choice-1" }))
      .resolves.toEqual({ ok: false, message: "답안을 저장하지 못했어요. 다시 시도해 주세요." });
    await expect(completeWctPopQuizAction({ bookId, attemptId }))
      .resolves.toEqual({ ok: false, message: "결과를 저장하지 못했어요. 다시 시도해 주세요." });
  });
});
