# WCT Quiz CTA Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the small WCT quiz badge with a prominent full-width action button on standard and Premium Day detail pages.

**Architecture:** Keep the existing shared `WctQuizBadge` component and its `href` and `WctQuizSummary` interface. Change only its state-derived copy and visual presentation, then update its component and end-to-end assertions so both Day detail variants keep sharing one implementation.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Vitest, Testing Library, Playwright

## Global Constraints

- Keep the button in the existing position on each Day detail page.
- Keep the current quiz URL, generation, scoring, persistence, and retake behavior unchanged.
- Render nothing when a standard Day has no quiz summary.
- Use one shared component for standard and Premium Day details.
- Pending copy is `문제 풀기` with `<count>문제`.
- Completed copy is `다시 풀기` with `최근 <score>/<count>`.
- Add no dependency, abstraction, or unrelated UI change.

---

### Task 1: Convert the shared quiz badge into a full-width CTA

**Files:**
- Modify: `tests/components/wct-quiz-badge.test.tsx`
- Modify: `e2e/wct-day-review-quiz.spec.ts`
- Modify: `components/wct/WctQuizBadge.tsx`

**Interfaces:**
- Consumes: `WctQuizBadge({ href, summary }: { href: string; summary: WctQuizSummary })`
- Produces: The same component interface and link destination, with pending and completed CTA labels.

- [ ] **Step 1: Write the failing component assertions**

Replace the label assertions in `tests/components/wct-quiz-badge.test.tsx` with:

```tsx
const pendingLink = screen.getByRole("link", {
  name: "문제 풀기 5문제"
});
expect(pendingLink).toHaveAttribute("href", "/quiz");
expect(pendingLink).toHaveClass("flex", "w-full", "bg-teal-600");
expect(pendingLink).toHaveClass("focus-visible:ring-4");

// After rerendering with latestScore: 4
expect(screen.getByRole("link", {
  name: "다시 풀기 최근 4/5"
})).toBeVisible();
```

Update `e2e/wct-day-review-quiz.spec.ts` to locate the same action by its new accessible names:

```tsx
await page.getByRole("link", { name: "문제 풀기 5문제" }).click();

// After returning from a completed quiz:
const completedQuizName =
  `다시 풀기 최근 ${score.replaceAll(" ", "")}`;
await expect(page.getByRole("link", {
  name: completedQuizName
})).toBeVisible();
```

Apply the pending assertion to both standard and Premium flows, and the completed assertion to every post-quiz Day return.

- [ ] **Step 2: Run the component test and verify RED**

Run:

```bash
npm test -- tests/components/wct-quiz-badge.test.tsx
```

Expected: FAIL because the current link is named `복습 문제 5개` and does not have the full-width solid-button classes.

- [ ] **Step 3: Implement the minimal shared CTA**

Change `components/wct/WctQuizBadge.tsx` to derive an action and status separately:

```tsx
const actionLabel = summary.latestScore == null
  ? "문제 풀기"
  : "다시 풀기";
const statusLabel = summary.latestScore == null
  ? `${summary.questionCount}문제`
  : `최근 ${summary.latestScore}/${summary.questionCount}`;
```

Render the existing `Link` as a solid, full-width CTA:

```tsx
<Link
  href={href}
  className="flex w-full items-center justify-between rounded-2xl bg-teal-600 px-5 py-4 text-white shadow-sm transition hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-200"
>
  <span className="text-base font-black">{actionLabel}</span>
  <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-black">
    {statusLabel}
  </span>
</Link>
```

Do not rename the component or edit either Day page.

- [ ] **Step 4: Run the focused component test and verify GREEN**

Run:

```bash
npm test -- tests/components/wct-quiz-badge.test.tsx
```

Expected: PASS with both pending and completed CTA states.

- [ ] **Step 5: Run the focused WCT end-to-end flow**

Run:

```bash
npm run test:e2e -- e2e/wct-day-review-quiz.spec.ts
```

Expected: 3 tests pass, proving standard and Premium Day buttons navigate correctly, completed scores render, and cross-owner access remains blocked.

- [ ] **Step 6: Commit the behavior change**

```bash
git add components/wct/WctQuizBadge.tsx \
  tests/components/wct-quiz-badge.test.tsx \
  e2e/wct-day-review-quiz.spec.ts
git commit -m "feat: make WCT quiz entry a full-width button"
```

---

### Task 2: Run the runtime-facing verification gate

**Files:**
- Verify only: `components/wct/WctQuizBadge.tsx`
- Verify only: `app/lessons/books/[bookId]/days/[dayId]/page.tsx`
- Verify only: `app/lessons/premium/days/[dayId]/page.tsx`

**Interfaces:**
- Consumes: The full-width CTA from Task 1.
- Produces: Verification evidence for the standard and Premium Day detail routes.

- [ ] **Step 1: Run static and full regression checks**

Run:

```bash
npm run lint
npm run typecheck
npm test -- --maxWorkers=1
npm run build
```

Expected: every command exits 0; the test summary contains no new failures.

- [ ] **Step 2: Start or restart the externally bound development server**

Run:

```bash
npm run dev -- --hostname 0.0.0.0 --port 3101
```

Expected: Next.js reports a healthy task-owned server on port 3101, without stopping or replacing unrelated servers on ports 3000 or 3002, and with no `500`, missing chunk, or module errors.

- [ ] **Step 3: Verify the actual Day detail interactions**

Use the existing seeded Playwright flow to exercise:

```text
/lessons/books/<seeded-book-id>/days/<seeded-day-id>
/lessons/premium/days/day-1
```

For each route, verify that:

1. The full-width solid button is visible.
2. The pending button reads `문제 풀기 5문제`.
3. Clicking it opens the matching `/quiz` route.
4. Completing the quiz and returning changes it to `다시 풀기 최근 <score>/5`.
5. No route or server action returns 500.

- [ ] **Step 4: Check the final diff and working tree**

Run:

```bash
git diff main...HEAD --check
git status --short
```

Expected: no whitespace errors and no unintended files beyond the approved design, plan, component, and tests.
