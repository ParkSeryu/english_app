"use client";

import { useEffect, useState } from "react";

type PronunciationButtonProps = {
  text: string;
  variant?: "light" | "dark";
  className?: string;
};

const variantClassNames = {
  light: "border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 focus:ring-teal-100",
  dark: "border border-white/20 bg-white/10 text-white hover:bg-white/15 focus:ring-white/20"
};

export function PronunciationButton({ text, variant = "light", className = "" }: PronunciationButtonProps) {
  const [supported, setSupported] = useState(false);
  const textToSpeak = text.trim();

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined");
  }, []);

  if (!supported || textToSpeak.length === 0) return null;

  function handleSpeak() {
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = "en-US";
    utterance.rate = 0.9;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  return (
    <button
      type="button"
      onClick={handleSpeak}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-black transition focus:outline-none focus:ring-4 ${variantClassNames[variant]} ${className}`}
      aria-label={`발음 듣기: ${textToSpeak}`}
    >
      <span aria-hidden="true">🔊</span>
      <span>발음 듣기</span>
    </button>
  );
}
