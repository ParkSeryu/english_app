import { EmptyState } from "@/components/EmptyState";
import { WctPremiumDayCard } from "@/components/wct/WctPremiumDayCard";
import { requireCurrentUser } from "@/lib/auth";
import { listWctPremiumLessons } from "@/lib/wct/premium-lessons";

export const dynamic = "force-dynamic";

export default async function WctPremiumPage() {
  await requireCurrentUser();
  const lessons = listWctPremiumLessons();

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-black uppercase tracking-[0.2em] text-teal-700">WCT</p>
        <h1 className="mt-2 text-3xl font-black text-ink">WCT Premium</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          대화로 완성한 Premium 수업을 Day 순서대로 읽어보세요.
        </p>
      </header>

      {lessons.length > 0 ? (
        <div className="space-y-3">
          {lessons.map((lesson) => (
            <WctPremiumDayCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="아직 Premium 수업이 없습니다"
          body="확정한 Premium Day가 생기면 여기에 표시됩니다."
        />
      )}
    </div>
  );
}
