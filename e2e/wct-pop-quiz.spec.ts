import { expect, type Page, test } from "@playwright/test";

type SeedQuestion = {
  id: string;
  level: "prenovice" | "novice";
  dayNumber: number;
  format: "multiple_choice" | "fill_blank" | "true_false";
  prompt: string;
  choiceTexts: string[];
  correctChoiceText: string;
  dayId: string;
  sourceText: string;
};

type SeedResult = {
  prenoviceBookId: string;
  prenoviceDayCount: number;
  noviceBookId: string;
  noviceDayCount: number;
  otherOwnerBookId: string;
  questions: SeedQuestion[];
};

let seedResult: SeedResult;

test.beforeEach(async ({ request }) => {
  expect((await request.post("/test/reset")).ok()).toBe(true);
  const seed = await request.post("/test/seed-wct-book");
  expect(seed.ok()).toBe(true);
  seedResult = await seed.json() as SeedResult;
  expect(seedResult.prenoviceDayCount).toBe(16);
  expect(seedResult.noviceDayCount).toBe(28);
});

async function currentQuestion(page: Page, level: SeedQuestion["level"]) {
  const prompt = (await page.locator("main h1").textContent())?.trim();
  const choiceTexts = (await page.locator("button[aria-pressed]").allTextContents())
    .map((text) => text.trim());
  const question = seedResult.questions.find((candidate) => (
    candidate.level === level
    && candidate.prompt === prompt
    && JSON.stringify(candidate.choiceTexts) === JSON.stringify(choiceTexts)
  ));
  expect(question, `Missing E2E fixture for prompt: ${prompt}`).toBeDefined();
  return question as SeedQuestion;
}

async function answerAndConfirm(
  page: Page,
  level: SeedQuestion["level"],
  forceWrong = true
) {
  const question = await currentQuestion(page, level);
  const sourceLine = page.getByText(question.sourceText, { exact: true });
  const choices = page.locator("button[aria-pressed]");
  await expect(page.locator("main input, main textarea")).toHaveCount(0);
  const confirm = page.getByRole("button", { name: "정답 확인" });
  await expect(confirm).toBeDisabled();
  await expect(page.getByText(/^정답 문장 ·/u)).toHaveCount(0);
  await expect(page.getByText(/^원래 패턴 ·/u)).toHaveCount(0);
  const choiceTexts = await choices.allTextContents();
  const choiceIndex = forceWrong
    ? choiceTexts.findIndex((text) => text.trim() !== question.correctChoiceText)
    : choiceTexts.findIndex((text) => text.trim() === question.correctChoiceText);
  expect(choiceIndex).toBeGreaterThanOrEqual(0);

  await choices.nth(choiceIndex).click();
  await expect(page.getByText(/정답이에요|아쉬워요/)).toHaveCount(0);
  await expect(sourceLine).toHaveCount(0);
  await confirm.click();
  await expect(page.getByText(forceWrong ? "아쉬워요. 정답을 확인해 보세요." : "정답이에요")).toBeVisible();
  await expect(page.getByText(/^정답 문장 ·/u)).toBeVisible();
  await expect(page.getByText(/^원래 패턴 ·/u)).toBeVisible();
  await expect(sourceLine).toHaveCount(1);
  return question;
}

async function startAndCollectSignature(
  page: Page,
  bookId: string,
  level: SeedQuestion["level"],
  total: number
) {
  await page.goto(`/lessons/books/${bookId}`);
  await expect(page.getByText(`책 전체 Day를 ${total}문제로 복습해 보세요.`)).toBeVisible();
  await page.getByRole("button", { name: `Pop Quiz · ${total}문제` }).click();
  await expect(page.getByText(`1 / ${total}`, { exact: true })).toBeVisible();

  const signature: SeedQuestion[] = [];
  signature.push(await answerAndConfirm(page, level));
  await page.reload();
  await expect(page.getByText(`2 / ${total}`, { exact: true })).toBeVisible();

  for (let questionNumber = 2; questionNumber <= total; questionNumber += 1) {
    signature.push(await answerAndConfirm(page, level));
    if (questionNumber < total) {
      await page.getByRole("button", { name: "다음 문제" }).click();
      await expect(page.getByText(`${questionNumber + 1} / ${total}`, { exact: true })).toBeVisible();
    }
  }

  await page.getByRole("button", { name: "결과 보기" }).click();
  await expect(page.getByRole("heading", { name: `0 / ${total}` })).toBeVisible();
  return signature;
}

