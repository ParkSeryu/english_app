import { createElement } from "react";
import type { ImgHTMLAttributes } from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: ({ src, alt, priority: _priority, ...props }: ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean; src: string }) =>
    createElement("img", { src, alt, ...props })
}));

import { PictureDescriptionTrainer } from "@/components/PictureDescriptionTrainer";

describe("PictureDescriptionTrainer", () => {
  const storageKey = "english:picture-description:draft:user-1:friends-camera-stone-wall";
  const secondCardStorageKey = "english:picture-description:draft:user-1:couple-hugging-winter-trees";

  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders the practice photo, five writing prompts, and answer progress", () => {
    render(<PictureDescriptionTrainer storageOwnerId="user-1" />);

    expect(screen.getByRole("heading", { name: "사진 묘사 훈련" })).toBeInTheDocument();
    expect(screen.getByText("카메라를 보는 두 친구 · 사진 1/2")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Two women standing together/i })).toHaveAttribute("src", "/picture-description/friends-camera-stone-wall.jpg");
    expect(screen.getAllByRole("textbox")).toHaveLength(5);
    expect(screen.getByText("작성 0/5")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("1. 전체 상황"), { target: { value: "This picture shows two friends." } });

    expect(screen.getByText("작성 1/5")).toBeInTheDocument();
  });

  it("reveals model answers and useful expressions on demand", () => {
    render(<PictureDescriptionTrainer storageOwnerId="user-1" />);

    expect(screen.queryByText("This picture shows two women standing in front of a stone wall.")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "모범답안 보기" }));

    expect(screen.getByText("This picture shows two women standing in front of a stone wall.")).toBeInTheDocument();
    const expressionSection = screen.getByRole("region", { name: "표현 후보" });
    expect(within(expressionSection).getByText("leaning in to see")).toBeInTheDocument();
  });

  it("moves to the winter hugging card with its own prompts and model answers", () => {
    render(<PictureDescriptionTrainer storageOwnerId="user-1" />);

    fireEvent.click(screen.getByRole("button", { name: "다음 사진" }));

    expect(screen.getByText("겨울 숲에서 안고 있는 두 사람 · 사진 2/2")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /A man and a woman wearing black clothes hugging/i })).toHaveAttribute("src", "/picture-description/couple-hugging-winter-trees.jpg");
    expect(screen.getByLabelText("1. 전체 상황")).toHaveAttribute("placeholder", "This is a picture of...");

    fireEvent.click(screen.getByRole("button", { name: "모범답안 보기" }));

    expect(screen.getByText("This is a picture of a man and a woman hugging.")).toBeInTheDocument();
    expect(screen.getByText("In the background, there are trees without leaves.")).toBeInTheDocument();
    const expressionSection = screen.getByRole("region", { name: "표현 후보" });
    expect(within(expressionSection).getByText("It looks like winter")).toBeInTheDocument();
  });

  it("autosaves draft answers by user and picture card", async () => {
    const { unmount } = render(<PictureDescriptionTrainer storageOwnerId="user-1" />);

    fireEvent.change(screen.getByLabelText("1. 전체 상황"), { target: { value: "This picture shows two friends." } });

    await waitFor(() => {
      expect(window.localStorage.getItem(storageKey)).toContain("This picture shows two friends.");
    });

    unmount();
    render(<PictureDescriptionTrainer storageOwnerId="user-1" />);

    expect(await screen.findByDisplayValue("This picture shows two friends.")).toBeInTheDocument();
  });

  it("keeps drafts separate for each picture card", async () => {
    render(<PictureDescriptionTrainer storageOwnerId="user-1" />);

    fireEvent.click(screen.getByRole("button", { name: "다음 사진" }));
    fireEvent.change(screen.getByLabelText("1. 전체 상황"), { target: { value: "This is a picture of a couple hugging." } });

    await waitFor(() => {
      expect(window.localStorage.getItem(secondCardStorageKey)).toContain("This is a picture of a couple hugging.");
    });
    expect(window.localStorage.getItem(storageKey)).toBeNull();
  });

  it("clears the current picture draft when restarting", async () => {
    window.localStorage.setItem(storageKey, JSON.stringify({ overview: "Saved answer" }));
    render(<PictureDescriptionTrainer storageOwnerId="user-1" />);

    expect(await screen.findByDisplayValue("Saved answer")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다시 쓰기" }));

    await waitFor(() => {
      expect(window.localStorage.getItem(storageKey)).toBeNull();
    });
    expect(screen.getByLabelText("1. 전체 상황")).toHaveValue("");
  });
});
