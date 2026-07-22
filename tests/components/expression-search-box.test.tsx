import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/expressions"
}));

import { ExpressionSearchBox } from "@/components/ExpressionSearchBox";

function SearchHarness({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  return <ExpressionSearchBox query={query} onQueryChange={setQuery} selectedTopicId="topic-1" />;
}

describe("ExpressionSearchBox", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.history.replaceState({}, "", "/expressions?topic=topic-1");
  });

  it("updates the controlled query immediately and syncs the URL afterward", () => {
    render(<SearchHarness />);
    const input = screen.getByPlaceholderText("영어 또는 한국어를 입력하세요");

    fireEvent.change(input, { target: { value: "birth rate" } });

    expect(input).toHaveValue("birth rate");
    expect(window.location.search).toBe("?topic=topic-1");
    act(() => vi.advanceTimersByTime(180));
    expect(window.location.search).toBe("?topic=topic-1&q=birth+rate");
  });

  it("waits for Korean composition to finish before syncing the URL", () => {
    render(<SearchHarness />);
    const input = screen.getByPlaceholderText("영어 또는 한국어를 입력하세요");

    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: "출산율" } });
    expect(input).toHaveValue("출산율");
    act(() => vi.advanceTimersByTime(500));
    expect(new URLSearchParams(window.location.search).get("q")).toBeNull();

    fireEvent.compositionEnd(input);
    act(() => vi.advanceTimersByTime(180));
    expect(new URLSearchParams(window.location.search).get("q")).toBe("출산율");
  });

  it("clears the controlled query and URL", () => {
    window.history.replaceState({}, "", "/expressions?topic=topic-1&q=birth");
    render(<SearchHarness initialQuery="birth" />);

    fireEvent.click(screen.getByRole("button", { name: "검색어 지우기" }));
    expect(screen.getByPlaceholderText("영어 또는 한국어를 입력하세요")).toHaveValue("");
    act(() => vi.advanceTimersByTime(180));
    expect(window.location.search).toBe("?topic=topic-1");
  });
});
