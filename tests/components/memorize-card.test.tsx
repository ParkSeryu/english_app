import type { ComponentType } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions", () => ({
  recordExpressionReviewAction: vi.fn(async () => undefined),
  recordExpressionReviewInPlaceAction: vi.fn(async () => ({ ok: true }))
}));

async function importModule<T>(specifier: string): Promise<T> {
  return import(/* @vite-ignore */ specifier) as Promise<T>;
}

type ExpressionCardForTest = {
  id: string;
  expression_day_id: string;
  owner_id: string;
  english: string;
  korean_prompt: string;
  nuance_note: string | null;
  structure_note: string | null;
  grammar_note: string | null;
  user_memo: string | null;
  source_order: number;
  unknown_count: number;
  hard_count: number;
  okay_count: number;
  easy_count: number;
  review_count: number;
  last_result: "known" | "unknown" | null;
  last_reviewed_at: string | null;
  due_at: string | null;
  interval_days: number;
  created_at: string;
  updated_at: string;
  day?: {
    id: string;
    title: string;
    source_note: string | null;
    day_date: string | null;
    folder_path?: string[];
  };
  examples: Array<{
    id: string;
    expression_id: string;
    example_text: string;
    meaning_ko: string | null;
    source: "llm" | "user" | "class";
    sort_order: number;
    created_at: string;
  }>;
};

type MemorizeCardModule = {
  MemorizeCard: ComponentType<{ expression: ExpressionCardForTest; returnTo?: string; reviewNow?: Date }>;
};

class MockSpeechSynthesisUtterance {
  text: string;
  lang = "";
  rate = 1;

  constructor(text: string) {
    this.text = text;
  }
}

function mockSpeechSynthesis() {
  const cancel = vi.fn();
  const speak = vi.fn();

  Object.defineProperty(window, "speechSynthesis", {
    configurable: true,
    value: { cancel, speak }
  });
  Object.defineProperty(globalThis, "SpeechSynthesisUtterance", {
    configurable: true,
    value: MockSpeechSynthesisUtterance
  });

  return { cancel, speak };
}

const expression: ExpressionCardForTest = {
  id: "expression-1",
  expression_day_id: "day-1",
  owner_id: "user-a",
  english: "They don't seem to care about me.",
  korean_prompt: "그들은 저를 신경 쓰지 않는 것 같아요.",
  nuance_note: "원문 문장을 암기 답으로 유지한다.",
  structure_note: "seem to + 동사원형",
  grammar_note: "don't seem to + 동사원형 = ~하는 것 같지 않다",
  user_memo: null,
  source_order: 0,
  unknown_count: 2,
  hard_count: 3,
  okay_count: 4,
  easy_count: 5,
  review_count: 14,
  last_result: "unknown",
  last_reviewed_at: "2026-04-28T00:00:00.000Z",
  due_at: null,
  interval_days: 0,
  created_at: "2026-04-27T00:00:00.000Z",
  updated_at: "2026-04-28T00:00:00.000Z",
  day: {
    id: "day-1",
    title: "1주차 (260427)",
    source_note: "수업 표현",
    day_date: "2026-04-27",
    folder_path: ["수원영어모임"]
  },
  examples: [{ id: "example-1", expression_id: "expression-1", example_text: "They don't seem interested in me.", meaning_ko: "그들은 나에게 관심이 없어 보여요.", source: "llm", sort_order: 0, created_at: "2026-04-28T00:00:00.000Z" }]
};

