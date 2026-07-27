# Bottom Navigation and WCT Premium Placeholder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorder the bottom navigation to `표현 · 암기 · 수업 · 묘사 · 질문` and add a non-interactive `WCT Premium · 준비 중` item to the lessons screen.

**Architecture:** Keep navigation behavior in the existing `BottomNav` data array and change only its order and question label. Add one focused presentational component for the Premium placeholder, render it beside existing data-backed WCT book cards, and leave stores, routes, and database types untouched.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Vitest, Testing Library, Playwright

## Global Constraints

- The bottom navigation order must be exactly `표현`, `암기`, `수업`, `묘사`, `질문`.
- Existing navigation paths, active-state logic, and expression-topic restoration must remain unchanged.
- The Premium item must display only `WCT Premium` and `준비 중`.
- The Premium item must not be a link or button and must not have a detail route.
- Existing WCT book cards, empty-state copy, store behavior, APIs, and database schema must remain unchanged.
- No new dependency is allowed.

## File Structure

- Modify `components/BottomNav.tsx` to reorder the existing navigation data and shorten the question label.
- Modify `tests/components/bottom-nav.test.tsx` to assert the exact visible navigation order and existing hrefs.
- Create `components/wct/WctPremiumPlaceholderCard.tsx` as a presentational, non-interactive card.
- Modify `app/lessons/page.tsx` to render the Premium placeholder after existing WCT book cards while preserving the empty state.
- Modify `tests/components/wct-library.test.tsx` to verify the Premium card's copy and non-interactive semantics.
- Modify `e2e/wct-course-library.spec.ts` to verify the placeholder and reordered GNB on the running lessons flow.

---

### Task 1: Reorder and relabel the bottom navigation

**Files:**
- Modify: `tests/components/bottom-nav.test.tsx`
- Modify: `components/BottomNav.tsx`

**Interfaces:**
- Consumes: Existing `BottomNav()` component and its current route behavior.
- Produces: The exact visible link order `표현 · 암기 · 수업 · 묘사 · 질문`; existing hrefs remain `/expressions`, `/memorize`, `/lessons`, `/picture-description`, and `/questions`.

- [ ] **Step 1: Write the failing navigation-order test**

In `tests/components/bottom-nav.test.tsx`, update the first test so its navigation assertions include the exact DOM order:

```tsx
const links = screen.getAllByRole("link");
expect(links.map((link) => link.textContent)).toEqual([
  "표현",
  "암기",
  "수업",
  "묘사",
  "질문"
]);

expect(screen.getByRole("link", { name: "표현" })).toHaveAttribute("aria-current", "page");
expect(screen.getByRole("link", { name: "암기" })).toHaveAttribute("href", "/memorize");
expect(screen.getByRole("link", { name: "수업" })).toHaveAttribute("href", "/lessons");
expect(screen.getByRole("link", { name: "묘사" })).toHaveAttribute("href", "/picture-description");
expect(screen.getByRole("link", { name: "질문" })).toHaveAttribute("href", "/questions");
expect(links).toHaveLength(5);
```

- [ ] **Step 2: Run the test and verify the requested order fails**

Run:

```bash
npm test -- tests/components/bottom-nav.test.tsx
```

Expected: FAIL because the current order is `표현 · 암기 · 질문거리 · 수업 · 묘사`.

- [ ] **Step 3: Apply the minimal navigation data change**

Replace only the `bottomNavItems` declaration in `components/BottomNav.tsx`:

```tsx
const bottomNavItems = [
  { href: "/expressions", label: "표현" },
  { href: "/memorize", label: "암기" },
  { href: "/lessons", label: "수업" },
  { href: "/picture-description", label: "묘사" },
  { href: "/questions", label: "질문" }
];
```

- [ ] **Step 4: Run the targeted test and verify it passes**

Run:

```bash
npm test -- tests/components/bottom-nav.test.tsx
```

Expected: PASS with all existing active-state and topic-restoration tests unchanged.

- [ ] **Step 5: Commit the navigation change**

```bash
git add components/BottomNav.tsx tests/components/bottom-nav.test.tsx
git commit -m "feat: center class tab in bottom navigation"
```

---

### Task 2: Add the WCT Premium placeholder to lessons

**Files:**
- Create: `components/wct/WctPremiumPlaceholderCard.tsx`
- Modify: `tests/components/wct-library.test.tsx`
- Modify: `app/lessons/page.tsx`
- Modify: `e2e/wct-course-library.spec.ts`

**Interfaces:**
- Consumes: Existing `/lessons` page grid and `WctBookCard` list.
- Produces: `WctPremiumPlaceholderCard(): JSX.Element`, exposed as an `article` named `WCT Premium 준비 중` with no link or button.

- [ ] **Step 1: Write the failing component test**

Add `within` to the Testing Library import and import the new component:

```tsx
import { render, screen, within } from "@testing-library/react";
import { WctPremiumPlaceholderCard } from "@/components/wct/WctPremiumPlaceholderCard";
```

Add this test to `tests/components/wct-library.test.tsx`:

