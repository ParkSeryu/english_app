import type { AnchorHTMLAttributes, ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WctDayCard } from "@/components/wct/WctDayCard";
import { WctDayContent } from "@/components/wct/WctDayContent";
import { WctPatternCard } from "@/components/wct/WctPatternCard";
import { WctPremiumCard } from "@/components/wct/WctPremiumCard";
import { WctPremiumDayCard } from "@/components/wct/WctPremiumDayCard";
import { WctPremiumDayContent } from "@/components/wct/WctPremiumDayContent";
import { getWctPremiumLesson } from "@/lib/wct/premium-lessons";
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
  it("links WCT Premium from the lesson shelf", () => {
    render(<WctPremiumCard />);

    const link = screen.getByRole("link", { name: "WCT Premium" });
    expect(link).toHaveAttribute("href", "/lessons/premium");
    expect(link).toHaveClass("border-slate-200", "bg-white", "hover:border-teal-300");
    expect(within(link).getByText("Day 1")).toBeVisible();
    expect(screen.queryByText("준비 중")).not.toBeInTheDocument();
  });

  it("links the approved Premium Day 1", () => {
    const lesson = getWctPremiumLesson("day-1");
    if (!lesson) throw new Error("Expected Premium Day 1 fixture");

    render(<WctPremiumDayCard lesson={lesson} />);

    const link = screen.getByRole("link", {
      name: /Day 1.*관계대명사 기초/
    });

    expect(link).toHaveAttribute("href", "/lessons/premium/days/day-1");
    expect(link).toHaveClass("border-slate-200", "bg-white", "hover:border-teal-300");
  });

  it("renders the approved Premium lesson without edit controls or source badges", () => {
    const lesson = getWctPremiumLesson("day-1");
    if (!lesson) throw new Error("Expected Premium Day 1 fixture");

    render(<WctPremiumDayContent lesson={lesson} />);

    expect(screen.getByText("핵심 내용")).toBeVisible();
    expect(screen.getByText("주격과 목적격")).toBeVisible();
    expect(screen.getByText("생략 규칙")).toBeVisible();
    expect(screen.getByText("what과의 차이")).toBeVisible();
    expect(screen.getByText("핵심 패턴")).toBeVisible();
    const example = screen.getAllByText("→ I know the person who came to WCT.")[0].parentElement;
    expect(example).toHaveClass("bg-slate-50", "text-ink");
    expect(screen.getByText("what = the thing that")).toBeVisible();
    expect(screen.getByText("what = the thing that").parentElement).toHaveClass("bg-teal-50", "text-slate-700");
    expect(screen.getByText("선행사 + who / which / that + 설명").parentElement).toHaveClass(
      "rounded-3xl",
      "border-slate-200",
      "bg-white",
      "shadow-sm"
    );
    expect(screen.queryByText("AI 보완")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /추가|수정|삭제|저장/ })).not.toBeInTheDocument();
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
