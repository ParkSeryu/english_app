# WCT Premium Section Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan.

**Goal:** Present Premium Day 1 as five clearly separated cards while preserving all content and behavior.

**Architecture:** Keep `PremiumBlock` and the Premium lesson model intact. Add the established WCT card shell to each section and render key patterns as slate mini cards inside the final section.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Vitest, Testing Library, Playwright

## Global Constraints

- Preserve every lesson string, route, auth guard, and read-only behavior.
- Modify only `WctPremiumDayContent` and its component test.
- Use existing white/slate/teal WCT styles and add no dependencies.

---

### Task 1: Add section card hierarchy

**Files:**
- Modify: `tests/components/wct-library.test.tsx`
- Modify: `components/wct/WctPremiumDayContent.tsx`

**Interfaces:**
- Consumes: unchanged `WctPremiumLesson`.
- Produces: unchanged component API with card-based rendering.

- [ ] Add failing assertions that each of the five headings belongs to a `rounded-3xl border-slate-200 bg-white p-5 shadow-sm` section.
- [ ] Run `npm test -- tests/components/wct-library.test.tsx` and confirm the card assertion fails.
- [ ] Apply the minimal section-card and pattern-mini-card class changes.
- [ ] Run focused tests, lint, typecheck, WCT E2E, and live route checks.
- [ ] Commit as `feat: add WCT Premium section cards`.