```tsx
it("renders WCT Premium as a non-interactive placeholder", () => {
  render(<WctPremiumPlaceholderCard />);

  const card = screen.getByRole("article", { name: "WCT Premium 준비 중" });
  expect(within(card).getByText("WCT Premium")).toBeVisible();
  expect(within(card).getByText("준비 중")).toBeVisible();
  expect(within(card).queryByRole("link")).not.toBeInTheDocument();
  expect(within(card).queryByRole("button")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the component test and verify it fails**

Run:

```bash
npm test -- tests/components/wct-library.test.tsx
```

Expected: FAIL because `WctPremiumPlaceholderCard` does not exist.

- [ ] **Step 3: Implement the non-interactive Premium card**

Create `components/wct/WctPremiumPlaceholderCard.tsx`:

```tsx
export function WctPremiumPlaceholderCard() {
  return (
    <article
      aria-label="WCT Premium 준비 중"
      className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5"
    >
      <p className="text-xl font-black text-ink">WCT Premium</p>
      <p className="mt-4 text-sm font-bold text-slate-500">준비 중</p>
    </article>
  );
}
```

- [ ] **Step 4: Run the component test and verify it passes**

Run:

```bash
npm test -- tests/components/wct-library.test.tsx
```

Expected: PASS, including all existing WCT read-only component tests.

- [ ] **Step 5: Write the failing lessons-flow assertions**

In the first test in `e2e/wct-course-library.spec.ts`, immediately after asserting the `/lessons` URL, add:

```ts
const premium = page.getByRole("article", { name: "WCT Premium 준비 중" });
await expect(premium).toBeVisible();
await expect(premium.getByRole("link")).toHaveCount(0);
await expect(premium.getByRole("button")).toHaveCount(0);

const bottomNavLabels = await page
  .getByRole("navigation", { name: "하단 주요 메뉴" })
  .getByRole("link")
  .allTextContents();
expect(bottomNavLabels).toEqual(["표현", "암기", "수업", "묘사", "질문"]);
```

- [ ] **Step 6: Run the lessons E2E test and verify the placeholder assertion fails**

Run:

```bash
npm run test:e2e -- e2e/wct-course-library.spec.ts --grep "reads WCT"
```

Expected: FAIL because `/lessons` does not render the Premium article yet.

- [ ] **Step 7: Render the Premium card without changing book data**

Import the placeholder in `app/lessons/page.tsx`:

```tsx
import { WctPremiumPlaceholderCard } from "@/components/wct/WctPremiumPlaceholderCard";
```

Replace the existing books conditional with:

```tsx
<div className="grid gap-4 sm:grid-cols-2">
  {books.map((book) => <WctBookCard key={book.id} book={book} />)}
  <WctPremiumPlaceholderCard />
</div>
{books.length === 0 ? (
  <EmptyState
    title="아직 WCT 교재가 없습니다"
    body="검토하고 승인한 WCT Day가 생기면 이 책장에 표시됩니다."
  />
) : null}
```

- [ ] **Step 8: Run the component and E2E tests and verify they pass**

Run:

```bash
npm test -- tests/components/bottom-nav.test.tsx tests/components/wct-library.test.tsx
npm run test:e2e -- e2e/wct-course-library.spec.ts
```

Expected: Both commands PASS; the E2E flow still opens the existing WCT book and Day content.

- [ ] **Step 9: Commit the Premium placeholder**

```bash
git add app/lessons/page.tsx components/wct/WctPremiumPlaceholderCard.tsx tests/components/wct-library.test.tsx e2e/wct-course-library.spec.ts
git commit -m "feat: add WCT Premium placeholder"
```

---

### Task 3: Run the completion gate

**Files:**
- Verify only; no additional source changes expected.

**Interfaces:**
- Consumes: Completed Task 1 and Task 2 behavior.
- Produces: Fresh evidence that static checks, focused tests, and the live lessons flow pass.

- [ ] **Step 1: Run static verification**

```bash
npm run lint
npm run typecheck
```

Expected: Both commands exit with code 0.

- [ ] **Step 2: Run focused component verification**

```bash
npm test -- tests/components/bottom-nav.test.tsx tests/components/wct-library.test.tsx
```

Expected: Both test files pass with zero failures.

- [ ] **Step 3: Run the affected live route flow**

```bash
npm run test:e2e -- e2e/wct-course-library.spec.ts
```

Expected: The Playwright project passes, including navigation to `/lessons`, the exact GNB order, the non-interactive Premium card, existing book navigation, and Day content.

- [ ] **Step 4: Check the running development server**

Ensure the existing server still listens externally and serves the app:

```bash
ss -ltnp | grep ':3000'
curl -sS -o /dev/null -w 'HOME=%{http_code}\n' http://127.0.0.1:3000/
curl -sS -o /dev/null -w 'LESSONS=%{http_code}\n' http://127.0.0.1:3000/lessons
```

Expected: Port `3000` listens on `0.0.0.0`; the home route returns `200`; `/lessons` returns either `200` for an authenticated session or an auth redirect.

- [ ] **Step 5: Inspect the final diff and repository state**

```bash
git status --short
git log -3 --oneline
```

Expected: No uncommitted task files remain, and the two implementation commits follow the approved design and plan commits.
