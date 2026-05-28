import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExpressionReviewStats } from "@/components/ExpressionReviewStats";

describe("ExpressionReviewStats", () => {
  it("hides review counters when the expression is not in memorization cards", () => {
    const { container } = render(<ExpressionReviewStats expression={{ is_memorization_enabled: false, unknown_count: 2, hard_count: 1, okay_count: 1, easy_count: 1 }} />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText(/모름|어려움|알긴암|쉬움/)).not.toBeInTheDocument();
  });

  it("shows review counters for expressions included in memorization cards", () => {
    render(<ExpressionReviewStats expression={{ is_memorization_enabled: true, unknown_count: 2, hard_count: 1, okay_count: 2, easy_count: 3 }} />);

    expect(screen.getByText("모름 2회 · 어려움 1회")).toBeInTheDocument();
    expect(screen.getByText("알긴암 2회 · 쉬움 3회")).toBeInTheDocument();
  });

  it("renders the stacked list version only for memorization card expressions", () => {
    render(<ExpressionReviewStats expression={{ is_memorization_enabled: true, unknown_count: 4, hard_count: 2, okay_count: 3, easy_count: 5 }} variant="stacked" />);

    expect(screen.getByText("모름")).toBeInTheDocument();
    expect(screen.getByText("4회")).toBeInTheDocument();
    expect(screen.getByText("어려움")).toBeInTheDocument();
    expect(screen.getByText("2회")).toBeInTheDocument();
    expect(screen.getByText("알긴암")).toBeInTheDocument();
    expect(screen.getByText("3회")).toBeInTheDocument();
    expect(screen.getByText("쉬움")).toBeInTheDocument();
    expect(screen.getByText("5회")).toBeInTheDocument();
  });
});
