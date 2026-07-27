# WCT Premium Day 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the WCT Premium placeholder into a private read-only lesson path and publish the approved `Day 1 — 관계대명사 기초` content on both local `dev` and `main`.

**Architecture:** Keep Premium content as typed, version-controlled TypeScript data under `lib/wct` and render it through Premium-specific cards and a read-only content component. Reuse the existing authenticated lesson route styling without extending the scanned-book database, import API, source kinds, or Supabase schema. Implement and verify from a feature branch based on `dev`, fast-forward `dev`, then fast-forward the explicitly authorized `main` branch after confirming the exact commit range.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5.9, Tailwind CSS, Vitest and Testing Library, Playwright.

## Global Constraints

- The exact approved content is recorded in `docs/superpowers/specs/2026-07-27-wct-premium-day-1-design.md`.
- Premium content must not use scans, OCR, the WCT import API, Supabase tables, or `WCT_SOURCE_KINDS`.
- Keep existing WCT textbook cards, owner-only reads, Day routes, source badges, and import behavior unchanged.
- Do not add editing, quizzes, memorization, progress, payment, subscription, or authorization tiers.
- Every Premium page must call `requireCurrentUser()` and remain read-only.
- Unknown Premium Day IDs must call `notFound()`.
- Do not add dependencies or database migrations.
- Implementation starts in an isolated `codex/wct-premium-day-1` worktree based on `dev`.
- Integration order is feature branch → `dev` → `main`; do not push or deploy unless the user separately asks.
- Before merging, state the source branch/worktree and the target branch. The user explicitly authorized both `dev` and `main`.
- Runtime verification must bind each server to `0.0.0.0` and cover the exact Premium list and Day 1 paths.
- Dev uses Supabase ref `uixpyibcpleuwsgemdno`; main uses production ref `ccawzrrkxuirrwvaecvw`. This feature performs no database writes or migrations.

## File Map

- Create `lib/wct/premium-lessons.ts`: Premium-only types, approved Day 1 data, list/get functions.
- Create `tests/wct-premium-lessons.test.ts`: exact static-content and lookup contract tests.
- Create `components/wct/WctPremiumCard.tsx`: `/lessons` entry link.
- Delete `components/wct/WctPremiumPlaceholderCard.tsx`: obsolete non-interactive placeholder.
- Create `components/wct/WctPremiumDayCard.tsx`: Premium Day list link.
- Create `components/wct/WctPremiumDayContent.tsx`: safe renderer for paragraphs, subheadings, examples, rules, and lists.
- Modify `app/lessons/page.tsx`: render the interactive Premium card.
- Create `app/lessons/premium/page.tsx`: authenticated Premium Day list.
- Create `app/lessons/premium/days/[dayId]/page.tsx`: authenticated Premium Day reader and 404 boundary.
- Modify `tests/components/wct-library.test.tsx`: Premium card, Day card, and approved-content rendering coverage.
- Modify `e2e/wct-course-library.spec.ts`: real Premium navigation, content, read-only, and missing-Day checks.

---

### Task 1: Add the typed Premium Day 1 content

**Files:**
- Create: `lib/wct/premium-lessons.ts`
- Create: `tests/wct-premium-lessons.test.ts`

**Interfaces:**
- Produces: `WctPremiumContentBlock`, `WctPremiumSection`, `WctPremiumLesson`.
- Produces: `listWctPremiumLessons(): readonly WctPremiumLesson[]`.
- Produces: `getWctPremiumLesson(id: string): WctPremiumLesson | null`.
- Depends on: no database, store, route, or source-kind code.

- [ ] **Step 1: Write the failing content contract test**

