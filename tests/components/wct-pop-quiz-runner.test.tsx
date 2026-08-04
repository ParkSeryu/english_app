import { render, screen, waitFor } from "@testing-library/react";
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
  questions: Array.from({ length: 20 }, (_, index) => {
    const number = index + 1;
    return {
      sourceQuizSetId: `set-${number}`,
      dayId: number < 3 ? "day-13" : `day-${number}`,
      dayNumber: number < 3 ? 13 : number,
      dayLabel: number < 3 ? "Day 13" : `Day ${number}`,
      band: number <= 7 ? "early" as const : number <= 14 ? "middle" as const : "late" as const,
      question: {
        id: `question-${number}`,
        kind: number <= 12 ? "translation" as const : "pattern" as const,
        prompt: `Question ${number}`,
        choices: [
          { id: `choice-${number}-1`, text: `Correct ${number}` },
          { id: `choice-${number}-2`, text: `Wrong ${number}` }
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
        score: 18,
        total: 20,
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

    expect(screen.getByText("2 / 20")).toBeVisible();
    expect(screen.getByText("Question 2")).toBeVisible();
    expect(screen.queryByText("Explanation 2")).not.toBeInTheDocument();
  });

  it("allows selection changes, shows feedback on confirmation, and waits for saving before advance", async () => {
    const user = userEvent.setup();
    let resolveConfirmation: (value: ReturnType<typeof confirmation>) => void;
    mocks.confirmWctPopQuizAnswerAction.mockReturnValue(new Promise((resolve) => {
      resolveConfirmation = resolve;
    }));
    render(<WctPopQuizRunner attempt={attempt} returnHref="/lessons/books/book-1" />);

    await user.click(screen.getByRole("button", { name: "Wrong 1" }));
    await user.click(screen.getByRole("button", { name: "Correct 1" }));
    await user.click(screen.getByRole("button", { name: "정답 확인" }));

    expect(screen.getByText("정답이에요")).toBeVisible();
    expect(screen.getByText("Explanation 1")).toBeVisible();
    expect(screen.getByRole("button", { name: "다음 문제" })).toBeDisabled();

    resolveConfirmation!(confirmation(0));
    await screen.findByRole("button", { name: "다음 문제" });
    expect(screen.getByRole("button", { name: "다음 문제" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "다음 문제" }));
    expect(screen.getByText("2 / 20")).toBeVisible();
  });

  it("keeps confirmed feedback visible and retries a failed save without advancing", async () => {
    const user = userEvent.setup();
    mocks.confirmWctPopQuizAnswerAction
      .mockResolvedValueOnce({ ok: false, message: "답안을 저장하지 못했어요. 다시 시도해 주세요." })
      .mockResolvedValueOnce(confirmation(0));
    render(<WctPopQuizRunner attempt={attempt} returnHref="/lessons/books/book-1" />);

    await user.click(screen.getByRole("button", { name: "Wrong 1" }));
    await user.click(screen.getByRole("button", { name: "정답 확인" }));

    expect(await screen.findByText("아쉬워요. 정답을 확인해 보세요.")).toBeVisible();
    expect(screen.getByText("답안을 저장하지 못했어요. 다시 시도해 주세요.")).toBeVisible();
    expect(screen.getByRole("button", { name: "다음 문제" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "저장 다시 시도" }));

    await waitFor(() => expect(mocks.confirmWctPopQuizAnswerAction).toHaveBeenCalledTimes(2));
    expect(screen.getByRole("button", { name: "다음 문제" })).toBeEnabled();
    expect(screen.getByText("1 / 20")).toBeVisible();
  });

  it("exposes the selected answer before confirmation without feedback", async () => {
    const user = userEvent.setup();
    render(<WctPopQuizRunner attempt={attempt} returnHref="/lessons/books/book-1" />);

    await user.click(screen.getByRole("button", { name: "Wrong 1" }));

    expect(screen.getByRole("button", { name: "Wrong 1" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Correct 1" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByText("아쉬워요. 정답을 확인해 보세요.")).not.toBeInTheDocument();
  });

  it("retries a failed final-question confirmation before completing", async () => {
    const user = userEvent.setup();
    mocks.confirmWctPopQuizAnswerAction
      .mockResolvedValueOnce({ ok: false, message: "답안을 저장하지 못했어요. 다시 시도해 주세요." })
      .mockResolvedValueOnce(confirmation(19));
    mocks.completeWctPopQuizAction.mockResolvedValue({
      ok: true,
      data: { score: 20, total: 20, incorrectDays: [], completedAt: "2026-08-03T00:00:00.000Z" }
    });
    render(
      <WctPopQuizRunner
        attempt={{ ...attempt, currentIndex: 19, answers: attempt.questions.slice(0, 19).map((item) => ({
          questionId: item.question.id,
          choiceId: item.question.correctChoiceId,
          confirmedAt: "2026-08-03T00:00:00.000Z"
        })) }}
        returnHref="/lessons/books/book-1"
      />
    );

    await user.click(screen.getByRole("button", { name: "Correct 20" }));
    await user.click(screen.getByRole("button", { name: "정답 확인" }));
    expect(await screen.findByText("답안을 저장하지 못했어요. 다시 시도해 주세요.")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "저장 다시 시도" }));
    await waitFor(() => expect(mocks.confirmWctPopQuizAnswerAction).toHaveBeenCalledTimes(2));
    expect(mocks.completeWctPopQuizAction).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "결과 보기" }));
    expect(await screen.findByRole("heading", { name: "20 / 20" })).toBeVisible();
    expect(mocks.completeWctPopQuizAction).toHaveBeenCalledTimes(1);
  });

  it("retries final completion after a failure instead of confirming the answer again", async () => {
    const user = userEvent.setup();
    mocks.confirmWctPopQuizAnswerAction.mockResolvedValue(confirmation(19));
    mocks.completeWctPopQuizAction
      .mockResolvedValueOnce({ ok: false, message: "결과를 저장하지 못했어요. 다시 시도해 주세요." })
      .mockResolvedValueOnce({
        ok: true,
        data: { score: 20, total: 20, incorrectDays: [], completedAt: "2026-08-03T00:00:00.000Z" }
      });
    render(
      <WctPopQuizRunner
        attempt={{ ...attempt, currentIndex: 19, answers: attempt.questions.slice(0, 19).map((item) => ({
          questionId: item.question.id,
          choiceId: item.question.correctChoiceId,
          confirmedAt: "2026-08-03T00:00:00.000Z"
        })) }}
        returnHref="/lessons/books/book-1"
      />
    );

    await user.click(screen.getByRole("button", { name: "Correct 20" }));
    await user.click(screen.getByRole("button", { name: "정답 확인" }));
    await user.click(await screen.findByRole("button", { name: "결과 보기" }));
    expect(await screen.findByText("결과를 저장하지 못했어요. 다시 시도해 주세요.")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "저장 다시 시도" }));
    await waitFor(() => expect(mocks.completeWctPopQuizAction).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole("heading", { name: "20 / 20" })).toBeVisible();
    expect(mocks.confirmWctPopQuizAnswerAction).toHaveBeenCalledTimes(1);
  });

  it("recovers a persisted fully answered in-progress attempt by completing it", async () => {
    const user = userEvent.setup();
    mocks.completeWctPopQuizAction.mockResolvedValue({
      ok: true,
      data: { score: 17, total: 20, incorrectDays: [], completedAt: "2026-08-03T00:00:00.000Z" }
    });
    render(
      <WctPopQuizRunner
        attempt={{ ...attempt, currentIndex: 20, answers: attempt.questions.map((item) => ({
          questionId: item.question.id,
          choiceId: item.question.correctChoiceId,
          confirmedAt: "2026-08-03T00:00:00.000Z"
        })) }}
        returnHref="/lessons/books/book-1"
      />
    );

    expect(screen.getByRole("heading", { name: "20 / 20" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "결과 보기" }));
    expect(await screen.findByRole("heading", { name: "17 / 20" })).toBeVisible();
  });
  it("shows the server result with deduplicated incorrect-Day review links and submits retake", async () => {
    const user = userEvent.setup();
    mocks.startWctPopQuizAction.mockResolvedValue(undefined);
    mocks.confirmWctPopQuizAnswerAction.mockResolvedValue(confirmation(19));
    render(
      <WctPopQuizRunner
        attempt={{ ...attempt, currentIndex: 19, answers: attempt.questions.slice(0, 19).map((item) => ({
          questionId: item.question.id,
          choiceId: item.question.correctChoiceId,
          confirmedAt: "2026-08-03T00:00:00.000Z"
        })) }}
        returnHref="/lessons/books/book-1"
      />
    );

    await user.click(screen.getByRole("button", { name: "Correct 20" }));
    await user.click(screen.getByRole("button", { name: "정답 확인" }));
    await user.click(await screen.findByRole("button", { name: "결과 보기" }));

    expect(await screen.findByRole("heading", { name: "18 / 20" })).toBeVisible();
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
