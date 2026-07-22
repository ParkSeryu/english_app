export type WctLessonNote = {
  id: string;
  course: string;
  day: string;
  topic: string;
  takeaway: string;
  form: string;
};

export const wctLessons = [
  {
    id: "novice-day-31",
    course: "WCT",
    day: "Novice Day 31",
    topic: "It's + adjective + for + someone + to + verb",
    takeaway: "누가 어떤 행동을 하는 것이 쉽다, 어렵다, 중요하다처럼 평가할 때 쓰는 표현.",
    form: "It's + 형용사 + for + 사람/대상 + to + 동사원형"
  }
] satisfies WctLessonNote[];

export function getWctLessons() {
  return wctLessons;
}

export function getLatestWctLesson() {
  return wctLessons[0];
}