Create `tests/wct-premium-lessons.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  getWctPremiumLesson,
  listWctPremiumLessons
} from "@/lib/wct/premium-lessons";

describe("WCT Premium lessons", () => {
  it("exposes the approved relative-pronoun Day 1 content", () => {
    const lessons = listWctPremiumLessons();
    expect(lessons).toHaveLength(1);

    const lesson = getWctPremiumLesson("day-1");
    expect(lesson).toMatchObject({
      id: "day-1",
      dayNumber: 1,
      displayLabel: "Day 1",
      title: "관계대명사 기초 — 두 문장을 하나로 합치기"
    });

    const serialized = JSON.stringify(lesson);
    expect(serialized).toContain("I know the person who came to WCT.");
    expect(serialized).toContain("관계대명사 뒤에 바로 동사가 나오면 → 생략 불가");
    expect(serialized).toContain("관계대명사 뒤에 별도의 주어 + 동사가 나오면 → 생략 가능");
    expect(serialized).toContain("what = the thing that");
    expect(serialized).not.toContain("ai_supplement");
    expect(serialized).not.toContain("\"book\"");
  });

  it("returns null for an unknown Premium Day", () => {
    expect(getWctPremiumLesson("missing-day")).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test and verify the missing module failure**

Run:

```bash
npm test -- tests/wct-premium-lessons.test.ts
```

Expected: FAIL because `@/lib/wct/premium-lessons` does not exist.

- [ ] **Step 3: Implement the Premium types, exact content, and lookup functions**

Create `lib/wct/premium-lessons.ts`:

```ts
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
```

- [ ] **Step 4: Run the focused test**

Run:

```bash
npm test -- tests/wct-premium-lessons.test.ts
```

Expected: PASS with two tests.

- [ ] **Step 5: Commit the Premium content contract**

```bash
git add lib/wct/premium-lessons.ts tests/wct-premium-lessons.test.ts
git commit -m "feat: add WCT Premium Day 1 content"
```

---

### Task 2: Build the Premium entry, Day list, and read-only lesson page

**Files:**
- Create: `components/wct/WctPremiumCard.tsx`
- Delete: `components/wct/WctPremiumPlaceholderCard.tsx`
- Create: `components/wct/WctPremiumDayCard.tsx`
- Create: `components/wct/WctPremiumDayContent.tsx`
- Modify: `app/lessons/page.tsx`
- Create: `app/lessons/premium/page.tsx`
- Create: `app/lessons/premium/days/[dayId]/page.tsx`
- Modify: `tests/components/wct-library.test.tsx`

**Interfaces:**
- Consumes: `WctPremiumLesson`, `listWctPremiumLessons()`, and `getWctPremiumLesson(id)`.
- Produces: `WctPremiumCard()`, `WctPremiumDayCard({ lesson })`, and `WctPremiumDayContent({ lesson })`.
- Produces routes: `/lessons/premium` and `/lessons/premium/days/[dayId]`.

- [ ] **Step 1: Replace the placeholder test and add failing Premium UI tests**

In `tests/components/wct-library.test.tsx`, replace the placeholder import with:

```ts
import { WctPremiumCard } from "@/components/wct/WctPremiumCard";
import { WctPremiumDayCard } from "@/components/wct/WctPremiumDayCard";
import { WctPremiumDayContent } from "@/components/wct/WctPremiumDayContent";
import { getWctPremiumLesson } from "@/lib/wct/premium-lessons";
```

Replace the old non-interactive placeholder test and add the following tests:

```tsx
it("links WCT Premium from the lesson shelf", () => {
  render(<WctPremiumCard />);

  const link = screen.getByRole("link", { name: "WCT Premium" });
  expect(link).toHaveAttribute("href", "/lessons/premium");
  expect(within(link).getByText("Day 1")).toBeVisible();
  expect(screen.queryByText("준비 중")).not.toBeInTheDocument();
});

it("links the approved Premium Day 1", () => {
  const lesson = getWctPremiumLesson("day-1");
  if (!lesson) throw new Error("Expected Premium Day 1 fixture");

  render(<WctPremiumDayCard lesson={lesson} />);

  expect(screen.getByRole("link", {
    name: /Day 1.*관계대명사 기초/
  })).toHaveAttribute("href", "/lessons/premium/days/day-1");
});