async function collectRetakeSignature(
  page: Page,
  level: SeedQuestion["level"],
  total: number
) {
  const signature: SeedQuestion[] = [];
  for (let questionNumber = 1; questionNumber <= total; questionNumber += 1) {
    await expect(page.getByText(`${questionNumber} / ${total}`, { exact: true })).toBeVisible();
    signature.push(await answerAndConfirm(page, level));
    if (questionNumber < total) {
      await page.getByRole("button", { name: "다음 문제" }).click();
    }
  }
  await page.getByRole("button", { name: "결과 보기" }).click();
  await expect(page.getByRole("heading", { name: `0 / ${total}` })).toBeVisible();
  return signature;
}

function formatCounts(signature: SeedQuestion[]) {
  const formats: SeedQuestion["format"][] = [
    "multiple_choice",
    "fill_blank",
    "true_false"
  ];
  return formats.map((format) => signature.filter((question) => (
    question.format === format
  )).length).sort((left, right) => right - left);
}

function nextFormat(format: SeedQuestion["format"]): SeedQuestion["format"] {
  if (format === "multiple_choice") return "fill_blank";
  if (format === "fill_blank") return "true_false";
  return "multiple_choice";
}

test("completes and retakes mobile Pop Quiz journeys for Prenovice and Novice", async ({ page }) => {
  test.setTimeout(240_000);
  const journeys = [
    {
      bookId: seedResult.prenoviceBookId,
      level: "prenovice" as const,
      total: seedResult.prenoviceDayCount
    },
    {
      bookId: seedResult.noviceBookId,
      level: "novice" as const,
      total: seedResult.noviceDayCount
    }
  ];
  for (const { bookId, level, total } of journeys) {
    const firstSignature = await startAndCollectSignature(page, bookId, level, total);
    expect(firstSignature).toHaveLength(total);
    expect(new Set(firstSignature.map((question) => question.dayId)).size).toBe(total);
    expect(firstSignature.map((question) => question.dayNumber))
      .toEqual(Array.from({ length: total }, (_item, index) => index + 1));
    expect(formatCounts(firstSignature)).toEqual(total === 16 ? [6, 5, 5] : [10, 9, 9]);
    expect(firstSignature.every((question) => !/\bwct\b|\bday\s*#?\s*\d+\b|\b(?:pre\s*novice|prenovice|novice|premium)\b/iu.test(
      `${question.prompt} ${question.choiceTexts.join(" ")}`
    ))).toBe(true);

    const wrongDayIds = firstSignature.map((question) => question.dayId);
    const reviewLinks = page.getByRole("link", { name: /Day \d+ 복습/ });
    await expect(reviewLinks).toHaveCount(total);

    const reviewHref = await reviewLinks.first().getAttribute("href");
    await reviewLinks.first().click();
    await expect(page).toHaveURL(reviewHref ?? "");

    await page.goto(`/lessons/books/${bookId}`);
    await page.getByRole("button", { name: `다시 풀기 · 최근 0/${total}` }).click();
    const retakeSignature = await collectRetakeSignature(page, level, total);
    expect(retakeSignature).toHaveLength(total);
    expect(new Set(retakeSignature.map((question) => question.dayId))).toEqual(new Set(wrongDayIds));
    const firstByDay = new Map(firstSignature.map((question) => [question.dayId, question]));
    expect(retakeSignature.every((question) => {
      const previous = firstByDay.get(question.dayId);
      return previous
        && previous.id !== question.id
        && question.format === nextFormat(previous.format);
    })).toBe(true);
    expect(formatCounts(retakeSignature)).toEqual(total === 16 ? [6, 5, 5] : [10, 9, 9]);
  }
});

test("excludes Premium and isolates another owner's guessed book", async ({ page }) => {
  await page.goto("/lessons/premium");
  await expect(page.getByRole("button", { name: /Pop Quiz|이어 풀기|다시 풀기/ })).toHaveCount(0);

  await page.goto(`/lessons/books/${seedResult.otherOwnerBookId}`);
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
});
