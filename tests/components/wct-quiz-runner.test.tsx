import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import WctDayQuizPage from "@/app/lessons/books/[bookId]/days/[dayId]/quiz/page";
import { WctQuizRunner } from "@/components/wct/WctQuizRunner";
import type { WctQuizSet } from "@/lib/wct/quiz/types";
import type { WctBook, WctDay } from "@/lib/wct/types";

const mocks = vi.hoisted(() => ({
  submitWctQuizAttemptAction: vi.fn(),
  requireCurrentUser: vi.fn(),
  getBook: vi.fn(),
  getDay: vi.fn(),
  getSetByLessonKey: vi.fn(),
  isCurrentStandardWctQuizSet: vi.fn()
}));

vi.mock("@/app/lessons/quiz-actions", () => ({
  submitWctQuizAttemptAction: mocks.submitWctQuizAttemptAction
}));

vi.mock("@/lib/auth", () => ({
  requireCurrentUser: mocks.requireCurrentUser
}));

vi.mock("@/lib/wct-store", () => ({
  getWctStore: () => ({
    getBook: mocks.getBook,
    getDay: mocks.getDay
  })
}));

vi.mock("@/lib/wct-quiz-store", () => ({
  getWctQuizStore: () => ({
    getSetByLessonKey: mocks.getSetByLessonKey
  })
}));

vi.mock("@/lib/wct/quiz/current-set", () => ({
  isCurrentStandardWctQuizSet: mocks.isCurrentStandardWctQuizSet
}));

const quizSet: WctQuizSet = {
  id: "11111111-1111-4111-8111-111111111111",
  ownerId: "22222222-2222-4222-8222-222222222222",
  lessonKey: "wct-book:wct-prenovice:day:1",
  sourceKind: "wct_day",
  sourceId: "day-1",
  generatorVersion: "wct-review-v1",
  sourceHash: "0".repeat(64),
  createdAt: "2026-07-28T00:00:00.000Z",
  questions: Array.from({ length: 5 }, (_, index) => {
    const number = index + 1;
    return {
      id: `question-${number}`,
      kind: index < 3 ? "translation" : "pattern",
      prompt: `Question ${number}`,
      choices: [
        { id: `choice-${number}-1`, text: `Correct ${number}` },
        { id: `choice-${number}-2`, text: `Wrong A ${number}` },
        { id: `choice-${number}-3`, text: `Wrong B ${number}` },
        { id: `choice-${number}-4`, text: `Wrong C ${number}` }
      ],
      correctChoiceId: `choice-${number}-1`,
      explanation: `Explanation ${number}`
    };
  })
};

const structuredQuizSet: WctQuizSet = {
  ...quizSet,
  generatorVersion: "wct-review-v2",
  questions: quizSet.questions.map((question) => ({
    ...question,
    format: "multiple_choice",
    feedback: {
      correctSentence: `Correct sentence ${question.id}`,
      pattern: `Pattern ${question.id}`,
      reason: `Reason ${question.id}`
    }
  }))
};

const day: WctDay = {
  id: "day-1",
  bookId: "book-1",
  dayNumber: 1,
  shortLabel: "Topic 1",
  displayLabel: "Day 1 (Topic 1)",
  sourcePageStart: null,
  sourcePageEnd: null,
  sourceNeedsReview: false,
  learningSummary: null,
  concepts: [],
  patterns: [],
  importantNotes: [],
  practicePrompts: []
};

const book: WctBook = {
  id: "book-1",
  title: "WCT Pre-Novice",
  levelLabel: null,
  dayCount: 1,
  sortOrder: 0,
  days: [day]
};

async function answerQuiz(
  user: ReturnType<typeof userEvent.setup>,
  choiceForQuestion: (questionNumber: number) => string
) {
  for (let number = 1; number <= 5; number += 1) {
    await user.click(screen.getByRole("button", {
      name: choiceForQuestion(number)
    }));
    await user.click(screen.getByRole("button", { name: "정답 확인" }));
    if (number < 5) {
      await user.click(screen.getByRole("button", { name: "다음 문제" }));
    }
  }
}

