import type { AnchorHTMLAttributes, ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const navigation = vi.hoisted(() => ({
  pathname: "/expressions",
  searchParams: new URLSearchParams()
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useSearchParams: () => navigation.searchParams
}));

vi.mock("next/link", () => ({
  default: ({ href, children, onClick, prefetch: _prefetch, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode; prefetch?: boolean }) => (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </a>
  )
}));

import { BottomNav } from "@/components/BottomNav";

describe("BottomNav", () => {
  beforeEach(() => {
    navigation.pathname = "/expressions";
    navigation.searchParams = new URLSearchParams();
    window.localStorage.clear();
  });

  it("keeps stable tab labels and marks the current route", () => {
    render(<BottomNav />);

    expect(screen.getByRole("link", { name: "표현" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "암기" })).toHaveAttribute("href", "/memorize");
    expect(screen.getByRole("link", { name: "수업" })).toHaveAttribute("href", "/wct");
    expect(screen.getByRole("link", { name: "묘사" })).toHaveAttribute("href", "/picture-description");
    expect(screen.queryByRole("link", { name: "질문거리" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: "암기" }));

    expect(screen.getByRole("link", { name: "암기" })).toHaveAttribute("href", "/memorize");
    expect(screen.queryByRole("link", { name: "이동 중…" })).not.toBeInTheDocument();
  });

  it("returns to the last expressions topic from another tab", () => {
    window.localStorage.setItem("english:last-expressions-path", "/expressions?topic=topic-2");
    navigation.pathname = "/memorize";

    render(<BottomNav />);

    expect(screen.getByRole("link", { name: "표현" })).toHaveAttribute("href", "/expressions?topic=topic-2");
  });

  it("marks the WCT lesson notes route as the class tab", () => {
    navigation.pathname = "/wct";

    render(<BottomNav />);

    expect(screen.getByRole("link", { name: "수업" })).toHaveAttribute("href", "/wct");
    expect(screen.getByRole("link", { name: "수업" })).toHaveAttribute("aria-current", "page");
  });
});
