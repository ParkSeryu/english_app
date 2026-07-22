import type { Metadata } from "next";

import { requireCurrentUser } from "@/lib/auth";
import { getLatestWctLesson } from "@/lib/wct-lessons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "WCT 수업 정리 | 영어공부"
};

export default async function WctLessonNotesPage() {
  await requireCurrentUser();

  const lesson = getLatestWctLesson();

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-200 pb-5">
        <p className="text-sm font-black text-teal-700">{lesson.course}</p>
        <h1 className="mt-2 text-3xl font-black text-ink">{lesson.day}</h1>
        <p className="mt-3 text-base leading-7 text-slate-700">{lesson.topic}</p>
      </header>

      <article id={lesson.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <section className="border-b border-slate-200 p-5 sm:p-6">
          <SectionLabel>오늘 배운 핵심</SectionLabel>
          <p className="mt-3 text-xl font-black leading-8 text-ink">{lesson.takeaway}</p>
        </section>

        <section className="border-b border-slate-200 p-5 sm:p-6">
          <SectionLabel>문장틀</SectionLabel>
          <p className="mt-3 rounded-2xl bg-slate-50 p-4 text-lg font-black leading-8 text-ink">{lesson.form}</p>
        </section>

        <section className="border-b border-slate-200 p-5 sm:p-6">
          <SectionLabel>문장 만드는 순서</SectionLabel>
          <ol className="mt-4 space-y-3">
            {lesson.sentenceSteps.map((step, index) => (
              <li key={step} className="flex gap-3 text-base leading-7 text-slate-700">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-black text-white">{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-b border-slate-200 p-5 sm:p-6">
          <SectionLabel>예문 해부</SectionLabel>
          <div className="mt-4 divide-y divide-slate-200">
            {lesson.examples.map((example) => (
              <div key={example.english} className="py-4 first:pt-0 last:pb-0">
                <p className="text-xl font-black leading-8 text-ink">{example.english}</p>
                <p className="mt-2 text-base leading-7 text-slate-700">{example.korean}</p>
                <p className="mt-3 text-sm leading-6 text-teal-800">{example.breakdown}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-b border-slate-200 p-5 sm:p-6">
          <SectionLabel>헷갈리는 점</SectionLabel>
          <ul className="mt-4 space-y-3">
            {lesson.commonMistakes.map((mistake) => (
              <li key={mistake} className="border-l-4 border-amber-300 pl-4 text-base leading-7 text-slate-700">{mistake}</li>
            ))}
          </ul>
        </section>

        <section className="p-5 sm:p-6">
          <SectionLabel>셀프 체크</SectionLabel>
          <ol className="mt-4 space-y-3">
            {lesson.reviewQuestions.map((question, index) => (
              <li key={question} className="flex gap-3 text-base leading-7 text-slate-700">
                <span className="font-black text-teal-700">{index + 1}</span>
                <span>{question}</span>
              </li>
            ))}
          </ol>
        </section>
      </article>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-black text-teal-700">{children}</h2>;
}
