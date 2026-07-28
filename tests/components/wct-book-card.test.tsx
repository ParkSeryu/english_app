import type { AnchorHTMLAttributes, ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WctBookCard } from "@/components/wct/WctBookCard";
import type { WctBookSummary } from "@/lib/wct/types";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  )
}));

const book: WctBookSummary = {
  id: "book-1",
  title: "WCT PreNovice",
  levelLabel: "Pre Novice",
  dayCount: 16,
  sortOrder: 0
};

describe("WctBookCard", () => {
  it("does not repeat the level below a title that already includes it", () => {
    render(<WctBookCard book={book} />);

    const link = screen.getByRole("link", { name: /WCT PreNovice/ });
    expect(within(link).getByText("Day 16개")).toBeVisible();
    expect(within(link).queryByText("Pre Novice")).not.toBeInTheDocument();
    expect(link).not.toHaveTextContent("·");
  });
});
