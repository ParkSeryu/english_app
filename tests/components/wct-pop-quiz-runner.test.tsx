import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WctPopQuizRunner } from "@/components/wct/WctPopQuizRunner";
import type { WctPopQuizAttempt } from "@/lib/wct/pop-quiz/types";

const mocks = vi.hoisted(() => ({
  confirmWctPopQuizAnswerAction: vi.fn(),
  completeWctPopQuizAction: vi.fn(),
  startWctPopQuizAction: vi.fn()
}));

vi.mock("@/app/lessons/books/[bookId]/pop-quiz/actions", () => mocks);

const attempt: WctPopQuizAttempt = {
  attemptId: "11111111-1111-4111-8111-111111111111",
  bookId: "22222222-2222-4222-8222-222222222222",
  seed: "seed",
  questions: Array.from({ length: 16 }, (_, index) => {
    const number = index + 1;
    return {
      sourceQuizSetId: `set-${number}`,
      dayId: `day-${number}`,
      dayNumber: number,
      dayLabel: `Day ${number}`,
      dayTopic: number === 1 ? "Topic 1" : undefined,
      band: number <= 5 ? "early" as const : number <= 11 ? "middle" as const : "late" as const,
      question: {
        id: `question-${number}`,
        kind: number <= 12 ? "translation" as const : "pattern" as const,
        ...(number === 1 ? {
          format: "true_false" as const,
          feedback: {
            correctSentence: "Correct sentence 1",
            pattern: "Pattern 1",
            reason: "Reason 1"
          }
        } : {}),
        prompt: `Question ${number}`,
        choices: [
          { id: `choice-${number}-1`, text: number === 1 ? "O" : `Correct ${number}` },
          { id: `choice-${number}-2`, text: number === 1 ? "X" : `Wrong ${number}` }
        ],
        correctChoiceId: `choice-${number}-1`,
        explanation: `Explanation ${number}`
      }
    };
  }),
  answers: [],
  currentIndex: 0,
  status: "in_progress",
  latestScore: null,
  incorrectDays: [],
  startedAt: "2026-08-03T00:00:00.000Z",
  completedAt: null
};

function confirmation(index: number, choiceId = `choice-${index + 1}-1`) {
  return {
    ok: true as const,
    data: {
      answer: {
        questionId: `question-${index + 1}`,
        choiceId,
        confirmedAt: "2026-08-03T00:00:00.000Z"
      },
      isCorrect: choiceId === `choice-${index + 1}-1`,
      correctChoiceId: `choice-${index + 1}-1`,
      currentIndex: index + 1
    }
  };
}

