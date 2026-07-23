import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ExpressionCard, ExpressionDay } from "@/lib/types";

vi.mock("next/navigation", () => ({
  usePathname: () => "/expressions",
  useRouter: () => ({ push: vi.fn() })
}));

import { ExpressionBrowser } from "@/components/ExpressionBrowser";

function card(id: string, english: string, koreanPrompt: string): ExpressionCard {
  return {
    id,
    expression_day_id: `day-${id}`,
    owner_id: "user-a",
    english,
    korean_prompt: koreanPrompt,
    nuance_note: null,
    structure_note: null,
    grammar_note: null,
    user_memo: null,
    source_order: 0,
    is_memorization_enabled: true,
    unknown_count: 0,
    hard_count: 0,
    okay_count: 0,
    easy_count: 0,
    review_count: 0,
    last_result: null,
    last_reviewed_at: null,
    due_at: null,
    interval_days: 0,
    created_at: "2026-07-22T00:00:00.000Z",
    updated_at: "2026-07-22T00:00:00.000Z",
    examples: []
  };
}

function day(id: string, title: string, expression: ExpressionCard): ExpressionDay {
  return {
    id,
    owner_id: "user-a",
    title,
    raw_input: "",
    source_note: null,
    day_date: "2026-07-22",
    created_by: "user",
    created_at: "2026-07-22T00:00:00.000Z",
    updated_at: "2026-07-22T00:00:00.000Z",
    expressions: [expression]
  };
}

describe("ExpressionBrowser", () => {
  it("switches topics immediately while keeping the selected topic in the URL", () => {
    window.history.replaceState({}, "", "/expressions?topic=topic-1");
    const days = [
      day("topic-1", "First topic", card("first", "First expression", "First prompt")),
      day("topic-2", "Second topic", card("second", "Second expression", "Second prompt"))
    ];

    render(<ExpressionBrowser days={days} selectedTopicId="topic-1" requestedTopicBlocked={false} initialQuery="" />);

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "topic-2" } });

    expect(screen.queryByRole("heading", { name: "First expression" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Second expression" })).toBeInTheDocument();
    expect(window.location.search).toBe("?topic=topic-2");
  });

  it("keeps the add-expression target aligned with the visible topic", () => {
    const days = [
      day("topic-1", "First topic", card("first", "First expression", "First prompt")),
      day("topic-2", "Second topic", card("second", "Second expression", "Second prompt"))
    ];

    render(<ExpressionBrowser days={days} selectedTopicId="topic-1" requestedTopicBlocked={false} initialQuery="" />);
    expect(document.querySelector('a[href^="/expressions/new"]')).toHaveAttribute("href", "/expressions/new?topic=topic-1");

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "topic-2" } });

    expect(document.querySelector('a[href^="/expressions/new"]')).toHaveAttribute("href", "/expressions/new?topic=topic-2");
  });

  it("restores the visible topic when browser history changes the URL", () => {
    window.history.replaceState({}, "", "/expressions?topic=topic-2");
    const days = [
      day("topic-1", "First topic", card("first", "First expression", "First prompt")),
      day("topic-2", "Second topic", card("second", "Second expression", "Second prompt"))
    ];

    render(<ExpressionBrowser days={days} selectedTopicId="topic-2" requestedTopicBlocked={false} initialQuery="" />);
    expect(screen.getByRole("heading", { name: "Second expression" })).toBeInTheDocument();

    window.history.replaceState({}, "", "/expressions?topic=topic-1");
    fireEvent(window, new PopStateEvent("popstate"));

    expect(screen.queryByRole("heading", { name: "Second expression" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "First expression" })).toBeInTheDocument();
  });

  it("filters cards immediately while typing without waiting for URL synchronization", () => {
    const days = [
      day("topic-1", "첫 토픽", card("first", "First expression", "첫 표현")),
      day("topic-2", "둘째 토픽", card("second", "Second expression", "둘째 표현"))
    ];

    render(<ExpressionBrowser days={days} selectedTopicId="topic-1" requestedTopicBlocked={false} initialQuery="" />);
    expect(screen.getByRole("heading", { name: "First expression" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Second expression" })).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("영어 또는 한국어를 입력하세요"), { target: { value: "Second" } });

    expect(screen.queryByRole("heading", { name: "First expression" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Second expression" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Second 검색 결과 1개");
  });
});
