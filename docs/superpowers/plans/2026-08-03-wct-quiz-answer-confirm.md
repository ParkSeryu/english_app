# WCT Quiz Answer Confirmation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Require an explicit `정답 확인` action before a selected WCT quiz answer is scored and its feedback is revealed.

**Architecture:** Keep `WctQuizRunner` and its public props unchanged. Split the current single selection state into an editable selection plus an `isAnswerConfirmed` flag; only confirmation appends to `answers`, reveals correctness, and unlocks the existing next/result action.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Vitest, Testing Library, Playwright

## Global Constraints

- Show `정답 확인` below the choices from the initial render.
- Disable it until a choice is selected, and allow changing the choice before confirmation.
- Record one answer, reveal feedback, and lock choices only after confirmation.
- Preserve question order, scoring, persistence, retry, retake, routes, and Day entry UI.
- Add no dependency, abstraction, or unrelated UI change.

---

### Task 1: Add explicit answer confirmation to the shared quiz runner

**Files:**
- Modify: `tests/components/wct-quiz-runner.test.tsx`
- Modify: `e2e/wct-day-review-quiz.spec.ts`
- Modify: `components/wct/WctQuizRunner.tsx`

**Interfaces:**
- Consumes: `WctQuizRunner({ quizSet, returnHref }: { quizSet: WctQuizSet; returnHref: string })`
- Produces: The same interface with separate selected and confirmed states.

- [ ] **Step 1: Write the failing component and E2E expectations**

In the first component interaction test, assert this sequence:

```tsx
const confirmButton = screen.getByRole("button", { name: "정답 확인" });
expect(confirmButton).toBeDisabled();
await user.click(screen.getByRole("button", { name: "Wrong A 1" }));
expect(confirmButton).toBeEnabled();
expect(screen.queryByText("Explanation 1")).not.toBeInTheDocument();
expect(screen.getByRole("button", { name: "Wrong A 1" })).toBeEnabled();
await user.click(screen.getByRole("button", { name: "Wrong B 1" }));
await user.click(confirmButton);
expect(screen.getByText("아쉬워요. 정답을 확인해 보세요.")).toBeVisible();
expect(screen.getByText("Explanation 1")).toBeVisible();
expect(screen.getByRole("button", { name: "Wrong B 1, 오답" }))
  .toBeDisabled();
```

Update the component `answerQuiz` helper and E2E `completeQuiz` helper to click `정답 확인` after every selected choice. E2E must assert `/정답이에요|아쉬워요/` is absent before that click and visible after it.

- [ ] **Step 2: Run the component test and verify RED**

```bash
npm test -- tests/components/wct-quiz-runner.test.tsx
```

Expected: FAIL because no `정답 확인` button exists and a choice reveals feedback immediately.

- [ ] **Step 3: Implement the minimal selected/confirmed state split**

Add state:

```tsx
const [isAnswerConfirmed, setIsAnswerConfirmed] = useState(false);
```

Make selection editable and record the answer only on confirmation:

```tsx
function selectChoice(choiceId: string) {
  if (isAnswerConfirmed || saving || result) return;
  setSelectedChoiceId(choiceId);
}

function confirmAnswer() {
  if (!selectedChoiceId || isAnswerConfirmed || saving || result) return;
  setAnswers((current) => [
    ...current,
    { questionId: question.id, choiceId: selectedChoiceId }
  ]);
  setIsAnswerConfirmed(true);
}
```

Reset `isAnswerConfirmed` in `nextQuestion` and `restart`. Require confirmation before advancing. Before confirmation, style only the selected choice without revealing correctness; after confirmation, reuse the current correct/wrong styles, labels, disabled choices, feedback, and explanation.

Render a fixed disabled/enabled confirmation button before confirmation, then the current next/result button after confirmation:

```tsx
{isAnswerConfirmed ? (
  <button type="button" onClick={isLastQuestion ? showAndSaveResult : nextQuestion}>
    {isLastQuestion ? "결과 보기" : "다음 문제"}
  </button>
) : (
  <button type="button" onClick={confirmAnswer} disabled={!selectedChoiceId}>
    정답 확인
  </button>
)}
```

Use the existing full-width teal action styling and disabled opacity convention.

- [ ] **Step 4: Run the focused component test and verify GREEN**

```bash
npm test -- tests/components/wct-quiz-runner.test.tsx
```

Expected: all runner tests pass, including one confirmed answer per question.

- [ ] **Step 5: Run standard and Premium E2E**

```bash
npm run test:e2e -- e2e/wct-day-review-quiz.spec.ts
```

Expected: 3 tests pass with explicit confirmation on every question.

- [ ] **Step 6: Commit the behavior change**

```bash
git add components/wct/WctQuizRunner.tsx \
  tests/components/wct-quiz-runner.test.tsx \
  e2e/wct-day-review-quiz.spec.ts
git commit -m "feat: confirm WCT quiz answers before revealing feedback"
```

---

### Task 2: Run the runtime-facing verification gate

**Files:**
- Verify: `components/wct/WctQuizRunner.tsx`
- Verify: `app/lessons/books/[bookId]/days/[dayId]/quiz/page.tsx`
- Verify: `app/lessons/premium/days/[dayId]/quiz/page.tsx`

**Interfaces:**
- Consumes: The explicit confirmation flow from Task 1.
- Produces: Verification evidence for standard and Premium routes.

- [ ] **Step 1: Run static, regression, and build checks**

```bash
npm run lint
npm run typecheck
npm test -- --maxWorkers=1
npm run build
```

Expected: every command exits 0 with no new failures.

- [ ] **Step 2: Start a task-owned externally bound server**

```bash
npm run dev -- --hostname 0.0.0.0 --port 3101
```

Expected: local and WSL external-IP URLs are healthy without replacing unrelated servers.

- [ ] **Step 3: Exercise the actual affected routes**

```text
/lessons/books/<seeded-book-id>/days/<seeded-day-id>/quiz
/lessons/premium/days/day-1/quiz
```

On each route verify that selection alone hides feedback, `정답 확인` reveals it, next/result navigation completes, and the server log contains no 500 or failed server action.

- [ ] **Step 4: Check final scope**

```bash
git diff main...HEAD --check
git status --short
```

Expected: only the approved design, plan, runner, component test, and E2E test differ from `main`.
