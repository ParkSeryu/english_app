"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type PictureDescriptionPrompt = {
  id: string;
  label: string;
  starter: string;
  modelAnswer: string;
};

type PictureDescriptionCard = {
  id: string;
  title: string;
  imageSrc: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
  hints: string[];
  usefulExpressions: string[];
  prompts: PictureDescriptionPrompt[];
};

const pictureDescriptionCards: PictureDescriptionCard[] = [
  {
    id: "friends-camera-stone-wall",
    title: "카메라를 보는 두 친구",
    imageSrc: "/picture-description/friends-camera-stone-wall.jpg",
    imageAlt: "Two women standing together in front of a grey stone wall while looking at a camera.",
    imageWidth: 1024,
    imageHeight: 1536,
    hints: ["two women", "camera", "black leather jacket", "leaning in", "grey stone wall"],
    usefulExpressions: ["standing in front of", "looking at a camera together", "leaning in to see", "In the background", "Overall, it looks like"],
    prompts: [
      {
        id: "overview",
        label: "전체 상황",
        starter: "This picture shows...",
        modelAnswer: "This picture shows two women standing in front of a stone wall."
      },
      {
        id: "main-subject",
        label: "주요 대상",
        starter: "The main subjects are...",
        modelAnswer: "The main subjects are two women looking at a camera together."
      },
      {
        id: "left-person",
        label: "왼쪽 인물",
        starter: "The woman on the left is...",
        modelAnswer: "The woman on the left is wearing a black leather jacket and holding a camera."
      },
      {
        id: "right-person",
        label: "오른쪽 인물",
        starter: "The woman on the right is...",
        modelAnswer: "The woman on the right is leaning in to see the camera screen."
      },
      {
        id: "background",
        label: "배경과 느낌",
        starter: "In the background... / Overall...",
        modelAnswer: "In the background, there is a large grey stone wall. Overall, it looks like they are close friends."
      }
    ]
  },
  {
    id: "couple-hugging-winter-trees",
    title: "겨울 숲에서 안고 있는 두 사람",
    imageSrc: "/picture-description/couple-hugging-winter-trees.jpg",
    imageAlt: "A man and a woman wearing black clothes hugging in a winter park with leafless trees and fallen leaves.",
    imageWidth: 1024,
    imageHeight: 1536,
    hints: ["a man and a woman", "hugging", "black clothes", "a ring", "trees without leaves", "leaves on the ground"],
    usefulExpressions: ["a man and a woman hugging", "both wearing black clothes", "on his right hand", "trees without leaves", "leaves on the ground", "It looks like winter"],
    prompts: [
      {
        id: "overview",
        label: "전체 상황",
        starter: "This is a picture of...",
        modelAnswer: "This is a picture of a man and a woman hugging."
      },
      {
        id: "appearance",
        label: "옷과 머리",
        starter: "They are both...",
        modelAnswer: "They are both wearing black clothes and have black hair."
      },
      {
        id: "detail",
        label: "세부 묘사",
        starter: "The man is wearing...",
        modelAnswer: "The man is wearing a ring on his right hand."
      },
      {
        id: "background",
        label: "배경",
        starter: "In the background...",
        modelAnswer: "In the background, there are trees without leaves."
      },
      {
        id: "season",
        label: "계절과 느낌",
        starter: "The leaves are... / It looks like...",
        modelAnswer: "The leaves are on the ground. It looks like winter."
      }
    ]
  }
];

type Answers = Record<string, string>;

type PictureDescriptionTrainerProps = {
  storageOwnerId: string;
};

function draftStorageKey(ownerId: string, cardId: string) {
  return `english:picture-description:draft:${ownerId}:${cardId}`;
}

function readDraftAnswers(storageKey: string, prompts: PictureDescriptionPrompt[]) {
  const rawDraft = window.localStorage.getItem(storageKey);
  if (!rawDraft) return {};

  try {
    const parsed = JSON.parse(rawDraft) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const draft = parsed as Record<string, unknown>;
    return prompts.reduce<Answers>((answers, prompt) => {
      const answer = draft[prompt.id];
      if (typeof answer === "string") answers[prompt.id] = answer;
      return answers;
    }, {});
  } catch {
    return {};
  }
}

function hasAnyAnswer(answers: Answers) {
  return Object.values(answers).some((answer) => answer.trim());
}