describe("WctQuizRunner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lets users change a selection before explicitly confirming feedback", async () => {
    const user = userEvent.setup();
    render(<WctQuizRunner quizSet={quizSet} returnHref="/day/1" />);

    expect(screen.getByText("1 / 5")).toBeVisible();
    expect(screen.queryByText("Explanation 1")).not.toBeInTheDocument();
    const confirmButton = screen.getByRole("button", { name: "정답 확인" });
    expect(confirmButton).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Wrong A 1" }));

    expect(confirmButton).toBeEnabled();
    expect(screen.queryByText("아쉬워요. 정답을 확인해 보세요."))
      .not.toBeInTheDocument();
    expect(screen.queryByText("Explanation 1")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Wrong A 1" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Wrong B 1" }));
    await user.click(confirmButton);

    expect(screen.getByText("아쉬워요. 정답을 확인해 보세요.")).toBeVisible();
    expect(screen.getByText("Explanation 1")).toBeVisible();
    expect(screen.queryByText("Day 1 · Topic 1")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Wrong B 1, 오답" }))
      .toBeDisabled();
    expect(screen.getByRole("button", { name: "Correct 1, 정답" }))
      .toBeDisabled();
    for (const choice of screen.getAllByRole("button").filter((button) => (
      button.textContent?.startsWith("Wrong") || button.textContent?.startsWith("Correct")
    ))) {
      expect(choice).toBeDisabled();
    }

    await user.click(screen.getByRole("button", { name: "다음 문제" }));
    expect(screen.getByText("2 / 5")).toBeVisible();
    expect(screen.queryByText("Explanation 2")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "정답 확인" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Correct 2" }));
    expect(screen.queryByText("정답이에요")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "정답 확인" }));
    expect(screen.getByText("정답이에요")).toBeVisible();
    expect(screen.getByRole("button", { name: "Correct 2, 정답" }))
      .toBeDisabled();
  });

  it("shows standard Day context and structured feedback only after confirmation", async () => {
    const user = userEvent.setup();
    render(
      <WctQuizRunner
        quizSet={structuredQuizSet}
        returnHref="/day/13"
        feedbackContext="Day 13 · if 가능"
        sourceContext={{ bookId: "book-13", dayId: "day-13" }}
      />
    );

    expect(screen.queryByText("Day 13 · if 가능")).not.toBeInTheDocument();
    expect(screen.queryByText("정답 문장 · Correct sentence question-1"))
      .not.toBeInTheDocument();
    expect(screen.queryByText("원래 패턴 · Pattern question-1"))
      .not.toBeInTheDocument();
    expect(screen.queryByText("Reason question-1")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Correct 1" }));
    await user.click(screen.getByRole("button", { name: "정답 확인" }));

    const feedbackPanel = screen.getByText("정답이에요").parentElement;
    expect(feedbackPanel).not.toBeNull();
    expect(within(feedbackPanel!).getByText("Day 13 · if 가능")).toBeVisible();
    expect(within(feedbackPanel!).getByText(
      "정답 문장 · Correct sentence question-1"
    )).toBeVisible();
    expect(within(feedbackPanel!).getByText(
      "원래 패턴 · Pattern question-1"
    )).toBeVisible();
    expect(within(feedbackPanel!).getByText("Reason question-1")).toBeVisible();
  });

  it("submits five answers, trusts the saved score, and retakes the same set", async () => {
    const user = userEvent.setup();
    mocks.submitWctQuizAttemptAction.mockResolvedValue({
      ok: true,
      score: 4,
      total: 5,
      completedAt: "2026-07-28T00:00:00Z"
    });
    render(
      <WctQuizRunner
        quizSet={quizSet}
        returnHref="/day/1"
        sourceContext={{ bookId: "book-1", dayId: "day-1" }}
      />
    );

    await answerQuiz(user, (number) => (
      number === 1 ? "Wrong A 1" : `Correct ${number}`
    ));

    expect(screen.getByText("정답이에요")).toBeVisible();
    expect(screen.getByText("Explanation 5")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "결과 보기" }));

    await waitFor(() => {
      expect(mocks.submitWctQuizAttemptAction).toHaveBeenCalledWith({
        quizSetId: quizSet.id,
        answers: [
          { questionId: "question-1", choiceId: "choice-1-2" },
          { questionId: "question-2", choiceId: "choice-2-1" },
          { questionId: "question-3", choiceId: "choice-3-1" },
          { questionId: "question-4", choiceId: "choice-4-1" },
          { questionId: "question-5", choiceId: "choice-5-1" }
        ],
        sourceContext: { bookId: "book-1", dayId: "day-1" }
      });
    });

    expect(screen.getByRole("heading", { name: "4 / 5" })).toBeVisible();
    expect(screen.getByText("저장됐어요")).toBeVisible();
    expect(screen.getByRole("link", { name: "Day로 돌아가기" }))
      .toHaveAttribute("href", "/day/1");

    await user.click(screen.getByRole("button", { name: "다시 풀기" }));
    expect(screen.getByText("1 / 5")).toBeVisible();
    expect(screen.getByText("Question 1")).toBeVisible();
    expect(screen.queryByText("저장됐어요")).not.toBeInTheDocument();
  });

  it("keeps the local result visible and retries a failed save", async () => {
    const user = userEvent.setup();
    mocks.submitWctQuizAttemptAction
      .mockResolvedValueOnce({
        ok: false,
        message: "결과를 저장하지 못했어요. 다시 시도해 주세요."
      })
      .mockResolvedValueOnce({
        ok: true,
        score: 5,
        total: 5,
        completedAt: "2026-07-28T00:00:00Z"
      });
    render(<WctQuizRunner quizSet={quizSet} returnHref="/day/1" />);

    await answerQuiz(user, (number) => `Correct ${number}`);
    await user.click(screen.getByRole("button", { name: "결과 보기" }));

    expect(await screen.findByRole("heading", { name: "5 / 5" }))
      .toBeVisible();
    expect(screen.getByText("저장되지 않았어요")).toBeVisible();
    expect(screen.getByText(
      "결과를 저장하지 못했어요. 다시 시도해 주세요."
    )).toBeVisible();

    const resultRegion = screen.getByRole("region", { name: "퀴즈 결과" });
    await user.click(within(resultRegion).getByRole("button", {
      name: "저장 다시 시도"
    }));

    await waitFor(() => {
      expect(mocks.submitWctQuizAttemptAction).toHaveBeenCalledTimes(2);
    });
    expect(screen.getByText("저장됐어요")).toBeVisible();
    expect(screen.queryByText("저장되지 않았어요")).not.toBeInTheDocument();
  });
});

