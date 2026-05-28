import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const actionState = { ok: false, message: "" };

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    useActionState: (action: unknown) => [actionState, action, false]
  };
});

vi.mock("@/app/actions", () => ({
  signInAction: vi.fn(),
  signInWithKakaoAction: vi.fn(),
  signUpAction: vi.fn(),
  resetPasswordAction: vi.fn()
}));

import { AuthPanel } from "@/components/AuthPanel";

describe("AuthPanel", () => {
  function visibleTextOrder() {
    return Array.from(document.body.querySelectorAll("button, h2, div"))
      .map((element) => element.textContent?.trim())
      .filter(Boolean)
      .join(" ");
  }

  it("starts with only the login form and exposes small account-help links", () => {
    render(<AuthPanel />);

    expect(screen.getByRole("heading", { name: "오늘도 영어 한 번" })).toBeInTheDocument();
    expect(screen.getByText("계정에 들어가서 암기 큐를 이어가요.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "회원가입" })).not.toBeInTheDocument();
    const kakaoButton = screen.getByRole("button", { name: "카카오로 시작하기" });
    expect(kakaoButton).toHaveClass("rounded-[1.35rem]", "bg-[#FEE500]", "active:scale-[0.98]");
    expect(kakaoButton.querySelector("svg")).toHaveClass("fill-[#FEE500]");
    expect(screen.queryByText("Kakao 간편 로그인")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "회원가입" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "아이디·비밀번호 찾기" })).toBeInTheDocument();
    expect(screen.getByText("간편 로그인")).toBeInTheDocument();
    expect(visibleTextOrder().indexOf("아이디·비밀번호 찾기")).toBeLessThan(visibleTextOrder().indexOf("카카오로 시작하기"));
    expect(visibleTextOrder().indexOf("회원가입")).toBeLessThan(visibleTextOrder().indexOf("카카오로 시작하기"));
  });

  it("passes a safe next path through the Kakao login form", () => {
    render(<AuthPanel next="/memorize?defer=card-1" />);

    const nextInput = screen.getByDisplayValue("/memorize?defer=card-1");
    expect(nextInput).toHaveAttribute("type", "hidden");
    expect(nextInput).toHaveAttribute("name", "next");
  });

  it("moves signup behind the small signup link instead of showing two forms at once", () => {
    render(<AuthPanel />);

    fireEvent.click(screen.getByRole("button", { name: "회원가입" }));

    expect(screen.getByRole("heading", { name: "회원가입" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "오늘도 영어 한 번" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "로그인" })).toBeInTheDocument();
  });

  it("shows email-as-id guidance and password reset form from account help", () => {
    render(<AuthPanel />);

    fireEvent.click(screen.getByRole("button", { name: "아이디·비밀번호 찾기" }));

    expect(screen.getByRole("heading", { name: "아이디·비밀번호 찾기" })).toBeInTheDocument();
    expect(screen.getByText(/이 앱은 이메일을 아이디로 사용해요/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "비밀번호 재설정 메일 받기" })).toBeInTheDocument();
  });
});