it("renders the approved Premium lesson without edit controls or source badges", () => {
  const lesson = getWctPremiumLesson("day-1");
  if (!lesson) throw new Error("Expected Premium Day 1 fixture");

  render(<WctPremiumDayContent lesson={lesson} />);

  expect(screen.getByText("핵심 내용")).toBeVisible();
  expect(screen.getByText("주격과 목적격")).toBeVisible();
  expect(screen.getByText("생략 규칙")).toBeVisible();
  expect(screen.getByText("what과의 차이")).toBeVisible();
  expect(screen.getByText("핵심 패턴")).toBeVisible();
  expect(screen.getAllByText("→ I know the person who came to WCT.").length).toBeGreaterThan(0);
  expect(screen.getByText("what = the thing that")).toBeVisible();
  expect(screen.queryByText("AI 보완")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /추가|수정|삭제|저장/ })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the component test and verify the missing component failures**

Run:

```bash
npm test -- tests/components/wct-library.test.tsx
```

Expected: FAIL because the three Premium components do not exist.

- [ ] **Step 3: Replace the placeholder with the Premium entry link**

Delete `components/wct/WctPremiumPlaceholderCard.tsx`.

Create `components/wct/WctPremiumCard.tsx`:

```tsx
import Link from "next/link";

export function WctPremiumCard() {
  return (
    <Link
      href="/lessons/premium"
      aria-label="WCT Premium"
      className="block rounded-3xl border border-violet-200 bg-violet-50 p-5 shadow-sm transition hover:border-violet-300 hover:shadow-card"
    >
      <p className="text-xl font-black text-ink">WCT Premium</p>
      <p className="mt-4 text-sm font-bold text-violet-700">Day 1</p>
    </Link>
  );
}
```

In `app/lessons/page.tsx`, replace:

```tsx
import { WctPremiumPlaceholderCard } from "@/components/wct/WctPremiumPlaceholderCard";
```

with:

```tsx
import { WctPremiumCard } from "@/components/wct/WctPremiumCard";
```

Replace `<WctPremiumPlaceholderCard />` with:

```tsx
<WctPremiumCard />
```

- [ ] **Step 4: Create the Premium Day card**

Create `components/wct/WctPremiumDayCard.tsx`:

```tsx
import Link from "next/link";

import type { WctPremiumLesson } from "@/lib/wct/premium-lessons";

export function WctPremiumDayCard({ lesson }: { lesson: WctPremiumLesson }) {
  return (
    <Link
      href={`/lessons/premium/days/${lesson.id}`}
      className="block rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-violet-300 hover:shadow-card"
    >
      <h2 className="text-lg font-black text-ink">{lesson.displayLabel}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{lesson.title}</p>
    </Link>
  );
}
```

- [ ] **Step 5: Create the safe read-only Premium content renderer**

Create `components/wct/WctPremiumDayContent.tsx`:

```tsx
import type {
  WctPremiumContentBlock,
  WctPremiumLesson
} from "@/lib/wct/premium-lessons";

function PremiumBlock({ block }: { block: WctPremiumContentBlock }) {
  switch (block.kind) {
    case "paragraph":
      return <p className="text-sm leading-7 text-slate-700">{block.text}</p>;
    case "subheading":
      return <h3 className="pt-2 text-base font-black text-ink">{block.text}</h3>;
    case "example":
      return (
        <div className="space-y-1 rounded-2xl bg-slate-900 p-4 font-mono text-sm leading-6 text-white">
          {block.lines.map((line) => <p key={line}>{line}</p>)}
        </div>
      );
    case "rule":
      return (
        <div className="space-y-2 rounded-2xl bg-violet-50 p-4 text-sm font-bold leading-6 text-violet-900">
          {block.lines.map((line) => <p key={line}>{line}</p>)}
        </div>
      );
    case "list":
      return (
        <ul className="space-y-2">
          {block.items.map((item) => (
            <li key={item} className="rounded-2xl bg-slate-100 p-4 text-sm leading-6 text-slate-700">
              {item}
            </li>
          ))}
        </ul>
      );
  }
}

export function WctPremiumDayContent({ lesson }: { lesson: WctPremiumLesson }) {
  return (
    <div className="space-y-7">
      {lesson.sections.map((section) => (
        <section key={section.id} className="space-y-3">
          <h2 className="text-xl font-black text-ink">{section.title}</h2>
          {section.blocks.map((block) => <PremiumBlock key={block.id} block={block} />)}
        </section>
      ))}

      <section className="space-y-3">
        <h2 className="text-xl font-black text-ink">핵심 패턴</h2>
        <div className="space-y-2 rounded-2xl border border-violet-200 bg-violet-50 p-4">
          {lesson.patterns.map((pattern) => (
            <p key={pattern} className="text-sm font-bold leading-6 text-violet-900">{pattern}</p>
          ))}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 6: Add the authenticated Premium list page**

Create `app/lessons/premium/page.tsx`:

```tsx
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
        <p className="text-sm font-black uppercase tracking-[0.2em] text-violet-700">WCT</p>
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
```

- [ ] **Step 7: Add the authenticated Premium Day page and 404 boundary**

Create `app/lessons/premium/days/[dayId]/page.tsx`:

```tsx
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
```

- [ ] **Step 8: Run focused data and component tests**

Run:

```bash
npm test -- tests/wct-premium-lessons.test.ts tests/components/wct-library.test.tsx
```

Expected: PASS, including all pre-existing WCT component tests.

- [ ] **Step 9: Commit the Premium UI and routes**

```bash
git add app/lessons/page.tsx app/lessons/premium components/wct/WctPremiumCard.tsx components/wct/WctPremiumDayCard.tsx components/wct/WctPremiumDayContent.tsx components/wct/WctPremiumPlaceholderCard.tsx tests/components/wct-library.test.tsx
git commit -m "feat: open WCT Premium Day lessons"
```

---

### Task 3: Cover the complete Premium browser flow

**Files:**
- Modify: `e2e/wct-course-library.spec.ts`

**Interfaces:**
- Consumes: `/lessons`, `/lessons/premium`, `/lessons/premium/days/day-1`.
- Verifies: authenticated navigation, approved copy, read-only behavior, 404 handling, and existing WCT regression behavior.

- [ ] **Step 1: Update the existing shelf assertion**

In `reads WCT by book and Day without Topic or edit controls`, replace the placeholder assertions with:

```ts
const premium = page.getByRole("link", { name: "WCT Premium" });
await expect(premium).toBeVisible();
await expect(premium).toHaveAttribute("href", "/lessons/premium");
await expect(page.getByText("준비 중")).toHaveCount(0);
```

- [ ] **Step 2: Add the Premium Day 1 navigation and content test**

Add:

```ts
test("reads the approved WCT Premium Day 1 lesson", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "수업" }).click();
  await page.getByRole("link", { name: "WCT Premium" }).click();

  await expect(page).toHaveURL("/lessons/premium");
  await expect(page.getByRole("heading", { name: "WCT Premium" })).toBeVisible();

  await page.getByRole("link", {
    name: /Day 1.*관계대명사 기초/
  }).click();

  await expect(page).toHaveURL("/lessons/premium/days/day-1");
  await expect(page.getByRole("heading", { name: "Day 1" })).toBeVisible();
  await expect(page.getByText("주격과 목적격")).toBeVisible();
  await expect(page.getByText("관계대명사 뒤에 바로 동사가 나오면 → 생략 불가")).toBeVisible();
  await expect(page.getByText("관계대명사 뒤에 별도의 주어 + 동사가 나오면 → 생략 가능")).toBeVisible();
  await expect(page.getByText("what = the thing that")).toBeVisible();
  await expect(page.getByRole("button", { name: /추가|수정|삭제|저장/ })).toHaveCount(0);
  await expect(page.getByText("AI 보완")).toHaveCount(0);
});
```

- [ ] **Step 3: Add the missing Premium Day test**

Add:

```ts
test("returns 404 for an unknown WCT Premium Day", async ({ page }) => {
  await page.goto("/lessons/premium/days/missing-day");
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
});
```

- [ ] **Step 4: Run the focused Playwright file**

Run:

```bash
npm run test:e2e -- e2e/wct-course-library.spec.ts
```

Expected: all WCT library tests PASS on the isolated Playwright server at `127.0.0.1:3100`.

- [ ] **Step 5: Commit the browser coverage**

```bash
git add e2e/wct-course-library.spec.ts
git commit -m "test: cover WCT Premium reading flow"
```

---

### Task 4: Run the complete feature verification gate

**Files:**
- No source changes expected.
- Inspect: feature worktree server output and generated test reports.

**Interfaces:**
- Proves: lint, types, focused tests, all tests, production build, browser flow, and exact route behavior before integration.

- [ ] **Step 1: Run static checks**

```bash
npm run lint
npm run typecheck
```

Expected: both exit 0 with no warnings or type errors.

- [ ] **Step 2: Run focused and full tests**

```bash
npm test -- tests/wct-premium-lessons.test.ts tests/components/wct-library.test.tsx
npm test
```

Expected: focused tests and the full Vitest suite PASS.

- [ ] **Step 3: Run the production build**

```bash
npm run build
```

Expected: build exits 0 and includes `/lessons/premium` plus `/lessons/premium/days/[dayId]`.

- [ ] **Step 4: Run the exact browser flow after the build**

```bash
npm run test:e2e -- e2e/wct-course-library.spec.ts
```

Expected: all WCT Playwright tests PASS after the build.

- [ ] **Step 5: Check the feature branch diff**

```bash
git status --short
git diff --check dev...HEAD
git diff --stat dev...HEAD
```

Expected: clean worktree, no whitespace errors, and only the files listed in this plan.

---

### Task 5: Integrate and live-verify `dev`

**Files:**
- Integration target: `/home/ubuntu/code/english_app_dev` on branch `dev`.
- Runtime log: `/tmp/english_app-dev-3002-premium.log`.

**Interfaces:**
- Consumes: verified `codex/wct-premium-day-1`.
- Produces: local `dev` containing the Premium feature and a healthy server on `0.0.0.0:3002`.

- [ ] **Step 1: State and verify the merge boundary**

Report before merging:

```text
Source: codex/wct-premium-day-1 in its isolated worktree
Target: dev at /home/ubuntu/code/english_app_dev
```

Run:

```bash
git -C /home/ubuntu/code/english_app_dev status --short --branch
git -C /home/ubuntu/code/english_app_dev log -1 --oneline
```

Expected: `dev` is clean and still contains the approved design and plan commits.

- [ ] **Step 2: Fast-forward the verified feature branch into dev**

```bash
git -C /home/ubuntu/code/english_app_dev merge --ff-only codex/wct-premium-day-1
```

Expected: fast-forward succeeds without a merge commit.

- [ ] **Step 3: Confirm the dev environment boundary**

Read only the Supabase URL host from `.env.local` and confirm project ref:

```text
uixpyibcpleuwsgemdno
```

Do not run migrations or data writes.

- [ ] **Step 4: Restart the exact dev server safely**

Resolve the PID listening on port `3002`, verify its working directory, and terminate only the verified process:

```bash
dev_server_pid="$(fuser -n tcp 3002 2>/dev/null | awk '{print $1}')"
test -n "$dev_server_pid"
test "$(readlink -f "/proc/$dev_server_pid/cwd")" = "/home/ubuntu/code/english_app_dev"
kill "$dev_server_pid"
cd /home/ubuntu/code/english_app_dev
nohup npm run dev -- --hostname 0.0.0.0 --port 3002 > /tmp/english_app-dev-3002-premium.log 2>&1 &
```

Wait until the log contains `Ready`.

- [ ] **Step 5: Verify dev local and WSL-IP access**

```bash
curl -I http://127.0.0.1:3002/lessons
curl -I http://127.0.0.1:3002/lessons/premium
curl -I http://127.0.0.1:3002/lessons/premium/days/day-1
```

Repeat the three checks against the first reachable address from `hostname -I`.

Expected: authenticated routes return the existing auth redirect without a cookie, not 500; the Playwright test from Task 4 proves the signed-in content flow.

- [ ] **Step 6: Inspect dev server health**

```bash
rg -n "InternalServerError|Cannot find module|500|missing chunk|schema error|failed server action" /tmp/english_app-dev-3002-premium.log
```

Expected: no matches.

---

### Task 6: Fast-forward and independently verify `main`

**Files:**
- Integration target: `/home/ubuntu/code/english_app` on branch `main`.
- Runtime log: `/tmp/english_app-main-3000-premium.log`.

**Interfaces:**
- Consumes: locally verified `dev`.
- Produces: local `main` with the exact same Premium feature and a healthy server on `0.0.0.0:3000`.

- [ ] **Step 1: State and verify the main merge boundary**

Report before merging:

```text
Source: dev at /home/ubuntu/code/english_app_dev
Target: main at /home/ubuntu/code/english_app
```

Run:

```bash
git -C /home/ubuntu/code/english_app status --short --branch
git -C /home/ubuntu/code/english_app log --oneline main..dev
```

Expected: `main` is clean. The range contains only:

- `d61d95e feat: center class tab in bottom navigation`
- `a5e35e7 feat: add WCT Premium placeholder`
- `fbdeebd docs: design WCT Premium Day 1`
- `docs: plan WCT Premium Day 1 implementation`
- `feat: add WCT Premium Day 1 content`
- `feat: open WCT Premium Day lessons`
- `test: cover WCT Premium reading flow`

Stop if any unrelated commit appears or `main` is not an ancestor of `dev`.

- [ ] **Step 2: Fast-forward dev into the explicitly authorized main**

```bash
git -C /home/ubuntu/code/english_app merge --ff-only dev
```

Expected: fast-forward succeeds. `git log --oneline main..dev` becomes empty.

- [ ] **Step 3: Confirm the production environment boundary**

Read only the Supabase URL host from `.env.main.local` and confirm project ref:

```text
ccawzrrkxuirrwvaecvw
```

Do not run migrations or data writes.

- [ ] **Step 4: Re-run the main branch verification**

From `/home/ubuntu/code/english_app` run:

```bash
npm run lint
npm run typecheck
npm test -- tests/wct-premium-lessons.test.ts tests/components/wct-library.test.tsx
npm run build
npm run test:e2e -- e2e/wct-course-library.spec.ts
```

Expected: every command exits 0.

- [ ] **Step 5: Restart the exact main server safely**

Resolve the PID listening on port `3000`, verify its working directory, terminate only the verified process, load `.env.main.local`, and start the main server:

```bash
main_server_pid="$(fuser -n tcp 3000 2>/dev/null | awk '{print $1}')"
test -n "$main_server_pid"
test "$(readlink -f "/proc/$main_server_pid/cwd")" = "/home/ubuntu/code/english_app"
kill "$main_server_pid"
cd /home/ubuntu/code/english_app
set -a
source .env.main.local
set +a
nohup npm run dev -- --hostname 0.0.0.0 --port 3000 > /tmp/english_app-main-3000-premium.log 2>&1 &
```

Wait until the log contains `Ready`.

- [ ] **Step 6: Verify main local and WSL-IP access**

```bash
curl -I http://127.0.0.1:3000/lessons
curl -I http://127.0.0.1:3000/lessons/premium
curl -I http://127.0.0.1:3000/lessons/premium/days/day-1
```

Repeat the three checks against the first reachable address from `hostname -I`.

Expected: authenticated routes return the existing auth redirect without a cookie, not 500.

- [ ] **Step 7: Inspect main server health and final branch state**

```bash
rg -n "InternalServerError|Cannot find module|500|missing chunk|schema error|failed server action" /tmp/english_app-main-3000-premium.log
git -C /home/ubuntu/code/english_app_dev status --short --branch
git -C /home/ubuntu/code/english_app status --short --branch
git -C /home/ubuntu/code/english_app log --oneline main..dev
```

Expected: no server-error matches, both worktrees are clean, and `main..dev` is empty.

---

## Final Report Requirements

- State that the affected surface is runtime-facing UI, navigation, and routes.
- List every created, modified, and deleted file.
- Report exact lint, typecheck, focused/full test, build, and Playwright results.
- Report the exact verified dev and main URLs for local and WSL-IP access.
- Report both environment refs and confirm no schema migration or data write occurred.
- Report the final `dev` and `main` commit IDs and whether they are equal.
- State that no push or deployment occurred unless separately authorized.
