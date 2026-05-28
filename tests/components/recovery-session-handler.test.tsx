import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  setSession: vi.fn()
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh })
}));

vi.mock("@/lib/supabase/browser", () => ({
  createBrowserSupabaseClient: () => ({
    auth: { setSession: mocks.setSession }
  })
}));

import { RecoverySessionHandler } from "@/components/RecoverySessionHandler";

describe("RecoverySessionHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, "", "/auth/update-password");
    mocks.setSession.mockResolvedValue({ error: null });
  });

  it("establishes a recovery session from Supabase hash tokens before showing the password form", async () => {
    window.history.replaceState(
      null,
      "",
      "/auth/update-password#access_token=access-token&refresh_token=refresh-token&type=recovery"
    );

    render(<RecoverySessionHandler />);

    expect(screen.getByText("재설정 링크 확인 중…")).toBeInTheDocument();

    await waitFor(() => {
      expect(mocks.setSession).toHaveBeenCalledWith({
        access_token: "access-token",
        refresh_token: "refresh-token"
      });
    });
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled());
    expect(mocks.replace).toHaveBeenCalledWith("/auth/update-password");
  });

  it("shows the link error when the reset link has no recovery tokens", async () => {
    render(<RecoverySessionHandler />);

    expect(await screen.findByRole("heading", { name: "링크 확인이 필요합니다" })).toBeInTheDocument();
    expect(mocks.setSession).not.toHaveBeenCalled();
  });
});