describe("WctPopQuizRunner", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.confirmWctPopQuizAnswerAction.mockResolvedValue(confirmation(0));
    mocks.completeWctPopQuizAction.mockResolvedValue({
      ok: true,
      data: {
        score: 14,
        total: 16,
        incorrectDays: [
          { dayId: "day-13", dayNumber: 13, dayLabel: "Day 13" },
          { dayId: "day-13", dayNumber: 13, dayLabel: "Day 13" }
        ],
        completedAt: "2026-08-03T00:00:00.000Z"
      }
    });
  });

  it("restores the first unanswered question from stored confirmed answers", () => {
    render(
      <WctPopQuizRunner
        attempt={{
          ...attempt,
          currentIndex: 1,
          answers: [{
            questionId: "question-1",
            choiceId: "choice-1-2",
            confirmedAt: "2026-08-03T00:00:00.000Z"
          }]
        }}
        returnHref="/lessons/books/book-1"
      />
    );

    expect(screen.getByText("2 / 16")).toBeVisible();
    expect(screen.getByText("Question 2")).toBeVisible();
    expect(screen.queryByText("Explanation 2")).not.toBeInTheDocument();
  });

  it("keeps feedback hidden while saving and confirms the selected O/X choice after success", async () => {
    const user = userEvent.setup();
    let resolveConfirmation: (value: ReturnType<typeof confirmation>) => void;
    mocks.confirmWctPopQuizAnswerAction.mockReturnValue(new Promise((resolve) => {
      resolveConfirmation = resolve;
    }));
    render(<WctPopQuizRunner attempt={attempt} returnHref="/lessons/books/book-1" />);

    expect(screen.queryByText("Day 1 · Topic 1")).not.toBeInTheDocument();
    expect(screen.getByText("O/X")).toBeVisible();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "X" }));
    await user.click(screen.getByRole("button", { name: "O" }));
    await user.click(screen.getByRole("button", { name: "정답 확인" }));

    await waitFor(() => {
      expect(mocks.confirmWctPopQuizAnswerAction).toHaveBeenCalledWith({
        bookId: attempt.bookId,
        attemptId: attempt.attemptId,
        questionId: "question-1",
        choiceId: "choice-1-1"
      });
    });
    expect(screen.queryByText("정답이에요")).not.toBeInTheDocument();
    expect(screen.queryByText("Day 1 · Topic 1")).not.toBeInTheDocument();
    expect(screen.queryByText("정답 문장 · Correct sentence 1"))
      .not.toBeInTheDocument();
    expect(screen.queryByText("Reason 1")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "O" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "정답 확인" })).toBeDisabled();

    resolveConfirmation!(confirmation(0));
    const feedbackPanel = (await screen.findByText("정답이에요")).parentElement;
    expect(feedbackPanel).not.toBeNull();
    expect(feedbackPanel).toHaveAttribute("aria-live", "polite");
    expect(within(feedbackPanel!).getByText("Day 1 · Topic 1")).toBeVisible();
    expect(screen.getByText("정답 문장 · Correct sentence 1")).toBeVisible();
    expect(screen.getByText("원래 패턴 · Pattern 1")).toBeVisible();
    expect(screen.getByText("Reason 1")).toBeVisible();
    expect(screen.getByRole("button", { name: "다음 문제" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "다음 문제" }));
    expect(screen.getByText("2 / 16")).toBeVisible();
  });

  it("shows a legacy stored Day label only after confirmation", async () => {
    const user = userEvent.setup();
    mocks.confirmWctPopQuizAnswerAction.mockResolvedValue(confirmation(1));
    render(<WctPopQuizRunner attempt={{ ...attempt, currentIndex: 1 }} returnHref="/lessons/books/book-1" />);

    expect(screen.queryByText("Day 2")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Correct 2" }));
    await user.click(screen.getByRole("button", { name: "정답 확인" }));

    const feedbackPanel = (await screen.findByText("정답이에요")).parentElement;
    expect(feedbackPanel).not.toBeNull();
    expect(feedbackPanel).toHaveAttribute("aria-live", "polite");
    expect(within(feedbackPanel!).getByText("Day 2")).toBeVisible();
  });

  it("keeps feedback hidden after an action error and confirms after retry", async () => {
    const user = userEvent.setup();
    mocks.confirmWctPopQuizAnswerAction
      .mockResolvedValueOnce({ ok: false, message: "답안을 저장하지 못했어요. 다시 시도해 주세요." })
      .mockResolvedValueOnce(confirmation(0));
    render(<WctPopQuizRunner attempt={attempt} returnHref="/lessons/books/book-1" />);

    await user.click(screen.getByRole("button", { name: "X" }));
    await user.click(screen.getByRole("button", { name: "정답 확인" }));

    expect(await screen.findByText("답안을 저장하지 못했어요. 다시 시도해 주세요.")).toBeVisible();
    expect(screen.queryByText("아쉬워요. 정답을 확인해 보세요.")).not.toBeInTheDocument();
    expect(screen.queryByText("Day 1 · Topic 1")).not.toBeInTheDocument();
    expect(screen.queryByText("정답 문장 · Correct sentence 1"))
      .not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "X" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "정답 확인" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "저장 다시 시도" }));

    await waitFor(() => expect(mocks.confirmWctPopQuizAnswerAction).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("아쉬워요. 정답을 확인해 보세요.")).toBeVisible();
    expect(screen.getByRole("button", { name: "다음 문제" })).toBeEnabled();
    expect(screen.getByText("1 / 16")).toBeVisible();
  });

  it("keeps feedback hidden when the answer action rejects and allows retry", async () => {
    const user = userEvent.setup();
    mocks.confirmWctPopQuizAnswerAction
      .mockRejectedValueOnce(new Error("network failure"))
      .mockResolvedValueOnce(confirmation(0));
    render(<WctPopQuizRunner attempt={attempt} returnHref="/lessons/books/book-1" />);

    await user.click(screen.getByRole("button", { name: "O" }));
    await user.click(screen.getByRole("button", { name: "정답 확인" }));

    expect(await screen.findByText("답안을 저장하지 못했어요. 다시 시도해 주세요.")).toBeVisible();
    expect(screen.queryByText("정답이에요")).not.toBeInTheDocument();
    expect(screen.queryByText("Day 1 · Topic 1")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "O" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "저장 다시 시도" }));
    expect(await screen.findByText("정답이에요")).toBeVisible();
    expect(screen.getByText("Day 1 · Topic 1")).toBeVisible();
  });

  it("exposes the selected answer before confirmation without feedback", async () => {
    const user = userEvent.setup();
    render(<WctPopQuizRunner attempt={attempt} returnHref="/lessons/books/book-1" />);

    await user.click(screen.getByRole("button", { name: "X" }));

    expect(screen.getByRole("button", { name: "X" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "O" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByText("아쉬워요. 정답을 확인해 보세요.")).not.toBeInTheDocument();
  });

  it("retries a failed final-question confirmation before completing", async () => {
    const user = userEvent.setup();
    mocks.confirmWctPopQuizAnswerAction
      .mockResolvedValueOnce({ ok: false, message: "답안을 저장하지 못했어요. 다시 시도해 주세요." })
      .mockResolvedValueOnce(confirmation(15));
    mocks.completeWctPopQuizAction.mockResolvedValue({
      ok: true,
      data: { score: 16, total: 16, incorrectDays: [], completedAt: "2026-08-03T00:00:00.000Z" }
    });
    render(
      <WctPopQuizRunner
        attempt={{ ...attempt, currentIndex: 15, answers: attempt.questions.slice(0, 15).map((item) => ({
          questionId: item.question.id,
          choiceId: item.question.correctChoiceId,
          confirmedAt: "2026-08-03T00:00:00.000Z"
        })) }}
        returnHref="/lessons/books/book-1"
      />
    );

    await user.click(screen.getByRole("button", { name: "Correct 16" }));
    await user.click(screen.getByRole("button", { name: "정답 확인" }));
    expect(await screen.findByText("답안을 저장하지 못했어요. 다시 시도해 주세요.")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "저장 다시 시도" }));
    await waitFor(() => expect(mocks.confirmWctPopQuizAnswerAction).toHaveBeenCalledTimes(2));
    expect(mocks.completeWctPopQuizAction).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "결과 보기" }));
    expect(await screen.findByRole("heading", { name: "16 / 16" })).toBeVisible();
    expect(mocks.completeWctPopQuizAction).toHaveBeenCalledTimes(1);
  });

  it("retries final completion after a failure instead of confirming the answer again", async () => {
    const user = userEvent.setup();
    mocks.confirmWctPopQuizAnswerAction.mockResolvedValue(confirmation(15));
    mocks.completeWctPopQuizAction
      .mockResolvedValueOnce({ ok: false, message: "결과를 저장하지 못했어요. 다시 시도해 주세요." })
      .mockResolvedValueOnce({
        ok: true,
        data: { score: 16, total: 16, incorrectDays: [], completedAt: "2026-08-03T00:00:00.000Z" }
      });
    render(
      <WctPopQuizRunner
        attempt={{ ...attempt, currentIndex: 15, answers: attempt.questions.slice(0, 15).map((item) => ({
          questionId: item.question.id,
          choiceId: item.question.correctChoiceId,
          confirmedAt: "2026-08-03T00:00:00.000Z"
        })) }}
        returnHref="/lessons/books/book-1"
      />
    );

    await user.click(screen.getByRole("button", { name: "Correct 16" }));
    await user.click(screen.getByRole("button", { name: "정답 확인" }));
    await user.click(await screen.findByRole("button", { name: "결과 보기" }));
    expect(await screen.findByText("결과를 저장하지 못했어요. 다시 시도해 주세요.")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "저장 다시 시도" }));
    await waitFor(() => expect(mocks.completeWctPopQuizAction).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole("heading", { name: "16 / 16" })).toBeVisible();
    expect(mocks.confirmWctPopQuizAnswerAction).toHaveBeenCalledTimes(1);
  });

  it("recovers a persisted fully answered in-progress attempt by completing it", async () => {
    const user = userEvent.setup();
    mocks.completeWctPopQuizAction.mockResolvedValue({
      ok: true,
      data: { score: 13, total: 16, incorrectDays: [], completedAt: "2026-08-03T00:00:00.000Z" }
    });
    render(
      <WctPopQuizRunner
        attempt={{ ...attempt, currentIndex: 16, answers: attempt.questions.map((item) => ({
          questionId: item.question.id,
          choiceId: item.question.correctChoiceId,
          confirmedAt: "2026-08-03T00:00:00.000Z"
        })) }}
        returnHref="/lessons/books/book-1"
      />
    );

    expect(screen.getByRole("heading", { name: "16 / 16" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "결과 보기" }));
    expect(await screen.findByRole("heading", { name: "13 / 16" })).toBeVisible();
  });
  it("shows the server result with deduplicated incorrect-Day review links and submits retake", async () => {
    const user = userEvent.setup();
    mocks.startWctPopQuizAction.mockResolvedValue(undefined);
    mocks.confirmWctPopQuizAnswerAction.mockResolvedValue(confirmation(15));
    render(
      <WctPopQuizRunner
        attempt={{ ...attempt, currentIndex: 15, answers: attempt.questions.slice(0, 15).map((item) => ({
          questionId: item.question.id,
          choiceId: item.question.correctChoiceId,
          confirmedAt: "2026-08-03T00:00:00.000Z"
        })) }}
        returnHref="/lessons/books/book-1"
      />
    );

    await user.click(screen.getByRole("button", { name: "Correct 16" }));
    await user.click(screen.getByRole("button", { name: "정답 확인" }));
    await user.click(await screen.findByRole("button", { name: "결과 보기" }));

    expect(await screen.findByRole("heading", { name: "14 / 16" })).toBeVisible();
    const reviewLinks = screen.getAllByRole("link", { name: "Day 13 복습" });
    expect(reviewLinks).toHaveLength(1);
    expect(reviewLinks[0]).toHaveAttribute("href", "/lessons/books/book-1/days/day-13");

    await user.click(screen.getByRole("button", { name: "다시 풀기" }));
    expect(mocks.startWctPopQuizAction).toHaveBeenCalledWith({
      bookId: attempt.bookId,
      mode: "retake"
    });
  });
});
