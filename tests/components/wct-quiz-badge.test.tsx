import type { AnchorHTMLAttributes, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WctQuizBadge } from "@/components/wct/WctQuizBadge";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    children: ReactNode;
  }) => <a href={href} {...props}>{children}</a>
}));

describe("WctQuizBadge", () => {
  it("shows full-width pending and completed CTA states", () => {
    const { rerender } = render(
      <WctQuizBadge
        href="/quiz"
        summary={{
          quizSetId: "set-1",
          questionCount: 5,
          latestScore: null,
          completedAt: null
        }}
      />
    );

    const pendingLink = screen.getByRole("link", {
      name: "문제 풀기 5문제"
    });
    expect(pendingLink).toHaveAttribute("href", "/quiz");
    expect(pendingLink).toHaveClass("flex", "w-full", "bg-teal-600");
    expect(pendingLink).toHaveClass("focus-visible:ring-4");

    rerender(
      <WctQuizBadge
        href="/quiz"
        summary={{
          quizSetId: "set-1",
          questionCount: 5,
          latestScore: 4,
          completedAt: "2026-07-28T00:00:00Z"
        }}
      />
    );

    expect(screen.getByRole("link", {
      name: "다시 풀기 최근 4/5"
    })).toBeVisible();
  });
});
