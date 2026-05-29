import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn()
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUser: mocks.getCurrentUser
}));

import UpdatePasswordPage from "@/app/auth/update-password/page";

describe("UpdatePasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the completion state after the password update redirect without treating the used link as expired", async () => {
    const page = await UpdatePasswordPage({ searchParams: Promise.resolve({ updated: "1" }) });

    render(page);

    expect(screen.getByRole("heading", { name: "변경 완료" })).toBeInTheDocument();
    expect(screen.getByText("비밀번호를 변경했습니다. 새 비밀번호로 로그인해 주세요.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "링크 확인이 필요합니다" })).not.toBeInTheDocument();
    expect(mocks.getCurrentUser).not.toHaveBeenCalled();
  });
});
