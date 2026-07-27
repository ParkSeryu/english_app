export type WctPremiumContentBlock =
  | { id: string; kind: "paragraph"; text: string }
  | { id: string; kind: "subheading"; text: string }
  | { id: string; kind: "example"; lines: readonly string[] }
  | { id: string; kind: "rule"; lines: readonly string[] }
  | { id: string; kind: "list"; items: readonly string[] };

export type WctPremiumSection = {
  id: string;
  title: string;
  blocks: readonly WctPremiumContentBlock[];
};

export type WctPremiumLesson = {
  id: string;
  dayNumber: number;
  displayLabel: string;
  title: string;
  sections: readonly WctPremiumSection[];
  patterns: readonly string[];
};

const WCT_PREMIUM_LESSONS = [
  {
    id: "day-1",
    dayNumber: 1,
    displayLabel: "Day 1",
    title: "관계대명사 기초 — 두 문장을 하나로 합치기",
    sections: [
      {
        id: "core",
        title: "핵심 내용",
        blocks: [
          {
            id: "core-intro",
            kind: "paragraph",
            text: "관계대명사는 두 문장에 반복되는 명사를 대신하면서, 앞의 명사를 뒤에서 설명해 준다."
          },
          {
            id: "core-merge",
            kind: "example",
            lines: [
              "I know the person.",
              "The person came to WCT.",
              "→ I know the person who came to WCT."
            ]
          },
          {
            id: "core-noun-chunk",
            kind: "paragraph",
            text: "the person who came to WCT 전체는 명사 덩어리이고, who came to WCT가 the person을 설명한다."
          },
          {
            id: "core-fragment",
            kind: "paragraph",
            text: "someone who came to WCT도 ‘WCT에 왔던 사람’이라는 명사 덩어리이며, 이것만으로는 완성된 문장이 아니다."
          }
        ]
      },
      {
        id: "case",
        title: "주격과 목적격",
        blocks: [
          {
            id: "case-intro",
            kind: "paragraph",
            text: "관계대명사는 앞의 명사를 대신하면서 뒤의 설명 안에서 주어 또는 목적어 역할을 한다."
          },
          {
            id: "case-subject-heading",
            kind: "subheading",
            text: "관계대명사가 행동의 주인공이면 주격"
          },
          {
            id: "case-subject-example",
            kind: "example",
            lines: [
              "I know the person.",
              "The person came to WCT.",
              "→ I know the person who came to WCT."
            ]
          },
          {
            id: "case-subject-explanation",
            kind: "paragraph",
            text: "the person이 came의 주어이므로 이를 대신한 who도 주어 역할을 한다. who를 지우면 came의 주어가 없어지므로 생략할 수 없다."
          },
          {
            id: "case-object-heading",
            kind: "subheading",
            text: "다른 주어가 행동하고 관계대명사가 그 대상이면 목적격"
          },
          {
            id: "case-object-example",
            kind: "example",
            lines: [
              "I know the person.",
              "I like the person.",
              "→ I know the person (who/that) I like."
            ]
          },
          {
            id: "case-object-explanation",
            kind: "paragraph",
            text: "행동하는 주어는 I이고 the person은 좋아하는 대상이다. 이를 대신한 who/that은 목적어 역할을 하므로 생략할 수 있다."
          },
          {
            id: "case-object-omitted",
            kind: "example",
            lines: ["I know the person I like."]
          }
        ]
      },
      {
        id: "omission",
        title: "생략 규칙",
        blocks: [
          {
            id: "omission-rule",
            kind: "rule",
            lines: [
              "관계대명사 뒤에 바로 동사가 나오면 → 생략 불가",
              "관계대명사 뒤에 별도의 주어 + 동사가 나오면 → 생략 가능"
            ]
          },
          {
            id: "omission-examples",
            kind: "list",
            items: [
              "someone who came to WCT → 생략 불가",
              "the book that is on the table → 생략 불가",
              "the person (who/that) I like → 생략 가능",
              "the place (which/that) I go to → 생략 가능"
            ]
          },
          {
            id: "omission-summary",
            kind: "paragraph",
            text: "정리하면 관계대명사가 행동의 주인공이면 주격, 다른 주어가 관계대명사를 대상으로 행동하면 목적격이라고 부른다."
          }
        ]
      },
      {
        id: "what",
        title: "what과의 차이",
        blocks: [
          {
            id: "what-antecedent",
            kind: "paragraph",
            text: "일반 관계대명사 앞에는 설명받는 명사, 즉 선행사가 있다."
          },
          {
            id: "what-regular-examples",
            kind: "example",
            lines: [
              "the person who came",
              "the place that I go to"
            ]
          },
          {
            id: "what-includes-antecedent",
            kind: "paragraph",
            text: "반면 what은 선행사를 자체적으로 포함한다."
          },
          {
            id: "what-equation",
            kind: "rule",
            lines: ["what = the thing that"]
          },
          {
            id: "what-examples",
            kind: "list",
            items: [
              "What I need is time.",
              "I know what you mean."
            ]
          },
          {
            id: "what-summary",
            kind: "paragraph",
            text: "따라서 what I need는 문장에서 명사 역할을 하는 명사절이다. what에는 위의 관계대명사 생략 규칙을 적용하지 않는다."
          }
        ]
      }
    ],
    patterns: [
      "선행사 + who / which / that + 설명",
      "관계대명사 + 동사 → 주격 → 생략 불가",
      "관계대명사 + 별도의 주어 + 동사 → 목적격 → 생략 가능"
    ]
  }
] as const satisfies readonly WctPremiumLesson[];

export function listWctPremiumLessons(): readonly WctPremiumLesson[] {
  return WCT_PREMIUM_LESSONS;
}

export function getWctPremiumLesson(id: string): WctPremiumLesson | null {
  return WCT_PREMIUM_LESSONS.find((lesson) => lesson.id === id) ?? null;
}
