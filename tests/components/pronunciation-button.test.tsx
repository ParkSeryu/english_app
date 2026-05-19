import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PronunciationButton } from "@/components/PronunciationButton";

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

describe("PronunciationButton", () => {
  afterEach(() => {
    Reflect.deleteProperty(window, "speechSynthesis");
    Reflect.deleteProperty(globalThis, "SpeechSynthesisUtterance");
  });

  it("is hidden when browser speech synthesis is unavailable", () => {
    render(<PronunciationButton text="Hello" />);

    expect(screen.queryByRole("button", { name: /발음 듣기/ })).not.toBeInTheDocument();
  });

  it("speaks the English text with a free browser TTS voice", async () => {
    const user = userEvent.setup();
    const speech = mockSpeechSynthesis();

    render(<PronunciationButton text=" They don't seem to care about me. " />);

    const button = await screen.findByRole("button", { name: /발음 듣기/ });
    await user.click(button);

    await waitFor(() => expect(speech.speak).toHaveBeenCalledTimes(1));
    expect(speech.cancel).toHaveBeenCalledTimes(1);
    expect(speech.cancel.mock.invocationCallOrder[0]).toBeLessThan(speech.speak.mock.invocationCallOrder[0]);
    const utterance = speech.speak.mock.calls[0][0] as MockSpeechSynthesisUtterance;
    expect(utterance.text).toBe("They don't seem to care about me.");
    expect(utterance.lang).toBe("en-US");
    expect(utterance.rate).toBe(0.9);
  });
});
