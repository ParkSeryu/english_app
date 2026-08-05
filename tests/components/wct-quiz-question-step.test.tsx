import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WctQuizQuestionStep } from "@/components/wct/WctQuizQuestionStep";
import type { WctQuizQuestion } from "@/lib/wct/quiz/types";

const multipleChoiceQuestion: WctQuizQuestion = {
  id: "multiple-choice-question",
  kind: "translation",
  format: "multiple_choice",
  prompt: "알맞은 문장을 고르세요.",
  choices: [
    { id: "multiple-choice-a", text: "I can help you." },
    { id: "multiple-choice-b", text: "I helping you." },
    { id: "multiple-choice-c", text: "I can helps you." },
    { id: "multiple-choice-d", text: "I am can help you." }
  ],
  correctChoiceId: "multiple-choice-a",
  explanation: "Legacy explanation",
  feedback: {
    correctSentence: "I can help you.",
    pattern: "can + 동사원형",
    reason: "조동사 can 뒤에는 동사원형이 와요."
  }
};

const fillBlankQuestion: WctQuizQuestion = {
  id: "fill-blank-question",
  kind: "pattern",
  format: "fill_blank",
  prompt: "I ____ help you.",
  choices: [
    { id: "fill-blank-a", text: "can" },
    { id: "fill-blank-b", text: "am" },
    { id: "fill-blank-c", text: "do" },
    { id: "fill-blank-d", text: "have" }
  ],
  correctChoiceId: "fill-blank-a",
  explanation: "Legacy explanation",
  feedback: {
    correctSentence: "I can help you.",
    pattern: "can + 동사원형",
    reason: "빈칸에는 조동사 can이 알맞아요."
  }
};

const trueFalseQuestion: WctQuizQuestion = {
  id: "true-false-question",
  kind: "concept",
  format: "true_false",
  prompt: "can 뒤에는 동사원형이 온다.",
  choices: [
    { id: "true-false-o", text: "O" },
    { id: "true-false-x", text: "X" }
  ],
  correctChoiceId: "true-false-o",
  explanation: "Legacy explanation",
  feedback: {
    correctSentence: "I can help you.",
    pattern: "can + 동사원형",
    reason: "조동사 뒤에는 동사원형이 와요."
  }
};

const legacyQuestion: WctQuizQuestion = {
  id: "legacy-question",
  kind: "translation",
  prompt: "Choose the legacy answer.",
  choices: [
    { id: "legacy-a", text: "Legacy correct" },
    { id: "legacy-b", text: "Legacy wrong A" },
    { id: "legacy-c", text: "Legacy wrong B" },
    { id: "legacy-d", text: "Legacy wrong C" }
  ],
  correctChoiceId: "legacy-a",
  explanation: "Premium legacy explanation"
};

function renderQuestion(
  question: WctQuizQuestion,
  options: {
    selectedChoiceId?: string | null;
    isAnswerConfirmed?: boolean;
    feedbackContext?: string;
  } = {}
) {
  render(
    <WctQuizQuestionStep
      question={question}
      selectedChoiceId={options.selectedChoiceId ?? null}
      isAnswerConfirmed={options.isAnswerConfirmed ?? false}
      onSelectChoice={vi.fn()}
      onConfirm={vi.fn()}
      confirmDisabled={options.selectedChoiceId === undefined}
      nextLabel="다음 문제"
      onNext={vi.fn()}
      feedbackContext={options.feedbackContext}
    />
  );
}

describe("WctQuizQuestionStep", () => {
  it("renders the explicit multiple-choice badge and provided choices", () => {
    renderQuestion(multipleChoiceQuestion);

    expect(screen.getByText("문장 선택")).toBeVisible();
    for (const choice of multipleChoiceQuestion.choices) {
      expect(screen.getByRole("button", { name: choice.text })).toBeVisible();
    }
  });

  it("renders the explicit fill-blank badge and prompt without a textbox", () => {
    renderQuestion(fillBlankQuestion);

    expect(screen.getByText("빈칸")).toBeVisible();
    expect(screen.getByText(/____/)).toBeVisible();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("renders exactly the two provided O/X choice buttons without a textbox", () => {
    renderQuestion(trueFalseQuestion);

    expect(screen.getByText("O/X")).toBeVisible();
    expect(screen.getByRole("button", { name: "O" })).toBeVisible();
    expect(screen.getByRole("button", { name: "X" })).toBeVisible();
    expect(screen.getAllByRole("button").filter((button) => (
      button.textContent === "O" || button.textContent === "X"
    ))).toHaveLength(2);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("reveals Day context and structured feedback in order only after confirmation", () => {
    const feedbackContext = "Day 13 · if 가능";
    const { rerender } = render(
      <WctQuizQuestionStep
        question={multipleChoiceQuestion}
        selectedChoiceId="multiple-choice-a"
        isAnswerConfirmed={false}
        onSelectChoice={vi.fn()}
        onConfirm={vi.fn()}
        confirmDisabled={false}
        nextLabel="다음 문제"
        onNext={vi.fn()}
        feedbackContext={feedbackContext}
      />
    );

    expect(screen.queryByText(feedbackContext)).not.toBeInTheDocument();
    expect(screen.queryByText("정답 문장 · I can help you.")).not.toBeInTheDocument();
    expect(screen.queryByText("원래 패턴 · can + 동사원형")).not.toBeInTheDocument();
    expect(screen.queryByText("조동사 can 뒤에는 동사원형이 와요.")).not.toBeInTheDocument();

    rerender(
      <WctQuizQuestionStep
        question={multipleChoiceQuestion}
        selectedChoiceId="multiple-choice-a"
        isAnswerConfirmed
        onSelectChoice={vi.fn()}
        onConfirm={vi.fn()}
        confirmDisabled={false}
        nextLabel="다음 문제"
        onNext={vi.fn()}
        feedbackContext={feedbackContext}
      />
    );

    const orderedFeedback = [
      screen.getByText("정답이에요"),
      screen.getByText(feedbackContext),
      screen.getByText("정답 문장 · I can help you."),
      screen.getByText("원래 패턴 · can + 동사원형"),
      screen.getByText("조동사 can 뒤에는 동사원형이 와요.")
    ];
    for (let index = 0; index < orderedFeedback.length - 1; index += 1) {
      expect(orderedFeedback[index].compareDocumentPosition(orderedFeedback[index + 1])
        & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
    expect(screen.queryByText("Legacy explanation")).not.toBeInTheDocument();
  });

  it("keeps raw v1 Premium questions badge-free with legacy explanation", () => {
    renderQuestion(legacyQuestion, {
      selectedChoiceId: "legacy-a",
      isAnswerConfirmed: true
    });

    expect(screen.queryByText("문장 선택")).not.toBeInTheDocument();
    expect(screen.queryByText("빈칸")).not.toBeInTheDocument();
    expect(screen.queryByText("O/X")).not.toBeInTheDocument();
    expect(screen.getByText("Premium legacy explanation")).toBeVisible();
    expect(screen.queryByText(/정답 문장 ·/)).not.toBeInTheDocument();
    expect(screen.queryByText(/원래 패턴 ·/)).not.toBeInTheDocument();
  });
});