describe("MemorizeCard", () => {
  afterEach(() => {
    Reflect.deleteProperty(window, "speechSynthesis");
    Reflect.deleteProperty(globalThis, "SpeechSynthesisUtterance");
    vi.useRealTimers();
  });

  it("shows Korean first, hides English until reveal, then exposes 다시/어려움/알긴암/쉬움 controls", async () => {
    const user = userEvent.setup();
    const speech = mockSpeechSynthesis();
    const { MemorizeCard } = await importModule<MemorizeCardModule>("@/components/MemorizeCard");
    render(<MemorizeCard expression={expression} />);

    expect(screen.getByRole("heading", { name: expression.korean_prompt })).toBeInTheDocument();
    expect(screen.queryByText("토픽:")).not.toBeInTheDocument();
    expect(screen.getByText("수원영어모임 1주차 (260427)")).toBeInTheDocument();
    expect(screen.queryByText("수원영어모임 1주차 (260427) (260427)")).not.toBeInTheDocument();
    expect(screen.queryByText("회차")).not.toBeInTheDocument();
    expect(screen.queryByText("2026-04-27")).not.toBeInTheDocument();
    expect(screen.queryByText("수업 표현")).not.toBeInTheDocument();

    const counters = screen.getByText("다시 2회").parentElement;
    expect(counters).not.toBeNull();
    expect(counters as HTMLElement).toHaveClass("grid");
    expect(counters as HTMLElement).toHaveClass("grid-cols-2");
    expect(counters as HTMLElement).toHaveClass("justify-items-end");
    expect(counters as HTMLElement).toHaveClass("text-right");
    expect(within(counters as HTMLElement).getAllByText(/회$/).map((node) => node.textContent)).toEqual(["다시 2회", "어려움 3회", "알긴암 4회", "쉬움 5회"]);
    expect(screen.queryByText(/외움/)).not.toBeInTheDocument();
    expect(screen.queryByText(/이전 \d+회/)).not.toBeInTheDocument();
    expect(screen.queryByText(expression.english)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /정답 보기/ }));

    expect(screen.queryByRole("button", { name: /정답 보기/ })).not.toBeInTheDocument();
    expect(screen.getByText(expression.english)).toBeInTheDocument();
    expect(screen.getByText("비슷한 표현")).toBeInTheDocument();
    expect(screen.getByText("They don't seem interested in me.")).toBeInTheDocument();
    expect(screen.getByText("don't seem to + 동사원형")).toBeInTheDocument();
    expect(screen.getByText("~하는 것 같지 않다")).toBeInTheDocument();
    expect(screen.getByLabelText("뜻")).toHaveTextContent("→");
    expect(screen.queryByText("느낌 / 뉘앙스")).not.toBeInTheDocument();
    expect(screen.queryByText("구조")).not.toBeInTheDocument();
    expect(screen.queryByText(expression.nuance_note ?? "")).not.toBeInTheDocument();
    expect(screen.queryByText(expression.structure_note ?? "")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /다시.*오늘 다시/s })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /어려움.*1일 뒤/s })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /알긴암.*1일 뒤/s })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /쉬움.*3일 뒤/s })).toBeInTheDocument();

    const pronunciationButton = await screen.findByRole("button", { name: /발음 듣기/ });
    await user.click(pronunciationButton);
    expect(speech.cancel).toHaveBeenCalledTimes(1);
    expect(speech.speak).toHaveBeenCalledTimes(1);

    const reviewButtons = screen.getAllByRole("button").filter((button) => /^(다시|어려움|알긴암|쉬움)/.test(button.textContent ?? ""));
    expect(reviewButtons.map((button) => button.textContent)).toEqual(["다시오늘 다시", "어려움1일 뒤", "알긴암1일 뒤", "쉬움3일 뒤"]);
  });

  it("adds the compact date to topic labels when the stored title no longer includes it", async () => {
    const { MemorizeCard } = await importModule<MemorizeCardModule>("@/components/MemorizeCard");
    render(<MemorizeCard expression={{ ...expression, day: { ...expression.day!, title: "1주차" } }} />);

    expect(screen.getByText("수원영어모임 1주차 (260427)")).toBeInTheDocument();
  });

  it("lets long mobile topic labels wrap without a topic prefix", async () => {
    const { MemorizeCard } = await importModule<MemorizeCardModule>("@/components/MemorizeCard");
    render(
      <MemorizeCard
        expression={{
          ...expression,
          day: {
            ...expression.day!,
            title: "회화연습반",
            day_date: "2026-05-04",
            folder_path: ["수원영어모임"]
          }
        }}
      />
    );

    const topicLabel = screen.getByText("수원영어모임 회화연습반 (260504)");
    expect(screen.queryByText("토픽:")).not.toBeInTheDocument();
    expect(topicLabel).toHaveClass("whitespace-normal");
    expect(topicLabel).toHaveClass("break-words");
    expect(topicLabel).not.toHaveClass("truncate");
    expect(topicLabel.closest("div")).toHaveClass("inline-flex");
    expect(topicLabel.closest("div")).toHaveClass("w-fit");
    expect(topicLabel.closest("div")).toHaveClass("items-start");

    const counters = screen.getByText("다시 2회").parentElement;
    expect(counters).not.toBeNull();
    expect(counters as HTMLElement).toHaveClass("justify-items-end");
    expect(counters as HTMLElement).toHaveClass("text-right");
  });

  it("shows zero button result counts without exposing remembered aggregate copy", async () => {
    const { MemorizeCard } = await importModule<MemorizeCardModule>("@/components/MemorizeCard");
    render(<MemorizeCard expression={{ ...expression, hard_count: 0, okay_count: 0, easy_count: 0 }} />);

    expect(screen.queryByText(/외움/)).not.toBeInTheDocument();
    expect(screen.getByText("다시 2회")).toBeInTheDocument();
    expect(screen.getByText("어려움 0회")).toBeInTheDocument();
    expect(screen.getByText("알긴암 0회")).toBeInTheDocument();
    expect(screen.getByText("쉬움 0회")).toBeInTheDocument();
    expect(screen.queryByText(/이전 \d+회/)).not.toBeInTheDocument();
  });

  it("shows the four button result counts from visible review buttons", async () => {
    const { MemorizeCard } = await importModule<MemorizeCardModule>("@/components/MemorizeCard");
    render(<MemorizeCard expression={{ ...expression, unknown_count: 12, hard_count: 0, okay_count: 0, easy_count: 1 }} />);

    expect(screen.queryByText(/외움/)).not.toBeInTheDocument();
    expect(screen.getByText("다시 12회")).toBeInTheDocument();
    expect(screen.getByText("어려움 0회")).toBeInTheDocument();
    expect(screen.getByText("알긴암 0회")).toBeInTheDocument();
    expect(screen.getByText("쉬움 1회")).toBeInTheDocument();
    expect(screen.queryByText(/이전 3회/)).not.toBeInTheDocument();
  });

  it("shows hard, okay, and easy review intervals on remembered buttons", async () => {
    const user = userEvent.setup();
    const { MemorizeCard } = await importModule<MemorizeCardModule>("@/components/MemorizeCard");
    render(<MemorizeCard expression={{ ...expression, last_result: "known", interval_days: 30 }} />);

    await user.click(screen.getByRole("button", { name: /정답 보기/ }));

    expect(screen.getByRole("button", { name: /어려움.*14일 뒤/s })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /알긴암.*30일 뒤/s })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /쉬움.*60일 뒤/s })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /다시.*오늘 다시/s })).toBeInTheDocument();
  });

  it("shows remembered button days relative to the current click time when a card is overdue", async () => {
    const user = userEvent.setup();
    const { MemorizeCard } = await importModule<MemorizeCardModule>("@/components/MemorizeCard");
    render(<MemorizeCard expression={{ ...expression, last_result: "known", interval_days: 7, due_at: "2026-04-28T15:00:00.000Z" }} reviewNow={new Date("2026-05-03T12:00:00.000Z")} />);

    await user.click(screen.getByRole("button", { name: /정답 보기/ }));

    expect(screen.getByRole("button", { name: /어려움.*오늘 다시/s })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /알긴암.*3일 뒤/s })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /쉬움.*10일 뒤/s })).toBeInTheDocument();
  });

  it("hides the answer again after marking an expression unknown", async () => {
    const user = userEvent.setup();
    const { MemorizeCard } = await importModule<MemorizeCardModule>("@/components/MemorizeCard");
    render(<MemorizeCard expression={expression} />);

    await user.click(screen.getByRole("button", { name: /정답 보기/ }));
    expect(screen.getByText(expression.english)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /다시/ }));

    expect(screen.queryByText(expression.english)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /정답 보기/ })).toBeInTheDocument();
  });

  it("preserves leading star text while formatting labeled and unlabeled meaning separators", async () => {
    const user = userEvent.setup();
    const { MemorizeCard } = await importModule<MemorizeCardModule>("@/components/MemorizeCard");
    const grammarNote = "★★★ 문법: be used to + 명사/-ing = ~에 익숙하다\nused to + 동사원형 = 예전에 ~하곤 했다";

    render(<MemorizeCard expression={{ ...expression, grammar_note: grammarNote }} />);

    await user.click(screen.getByRole("button", { name: /정답 보기/ }));

    const noteSection = screen.getByRole("heading", { name: "문법/패턴" }).closest("section");
    expect(noteSection).not.toBeNull();

    const labels = within(noteSection as HTMLElement).getAllByText(/^문법$/);
    expect(labels).toHaveLength(1);
    expect(labels.every((label) => label.tagName.toLowerCase() === "strong")).toBe(true);
    expect(noteSection).not.toHaveTextContent("문법:");
    expect(noteSection).not.toHaveTextContent("패턴:");
    expect(within(noteSection as HTMLElement).queryByText("✦")).not.toBeInTheDocument();
    expect(noteSection).toHaveTextContent("★★★");
    expect(noteSection).toHaveTextContent("be used to + 명사/-ing");
    expect(noteSection).toHaveTextContent("~에 익숙하다");
    expect(noteSection).toHaveTextContent("used to + 동사원형");
    expect(noteSection).toHaveTextContent("예전에 ~하곤 했다");
    expect(noteSection).toHaveTextContent("→");
    expect(noteSection).not.toHaveTextContent(" = ");
  });
});
