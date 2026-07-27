# WCT Premium Design Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align every WCT Premium reading surface with the established WCT library design without changing lesson content or behavior.

**Architecture:** Keep the Premium content model and routes intact. Make a surgical class/layout update in the four Premium presentation components and two Premium page headers, with regression coverage in the existing WCT component suite.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Vitest, Testing Library, Playwright

## Global Constraints

- Preserve every approved Day 1 lesson string and all existing routes.
- Preserve authentication, `notFound`, and read-only behavior.
- Do not add source badges, database work, schema changes, dependencies, or unrelated cleanup.
- Use the existing WCT teal/slate/white visual patterns.

---

### Task 1: Align WCT Premium presentation

**Files:**
- Modify: `tests/components/wct-library.test.tsx`
- Modify: `components/wct/WctPremiumCard.tsx`
- Modify: `components/wct/WctPremiumDayCard.tsx`
- Modify: `components/wct/WctPremiumDayContent.tsx`
- Modify: `app/lessons/premium/page.tsx`
- Modify: `app/lessons/premium/days/[dayId]/page.tsx`

**Interfaces:**
- Consumes: `WctPremiumLesson`, `WctPremiumContentBlock`, and the existing WCT Tailwind class patterns.
- Produces: unchanged component props and routes with corrected visual output.

- [ ] **Step 1: Write the failing visual regression assertions**

Assert that the Premium shelf and Day links use `border-slate-200 bg-white hover:border-teal-300`, that example blocks use `bg-slate-50 text-ink`, rule blocks use `bg-teal-50 text-slate-700`, and pattern cards use `rounded-3xl border-slate-200 bg-white shadow-sm`. Assert that Premium output no longer contains `bg-violet-50`, `border-violet-200`, or `bg-slate-900`.

- [ ] **Step 2: Verify the focused test fails for the expected visual mismatch**

Run:

```bash
npm test -- tests/components/wct-library.test.tsx
```

Expected: FAIL because the current Premium components still use violet backgrounds/borders and black example panels.

- [ ] **Step 3: Apply the minimal presentation fix**

Update only the six listed presentation files. Copy the established WCT Tailwind class patterns directly; do not change data types, lesson strings, routing, or behavior.

- [ ] **Step 4: Verify focused and full checks**

Run:

```bash
npm test -- tests/components/wct-library.test.tsx
npm test
npm run lint
npm run typecheck
npm run build
npm run test:e2e -- e2e/wct-course-library.spec.ts
```

Expected: all commands exit 0, with the WCT component test and five WCT Playwright flows passing.

- [ ] **Step 5: Verify live routes and commit**

Run the app on `0.0.0.0`, exercise `/lessons`, `/lessons/premium`, and `/lessons/premium/days/day-1`, inspect logs for runtime errors, then commit:

```bash
git add docs/superpowers/specs/2026-07-28-wct-premium-design-alignment.md docs/superpowers/plans/2026-07-28-wct-premium-design-alignment.md tests/components/wct-library.test.tsx components/wct/WctPremiumCard.tsx components/wct/WctPremiumDayCard.tsx components/wct/WctPremiumDayContent.tsx app/lessons/premium/page.tsx app/lessons/premium/days/[dayId]/page.tsx
git commit -m "fix: align WCT Premium design"
```