describe("WctDayQuizPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireCurrentUser.mockResolvedValue({ id: "user-1" });
    mocks.getBook.mockResolvedValue(book);
    mocks.getDay.mockResolvedValue(day);
    mocks.isCurrentStandardWctQuizSet.mockReturnValue(true);
  });

  async function renderPage(quizSetForRoute: WctQuizSet) {
    mocks.getSetByLessonKey.mockResolvedValue(quizSetForRoute);
    render(await WctDayQuizPage({
      params: Promise.resolve({ bookId: book.id, dayId: day.id })
    }));
  }

  it("keeps accepted v1 standard quizzes context-free with legacy feedback", async () => {
    const user = userEvent.setup();
    await renderPage(quizSet);

    await user.click(screen.getByRole("button", { name: "Correct 1" }));
    await user.click(screen.getByRole("button", { name: "정답 확인" }));

    expect(screen.getByText("Explanation 1")).toBeVisible();
    expect(screen.queryByText("Day 1 · Topic 1")).not.toBeInTheDocument();
    expect(screen.queryByText(/정답 문장 ·/)).not.toBeInTheDocument();
  });

  it("passes exact Day context to accepted v2 standard quizzes", async () => {
    const user = userEvent.setup();
    await renderPage(structuredQuizSet);

    expect(screen.queryByText("Day 1 · Topic 1")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Correct 1" }));
    await user.click(screen.getByRole("button", { name: "정답 확인" }));

    expect(screen.getByText("Day 1 · Topic 1")).toBeVisible();
    expect(screen.getByText("정답 문장 · Correct sentence question-1"))
      .toBeVisible();
  });
});
