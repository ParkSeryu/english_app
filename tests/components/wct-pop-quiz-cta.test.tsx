import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WctPopQuizCta } from "@/components/wct/WctPopQuizCta";

const mocks = vi.hoisted(() => ({
  startWctPopQuizAction: vi.fn()
}));

vi.mock("@/app/lessons/books/[bookId]/pop-quiz/actions", () => ({
  startWctPopQuizAction: mocks.startWctPopQuizAction
}));

describe("WctPopQuizCta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.startWctPopQuizAction.mockResolvedValue(undefined);
  });

  it("shows the start label and starts a new eligible attempt", async () => {
    const user = userEvent.setup();
    render(<WctPopQuizCta bookId="11111111-1111-4111-8111-111111111111" summary={null} />);

    await user.click(screen.getByRole("button", { name: "Pop Quiz · 20문제" }));

    expect(mocks.startWctPopQuizAction).toHaveBeenCalledWith({
      bookId: "11111111-1111-4111-8111-111111111111",
      mode: "start"
    });
  });

  it("shows resume and latest-score states", () => {
    const { rerender } = render(
      <WctPopQuizCta
        bookId="11111111-1111-4111-8111-111111111111"
        summary={{
          attemptId: "22222222-2222-4222-8222-222222222222",
          status: "in_progress",
          currentIndex: 7,
          latestScore: null,
          completedAt: null
        }}
      />
    );
    expect(screen.getByRole("button", { name: "이어 풀기 · 7/20" })).toBeVisible();

    rerender(
      <WctPopQuizCta
        bookId="11111111-1111-4111-8111-111111111111"
        summary={{
          attemptId: "22222222-2222-4222-8222-222222222222",
          status: "completed",
          currentIndex: 20,
          latestScore: 18,
          completedAt: "2026-08-03T00:00:00.000Z"
        }}
      />
    );
    expect(screen.getByRole("button", { name: "다시 풀기 · 최근 18/20" })).toBeVisible();
  });

  it("does not render a Pop Quiz entry for an ineligible book", () => {
    render(
      <WctPopQuizCta
        bookId="11111111-1111-4111-8111-111111111111"
        summary={null}
        isEligible={false}
      />
    );

    expect(screen.queryByRole("button", { name: /Pop Quiz|이어 풀기|다시 풀기/ })).not.toBeInTheDocument();
  });
});
