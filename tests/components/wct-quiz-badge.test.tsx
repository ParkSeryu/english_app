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
  it("shows the pending and completed labels", () => {
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

    expect(screen.getByRole("link", { name: "복습 문제 5개" }))
      .toHaveAttribute("href", "/quiz");

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

    expect(screen.getByRole("link", { name: "복습 완료 · 4/5" }))
      .toBeVisible();
  });
});
