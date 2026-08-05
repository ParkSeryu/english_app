import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import WctPopQuizPage from "@/app/lessons/books/[bookId]/pop-quiz/page";

const mocks = vi.hoisted(() => {
  class RestartRequiredError extends Error {}
  return {
    RestartRequiredError,
    requireCurrentUser: vi.fn(),
    getBook: vi.fn(),
    getWctPopQuizAttempt: vi.fn(),
    isWctPopQuizEligible: vi.fn(),
    redirect: vi.fn(),
    notFound: vi.fn()
  };
});

vi.mock("@/lib/auth", () => ({ requireCurrentUser: mocks.requireCurrentUser }));
vi.mock("@/lib/wct-store", () => ({
  getWctStore: () => ({ getBook: mocks.getBook, getDay: vi.fn() })
}));
vi.mock("@/lib/wct-quiz-store", () => ({ getWctQuizStore: () => ({}) }));
vi.mock("@/lib/wct-pop-quiz-store", () => ({ getWctPopQuizStore: () => ({}) }));
vi.mock("@/lib/wct/pop-quiz/service", () => ({
  getWctPopQuizAttempt: mocks.getWctPopQuizAttempt,
  isWctPopQuizEligible: mocks.isWctPopQuizEligible,
  WctPopQuizRestartRequiredError: mocks.RestartRequiredError
}));
vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
  notFound: mocks.notFound
}));
vi.mock("@/components/wct/WctPopQuizRunner", () => ({
  WctPopQuizRunner: () => <div data-testid="pop-quiz-runner" />
}));

const book = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "WCT Pattern book Prenovice",
  levelLabel: "Prenovice",
  dayCount: 16,
  sortOrder: 1,
  days: []
};

describe("WctPopQuizPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireCurrentUser.mockResolvedValue({ id: "user-1" });
    mocks.getBook.mockResolvedValue(book);
    mocks.isWctPopQuizEligible.mockReturnValue(true);
  });

  it("renders a safe restart state and no runner for a stale active snapshot", async () => {
    mocks.getWctPopQuizAttempt.mockRejectedValue(new mocks.RestartRequiredError());

    render(await WctPopQuizPage({
      params: Promise.resolve({ bookId: book.id })
    }));

    expect(screen.getByText("Pop Quiz가 변경됐어요. 새로 시작해 주세요."))
      .toBeVisible();
    expect(screen.getByRole("link", { name: /책으로 돌아가.*시작/ }))
      .toHaveAttribute("href", `/lessons/books/${book.id}`);
    expect(screen.queryByTestId("pop-quiz-runner")).not.toBeInTheDocument();
  });

  it("does not hide an unexpected loading failure", async () => {
    const failure = new Error("unexpected");
    mocks.getWctPopQuizAttempt.mockRejectedValue(failure);

    await expect(WctPopQuizPage({
      params: Promise.resolve({ bookId: book.id })
    })).rejects.toBe(failure);
  });
});