export function PictureDescriptionTrainer({ storageOwnerId }: PictureDescriptionTrainerProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [loadedStorageKey, setLoadedStorageKey] = useState<string | null>(null);
  const currentCard = pictureDescriptionCards[currentCardIndex] ?? pictureDescriptionCards[0];
  const storageKey = useMemo(() => draftStorageKey(storageOwnerId, currentCard.id), [currentCard.id, storageOwnerId]);
  const completedCount = currentCard.prompts.filter((prompt) => answers[prompt.id]?.trim()).length;
  const canMoveCards = pictureDescriptionCards.length > 1;

  useEffect(() => {
    setAnswers(readDraftAnswers(storageKey, currentCard.prompts));
    setShowModelAnswer(false);
    setLoadedStorageKey(storageKey);
  }, [currentCard.prompts, storageKey]);

  useEffect(() => {
    if (loadedStorageKey !== storageKey) return;
    if (hasAnyAnswer(answers)) {
      window.localStorage.setItem(storageKey, JSON.stringify(answers));
      return;
    }
    window.localStorage.removeItem(storageKey);
  }, [answers, loadedStorageKey, storageKey]);

  function updateAnswer(promptId: string, value: string) {
    setAnswers((current) => ({ ...current, [promptId]: value }));
  }

  function resetAnswers() {
    setAnswers({});
    setShowModelAnswer(false);
  }

  function moveCard(direction: -1 | 1) {
    setCurrentCardIndex((index) => (index + direction + pictureDescriptionCards.length) % pictureDescriptionCards.length);
  }

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="text-sm font-black text-teal-700">사진 묘사</p>
        <div className="flex items-end justify-between gap-3">
          <h1 className="text-3xl font-black leading-tight text-ink">사진 묘사 훈련</h1>
          <p className="shrink-0 rounded-full bg-teal-50 px-3 py-1 text-sm font-black text-teal-700">작성 {completedCount}/{currentCard.prompts.length}</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-bold text-slate-600">
          <p>{currentCard.title} · 사진 {currentCardIndex + 1}/{pictureDescriptionCards.length}</p>
          <p>{hasAnyAnswer(answers) ? "자동 임시저장됨" : "작성하면 자동 저장돼요"}</p>
        </div>
      </header>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm" aria-label="묘사할 사진">
        <Image
          src={currentCard.imageSrc}
          alt={currentCard.imageAlt}
          width={currentCard.imageWidth}
          height={currentCard.imageHeight}
          priority
          className="aspect-[4/5] w-full object-cover"
        />
      </section>

      {canMoveCards ? (
        <div className="grid grid-cols-2 gap-3">
          <button type="button" className="btn-ghost" onClick={() => moveCard(-1)}>이전 사진</button>
          <button type="button" className="btn-secondary" onClick={() => moveCard(1)}>다음 사진</button>
        </div>
      ) : null}

      <section className="space-y-3" aria-labelledby="picture-hints-title">
        <div className="flex items-center justify-between gap-3">
          <h2 id="picture-hints-title" className="text-lg font-black text-ink">힌트</h2>
          <button type="button" className="text-sm font-black text-teal-700" onClick={() => setShowModelAnswer((current) => !current)}>
            {showModelAnswer ? "모범답안 닫기" : "모범답안 보기"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {currentCard.hints.map((hint) => (
            <span key={hint} className="rounded-full bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200">{hint}</span>
          ))}
        </div>
      </section>

      <section className="space-y-3" aria-label="묘사 작성">
        {currentCard.prompts.map((prompt, index) => (
          <article key={prompt.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <label htmlFor={`picture-description-${prompt.id}`} className="label">
              {index + 1}. {prompt.label}
            </label>
            <textarea
              id={`picture-description-${prompt.id}`}
              value={answers[prompt.id] ?? ""}
              onChange={(event) => updateAnswer(prompt.id, event.target.value)}
              placeholder={prompt.starter}
              rows={3}
              className="input min-h-28 resize-none leading-7"
            />
            {showModelAnswer ? (
              <div className="mt-3 rounded-2xl bg-slate-50 p-3">
                <p className="text-xs font-black text-slate-500">모범답안</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{prompt.modelAnswer}</p>
              </div>
            ) : null}
          </article>
        ))}
      </section>

      {showModelAnswer ? (
        <section className="rounded-3xl border border-teal-100 bg-teal-50 p-5" aria-labelledby="useful-expressions-title">
          <h2 id="useful-expressions-title" className="text-lg font-black text-ink">표현 후보</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {currentCard.usefulExpressions.map((expression) => (
              <span key={expression} className="rounded-full bg-white px-3 py-2 text-sm font-black text-teal-800 shadow-sm ring-1 ring-teal-100">{expression}</span>
            ))}
          </div>
        </section>
      ) : null}

      <button type="button" className="btn-ghost w-full" onClick={resetAnswers}>
        다시 쓰기
      </button>
    </div>
  );
}
