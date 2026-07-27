import { notFound } from "next/navigation";

import { WctPremiumDayContent } from "@/components/wct/WctPremiumDayContent";
import { requireCurrentUser } from "@/lib/auth";
import { getWctPremiumLesson } from "@/lib/wct/premium-lessons";

export const dynamic = "force-dynamic";

export default async function WctPremiumDayPage({
  params
}: {
  params: Promise<{ dayId: string }>;
}) {
  await requireCurrentUser();
  const { dayId } = await params;
  const lesson = getWctPremiumLesson(dayId);
  if (!lesson) notFound();

  return (
    <div className="space-y-7">
      <header>
        <p className="text-sm font-black uppercase tracking-[0.2em] text-violet-700">
          WCT Premium
        </p>
        <h1 className="mt-2 text-3xl font-black text-ink">{lesson.displayLabel}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{lesson.title}</p>
      </header>
      <WctPremiumDayContent lesson={lesson} />
    </div>
  );
}
