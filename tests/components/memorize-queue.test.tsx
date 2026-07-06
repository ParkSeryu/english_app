import { render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ExpressionCard } from "@/lib/types";

vi.mock("@/app/actions", () => ({
  deletePersonalExpressionAction: vi.fn(async () => undefined),
  recordExpressionReviewAction: vi.fn(async () => undefined),
  recordExpressionReviewInPlaceAction: vi.fn(async () => ({ ok: true }))
}));

import { recordExpressionReviewAction, recordExpressionReviewInPlaceAction } from "@/app/actions";
import { MemorizeQueue } from "@/components/MemorizeQueue";

function expression(overrides: Partial<ExpressionCard>): ExpressionCard {
  return {
    id: "expression-1",
    expression_day_id: "day-1",
    owner_id: "user-a",
    english: "They don't seem to care about me.",
    korean_prompt: "그들은 저를 신경 쓰지 않는 것 같아요.",
    nuance_note: null,
    structure_note: null,
    grammar_note: null,
    user_memo: null,
    source_order: 0,
    unknown_count: 0,
    hard_count: 0,
    okay_count: 0,
    easy_count: 0,
    review_count: 0,
    last_result: null,
    last_reviewed_at: null,
    due_at: null,
    interval_days: 0,
    created_at: "2026-04-27T00:00:00.000Z",
    updated_at: "2026-04-28T00:00:00.000Z",
    examples: [],
    ...overrides
  };
}

const first = expression({ id: "expression-1", korean_prompt: "첫 번째 한국어", english: "First answer" });
const second = expression({ id: "expression-2", korean_prompt: "두 번째 한국어", english: "Second answer", source_order: 1 });
const third = expression({ id: "expression-3", korean_prompt: "세 번째 한국어", english: "Third answer", source_order: 2 });
const storageKey = "english:memorize-session:v1";

function storedQueueState(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    queueIds: [second.id, third.id, first.id],
    activeId: second.id,
    deferredIds: [first.id],
    savedAt: new Date().toISOString(),
    ...overrides
  });
}

function expectPromptVisible(prompt: string) {
  expect(screen.getByRole("heading", { name: prompt })).toBeInTheDocument();
}

function expectPromptAbsent(prompt: string) {
  expect(screen.queryByRole("heading", { name: prompt })).not.toBeInTheDocument();
}

function koreanMidnightUtcIso(daysFromToday: number) {
  const koreaNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return new Date(Date.UTC(koreaNow.getUTCFullYear(), koreaNow.getUTCMonth(), koreaNow.getUTCDate() + daysFromToday) - 9 * 60 * 60 * 1000).toISOString();
}

