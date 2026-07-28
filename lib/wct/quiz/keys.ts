import { normalizeWctIdentity } from "../normalization.ts";

function lessonKeyIdentity(value: string) {
  return normalizeWctIdentity(value)
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function standardWctLessonKey(bookTitle: string, dayNumber: number) {
  return `wct-book:${lessonKeyIdentity(bookTitle)}:day:${dayNumber}`;
}

export function premiumWctLessonKey(dayId: string) {
  return `wct-premium:${lessonKeyIdentity(dayId)}`;
}
