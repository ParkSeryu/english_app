import type { AnchorHTMLAttributes, ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WctDayCard } from "@/components/wct/WctDayCard";
import { WctDayContent } from "@/components/wct/WctDayContent";
import { WctPatternCard } from "@/components/wct/WctPatternCard";
import { WctPremiumPlaceholderCard } from "@/components/wct/WctPremiumPlaceholderCard";
import type { WctDay, WctPattern } from "@/lib/wct/types";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  )
}));

const pattern: WctPattern = {
  id: "pattern-1",
  patternText: "be + p.p.",
  meaningKo: "~되어지다",
  usageNote: "상태나 결과를 강조할 때 사용한다.",
  usageSource: "ai_supplement",
  sourcePage: 7,
  sourceNeedsReview: false,
  sortOrder: 0,
  examples: [{
    id: "example-1",
    englishText: "It is made of wood.",
    meaningKo: "그것은 나무로 만들어진다.",
    sourcePage: 8,
    sourceNeedsReview: false,
    sortOrder: 0
  }]
};

const day: WctDay = {
  id: "day-13",
  bookId: "book-1",
  dayNumber: 13,
  shortLabel: "if 가능",
  displayLabel: "Day 13 (if 가능)",
  learningSummary: "가능성을 조건으로 말한다.",
  sourcePageStart: 102,
  sourcePageEnd: 108,
  sourceNeedsReview: true,
  concepts: [{
    id: "concept-1",
    text: "if 뒤에는 조건을 둔다.",
    sourceKind: "book",
    sortOrder: 0
  }],
  patterns: [pattern],
  importantNotes: [{
    id: "note-1",
    patternId: "pattern-1",
    noteText: "will을 if절에 바로 쓰지 않는다.",
    sourcePage: 104,
    sortOrder: 0
  }],
  practicePrompts: [{
    id: "practice-1",
    patternId: "pattern-1",
    promptText: "시간이 되면 전화할게.",
    meaningKo: null,
    sourcePage: 106,
    sortOrder: 0
  }]
};

describe("WCT library components", () => {
  it("renders WCT Premium as a non-interactive placeholder", () => {
    render(<WctPremiumPlaceholderCard />);

    const card = screen.getByRole("article", { name: "WCT Premium 준비 중" });
    expect(within(card).getByText("WCT Premium")).toBeVisible();
    expect(within(card).getByText("준비 중")).toBeVisible();
    expect(within(card).queryByRole("link")).not.toBeInTheDocument();
    expect(within(card).queryByRole("button")).not.toBeInTheDocument();
  });

  it("links a compact Day label without exposing Topic", () => {
    render(<WctDayCard bookId="book-1" day={day} />);
    expect(screen.getByRole("link", { name: /Day 13 \(if 가능\)/ }))
      .toHaveAttribute("href", "/lessons/books/book-1/days/day-13");
    expect(screen.queryByText(/교재 102–108쪽/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Topic/i)).not.toBeInTheDocument();
  });

  it("marks AI-supplemented usage guidance and renders source examples", () => {
    render(<WctPatternCard pattern={pattern} />);
    expect(screen.getByText("AI 보완")).toBeVisible();
    expect(screen.getByText("It is made of wood.")).toBeVisible();
    expect(screen.queryByText("교재 8쪽")).not.toBeInTheDocument();
  });

  it("renders all Day sections as read-only content", () => {
    render(<WctDayContent day={day} />);
    expect(screen.getByText("핵심 개념")).toBeVisible();
    expect(screen.getByText("핵심 패턴")).toBeVisible();
    expect(screen.getByText("중요 메모")).toBeVisible();
    expect(screen.getByText("핵심 연습")).toBeVisible();
    expect(screen.getByText("원문 확인 필요")).toBeVisible();
    expect(screen.queryByText("교재 104쪽")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /추가|수정|삭제|저장/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/Topic/i)).not.toBeInTheDocument();
  });
});