describe("MemorizeQueue", () => {
  const redirectReviewAction = vi.mocked(recordExpressionReviewAction);
  const inPlaceReviewAction = vi.mocked(recordExpressionReviewInPlaceAction);

  beforeEach(() => {
    redirectReviewAction.mockClear();
    inPlaceReviewAction.mockClear();
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  it("optimistically advances to the next expression as soon as a review button is submitted while recording the again count", async () => {
    const user = userEvent.setup();
    render(<MemorizeQueue expressions={[first, second]} />);

    expectPromptVisible("첫 번째 한국어");

    await user.click(screen.getByRole("button", { name: /정답 보기/ }));
    await user.click(screen.getByRole("button", { name: /다시/ }));

    expect(screen.queryByText("First answer")).not.toBeInTheDocument();
    expectPromptAbsent("첫 번째 한국어");
    expectPromptVisible("두 번째 한국어");
    await waitFor(() => expect(inPlaceReviewAction).toHaveBeenCalledWith(first.id, "again"));
    expect(redirectReviewAction).not.toHaveBeenCalled();
  });

  it("keeps locally deferred again cards stacked while reviewing before a server refresh lands and records only counts", async () => {
    const user = userEvent.setup();
    render(<MemorizeQueue expressions={[first, second, third]} />);

    await user.click(screen.getByRole("button", { name: /정답 보기/ }));
    await user.click(screen.getByRole("button", { name: /다시/ }));
    await waitFor(() => expect(inPlaceReviewAction).toHaveBeenCalledTimes(1));

    expect(inPlaceReviewAction).toHaveBeenNthCalledWith(1, first.id, "again");
    expectPromptVisible("두 번째 한국어");

    await user.click(screen.getByRole("button", { name: /정답 보기/ }));
    await user.click(screen.getByRole("button", { name: /다시/ }));
    await waitFor(() => expect(inPlaceReviewAction).toHaveBeenCalledTimes(2));

    expect(inPlaceReviewAction).toHaveBeenNthCalledWith(2, second.id, "again");
    expectPromptVisible("세 번째 한국어");
    expect(redirectReviewAction).not.toHaveBeenCalled();
  });

  it("updates the remaining count optimistically only after remembered reviews", async () => {
    const user = userEvent.setup();
    render(<MemorizeQueue expressions={[first, second, third]} />);

    expect(screen.getByText("복습할 표현 3개")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /정답 보기/ }));
    await user.click(screen.getByRole("button", { name: /다시/ }));

    expect(screen.getByText("복습할 표현 3개")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /정답 보기/ }));
    await user.click(screen.getByRole("button", { name: /쉬움/ }));

    expect(screen.getByText("복습할 표현 2개")).toBeInTheDocument();
  });

  it("keeps a hard-reviewed overdue card in the local queue when the next due date is still today", async () => {
    const user = userEvent.setup();
    const overdueHardCard = expression({
      id: "expression-hard-overdue",
      korean_prompt: "어려운 카드 한국어",
      english: "Hard overdue answer",
      due_at: koreanMidnightUtcIso(-1),
      interval_days: 1,
      last_result: "known",
      last_reviewed_at: koreanMidnightUtcIso(-2),
      review_count: 3
    });

    render(<MemorizeQueue expressions={[overdueHardCard, second]} />);

    await user.click(screen.getByRole("button", { name: /정답 보기/ }));
    await user.click(screen.getByRole("button", { name: /어려움/ }));

    expect(screen.getByText("복습할 표현 2개")).toBeInTheDocument();
    expectPromptVisible("두 번째 한국어");

    await user.click(screen.getByRole("button", { name: /정답 보기/ }));
    await user.click(screen.getByRole("button", { name: /쉬움/ }));

    expectPromptVisible("어려운 카드 한국어");
    await waitFor(() => expect(inPlaceReviewAction).toHaveBeenCalledWith(overdueHardCard.id, "hard"));
    expect(redirectReviewAction).not.toHaveBeenCalled();
  });

  it("shows an optimistic again count when a deferred card returns before server refresh", async () => {
    const user = userEvent.setup();
    render(<MemorizeQueue expressions={[first, second]} />);

    await user.click(screen.getByRole("button", { name: /정답 보기/ }));
    await user.click(screen.getByRole("button", { name: /다시/ }));

    expectPromptVisible("두 번째 한국어");

    await user.click(screen.getByRole("button", { name: /정답 보기/ }));
    await user.click(screen.getByRole("button", { name: /다시/ }));

    expectPromptVisible("첫 번째 한국어");
    expect(screen.getByText(/다시 1회/)).toBeInTheDocument();
  });

  it("shows the empty memorization state immediately after the last card is remembered", async () => {
    const user = userEvent.setup();
    render(<MemorizeQueue expressions={[first, second]} />);

    await user.click(screen.getByRole("button", { name: /정답 보기/ }));
    await user.click(screen.getByRole("button", { name: /쉬움/ }));
    expectPromptVisible("두 번째 한국어");

    await user.click(screen.getByRole("button", { name: /정답 보기/ }));
    await user.click(screen.getByRole("button", { name: /쉬움/ }));

    expect(screen.getByText("복습할 표현 0개")).toBeInTheDocument();
    expect(screen.getByText("암기할 표현이 없습니다")).toBeInTheDocument();
    expect(screen.getByText("배운 표현이 생기면 한국어 힌트로 바로 복습할 수 있습니다.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "표현 모아보기" })).toHaveAttribute("href", "/expressions");
    expect(screen.queryByRole("button", { name: /정답 보기/ })).not.toBeInTheDocument();
  });

  it("server-renders the first card instead of blocking on browser storage", () => {
    const html = renderToString(<MemorizeQueue expressions={[first, second, third]} />);

    expect(html).toContain("첫 번째 한국어");
    expect(html).not.toContain("복습 준비 중…");
  });

  it("restores the stored queue position from localStorage after mounting", async () => {
    window.localStorage.setItem(storageKey, storedQueueState());

    render(<MemorizeQueue expressions={[first, second, third]} />);

    await waitFor(() => expectPromptVisible("두 번째 한국어"));
    expectPromptAbsent("첫 번째 한국어");
    expect(screen.queryByText("복습 준비 중…")).not.toBeInTheDocument();
  });

  it("restores the current queue position from localStorage after an app-like remount", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<MemorizeQueue expressions={[first, second, third]} />);

    await user.click(screen.getByRole("button", { name: /정답 보기/ }));
    await user.click(screen.getByRole("button", { name: /다시/ }));
    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(storageKey) ?? "{}") as { activeId?: unknown };
      expect(stored.activeId).toBe(second.id);
    });
    expect(window.sessionStorage.getItem(storageKey)).toBeNull();

    unmount();
    window.sessionStorage.clear();
    render(<MemorizeQueue expressions={[first, second, third]} />);

    await waitFor(() => expectPromptVisible("두 번째 한국어"));
    expectPromptAbsent("첫 번째 한국어");
  });

  it("ignores a stored queue from a previous Korean day", async () => {
    window.localStorage.setItem(storageKey, storedQueueState({ savedAt: "2000-01-01T00:00:00.000Z" }));

    render(<MemorizeQueue expressions={[first, second, third]} />);

    await waitFor(() => expectPromptVisible("첫 번째 한국어"));
    expectPromptAbsent("두 번째 한국어");
    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(storageKey) ?? "{}") as { activeId?: unknown };
      expect(stored.activeId).toBe(first.id);
    });
  });

  it("drops stale stored cards that are no longer in the server queue", async () => {
    window.localStorage.setItem(storageKey, storedQueueState());

    render(<MemorizeQueue expressions={[third, first]} deferredIds={[first.id]} />);

    await waitFor(() => expectPromptVisible("세 번째 한국어"));
    expectPromptAbsent("두 번째 한국어");
    await waitFor(() => expect(window.localStorage.getItem(storageKey)).not.toContain(second.id));
  });

  it("uses the first expression from a refreshed deferred queue instead of carrying over the old active index", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<MemorizeQueue expressions={[first, second, third]} />);

    await user.click(screen.getByRole("button", { name: /정답 보기/ }));
    await user.click(screen.getByRole("button", { name: /다시/ }));

    rerender(<MemorizeQueue expressions={[second, third, first]} deferredIds={[first.id]} />);

    expectPromptVisible("두 번째 한국어");
    expectPromptAbsent("세 번째 한국어");
  });

  it("keeps a revealed answer open when a server refresh reorders the queue", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<MemorizeQueue expressions={[first, second, third]} />);

    await user.click(screen.getByRole("button", { name: /정답 보기/ }));
    expect(screen.getByText("First answer")).toBeInTheDocument();

    rerender(<MemorizeQueue expressions={[second, first, third]} />);

    expect(screen.getByText("First answer")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /정답 보기/ })).not.toBeInTheDocument();
    expect(screen.getByText("첫 번째 한국어")).toBeInTheDocument();
    expectPromptAbsent("두 번째 한국어");
  });
});
