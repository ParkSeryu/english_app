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
      </header>

      <article id={lesson.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <section className="border-b border-slate-200 p-5 sm:p-6">
          <SectionLabel>주제</SectionLabel>
          <p className="mt-3 text-xl font-black leading-8 text-ink">{lesson.topic}</p>
        </section>

        <section className="border-b border-slate-200 p-5 sm:p-6">
          <SectionLabel>핵심 내용</SectionLabel>
          <p className="mt-3 text-base leading-7 text-slate-700">{lesson.takeaway}</p>
        </section>

        <section className="p-5 sm:p-6">
          <SectionLabel>패턴</SectionLabel>
          <p className="mt-3 rounded-2xl bg-slate-50 p-4 text-lg font-black leading-8 text-ink">{lesson.form}</p>
        </section>
      </article>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-black text-teal-700">{children}</h2>;
}
