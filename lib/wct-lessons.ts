export type WctLessonExample = {
  english: string;
  korean: string;
  breakdown: string;
};

export type WctLessonNote = {
  id: string;
  course: string;
  day: string;
  topic: string;
  takeaway: string;
  form: string;
  sentenceSteps: string[];
  examples: WctLessonExample[];
  commonMistakes: string[];
  reviewQuestions: string[];
};

export const wctLessons = [
  {
    id: "novice-day-31",
    course: "WCT",
    day: "Novice Day 31",
    topic: "It's + adjective + for + someone + to + verb",
    takeaway: "어떤 사람이 어떤 행동을 하는 것이 쉽다, 어렵다, 중요하다, 필요하다처럼 말하고 싶을 때 쓰는 문장틀.",
    form: "It is + 형용사 + for + 사람/대상 + to + 동사원형",
    sentenceSteps: [
      "It is로 문장을 시작한다.",
      "hard, easy, important 같은 평가 형용사를 고른다.",
      "for 뒤에 그 행동을 하는 사람이나 대상을 놓는다.",
      "to 뒤에 실제 행동을 동사원형으로 쓴다."
    ],
    examples: [
      {
        english: "It's hard for me to speak English.",
        korean: "내가 영어로 말하는 건 어려워.",
        breakdown: "hard = 어렵다, for me = 내가, to speak English = 영어로 말하는 것"
      },
      {
        english: "It's important for students to practice every day.",
        korean: "학생들이 매일 연습하는 것은 중요해.",
        breakdown: "important = 중요하다, for students = 학생들이, to practice every day = 매일 연습하는 것"
      },
      {
        english: "It's easy for beginners to make this mistake.",
        korean: "초보자들이 이런 실수를 하기 쉬워.",
        breakdown: "easy = 쉽다, for beginners = 초보자들이, to make this mistake = 이런 실수를 하는 것"
      }
    ],
    commonMistakes: [
      "for 뒤에 행동하는 사람을 빼먹으면 누가 하는 행동인지 흐려진다.",
      "to 뒤에는 동사원형을 써야 한다. to speaking처럼 쓰지 않는다.",
      "It's 뒤의 형용사는 행동을 평가하는 말이어야 자연스럽다."
    ],
    reviewQuestions: [
      "\"내가 영어로 말하는 건 어려워\"를 영어로 만들기",
      "\"학생들이 매일 연습하는 건 중요해\"를 영어로 만들기",
      "\"초보자들이 이런 실수를 하기 쉬워\"를 영어로 만들기"
    ]
  }
] satisfies WctLessonNote[];

export function getWctLessons() {
  return wctLessons;
}

export function getLatestWctLesson() {
  return wctLessons[0];
}
