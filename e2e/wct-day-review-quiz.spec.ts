import { expect, type Page, test } from "@playwright/test";

type SeedResult = {
  bookId: string;
  day13Id: string;
  otherOwnerBookId: string;
  otherOwnerDayId: string;
  premiumQuizSet: {
    generatorVersion: string;
    questions: Array<Record<string, unknown>>;
  };
  questions: Array<{
    id: string;
    dayId: string;
    dayNumber: number;
    format: "multiple_choice" | "fill_blank" | "true_false";
    prompt: string;
    choiceTexts: string[];
    correctChoiceText: string;
    sourceText: string;
  }>;
};

let seedResult: SeedResult;

test.beforeEach(async ({ request }) => {
  expect((await request.post("/test/reset")).ok()).toBe(true);
  const seed = await request.post("/test/seed-wct-book");
  expect(seed.ok()).toBe(true);
  seedResult = await seed.json() as SeedResult;
  expect(seedResult.bookId).toBeTruthy();
  expect(seedResult.day13Id).toBeTruthy();
  expect(seedResult.otherOwnerBookId).toBeTruthy();
  expect(seedResult.otherOwnerDayId).toBeTruthy();
});

const FORMAT_LABEL = {
  multiple_choice: "문장 선택",
  fill_blank: "빈칸",
  true_false: "O/X"
} as const;

const FORBIDDEN_LEARNER_METADATA = /\bwct\b|\bday\s*#?\s*\d+\b|\bcourse\b|\b(?:pre\s*novice|prenovice|novice|premium)\b/iu;

async function completeQuiz(
  page: Page,
  expectedQuestions: SeedResult["questions"],
  choiceIndex = 0
) {
  for (let questionNumber = 1; questionNumber <= 5; questionNumber += 1) {
    const expected = expectedQuestions[questionNumber - 1];
    await expect(page.getByText(`${questionNumber} / 5`, { exact: true }))
      .toBeVisible();
    const prompt = page.locator("main h1");
    await expect(prompt).toHaveText(expected.prompt);
    await expect(page.getByText(FORMAT_LABEL[expected.format], { exact: true }))
      .toBeVisible();
    await expect(page.locator("main input, main textarea")).toHaveCount(0);
    const confirm = page.getByRole("button", { name: "정답 확인" });
    await expect(confirm).toBeDisabled();
    await expect(page.getByText(expected.sourceText, { exact: true })).toHaveCount(0);
    await expect(page.getByText(/^정답 문장 ·/u)).toHaveCount(0);
    await expect(page.getByText(/^원래 패턴 ·/u)).toHaveCount(0);

    const choices = page.locator("button[aria-pressed]");
    await expect(choices).toHaveCount(expected.choiceTexts.length);
    const choiceTexts = (await choices.allTextContents()).map((text) => text.trim());
    const learnerFacingText = [
      (await prompt.textContent())?.trim() ?? "",
      ...choiceTexts
    ].join(" ");
    expect(learnerFacingText).not.toMatch(FORBIDDEN_LEARNER_METADATA);
    expect(choiceTexts).toEqual(expected.choiceTexts);
    await choices.nth(choiceIndex % expected.choiceTexts.length).click();
    await expect(page.getByText(/정답이에요|아쉬워요/)).not.toBeVisible();
    await confirm.click();
    await expect(page.getByText(/정답이에요|아쉬워요/)).toBeVisible();
    await expect(page.getByText(expected.sourceText, { exact: true })).toBeVisible();
    await expect(page.getByText(/^정답 문장 ·/u)).toBeVisible();
    await expect(page.getByText(/^원래 패턴 ·/u)).toBeVisible();
    if (questionNumber < 5) {
      await page.getByRole("button", { name: "다음 문제" }).click();
    }
  }

  await page.getByRole("button", { name: "결과 보기" }).click();
  const resultHeading = page.getByRole("heading", {
    name: /^[0-5] \/ 5$/
  });
  await expect(resultHeading).toBeVisible();
  const scoreText = await resultHeading.textContent();
  expect(scoreText).not.toBeNull();
  return scoreText?.trim() ?? "";
}

test("completes and retakes a standard WCT Day quiz", async ({ page }) => {
  const dayHref =
    `/lessons/books/${seedResult.bookId}/days/${seedResult.day13Id}`;
  const dayQuestions = seedResult.questions.filter((question) => (
    question.dayId === seedResult.day13Id
  ));
  expect(dayQuestions).toHaveLength(5);
  await page.goto(dayHref);

  await page.getByRole("link", { name: "문제 풀기 5문제" }).click();
  await expect(page).toHaveURL(`${dayHref}/quiz`);
  const firstScore = await completeQuiz(page, dayQuestions);

  await page.getByRole("link", { name: "Day로 돌아가기" }).click();
  await expect(page.getByRole("link", {
    name: `다시 풀기 최근 ${firstScore.replaceAll(" ", "")}`
  })).toBeVisible();

  await page.getByRole("link", {
    name: `다시 풀기 최근 ${firstScore.replaceAll(" ", "")}`
  }).click();
  const secondScore = await completeQuiz(page, dayQuestions, 1);

  await page.getByRole("link", { name: "Day로 돌아가기" }).click();
  await expect(page.getByRole("link", {
    name: `다시 풀기 최근 ${secondScore.replaceAll(" ", "")}`
  })).toBeVisible();
});

test("completes a WCT Premium Day quiz", async ({ page }) => {
  expect(seedResult.premiumQuizSet.generatorVersion).toBe("wct-review-v1");
  expect(seedResult.premiumQuizSet.questions).toHaveLength(5);
  expect(seedResult.premiumQuizSet.questions.every((question) => (
    !Object.hasOwn(question, "format")
  ))).toBe(true);

  const dayHref = "/lessons/premium/days/day-1";
  await page.goto(dayHref);

  await page.getByRole("link", { name: "문제 풀기 5문제" }).click();
  await expect(page).toHaveURL(`${dayHref}/quiz`);
  await expect(page.getByText(/문장 선택|빈칸|O\/X/u)).toHaveCount(0);
  await expect(page.locator("button[aria-pressed]")).toHaveCount(4);
  const confirm = page.getByRole("button", { name: "정답 확인" });
  await expect(confirm).toBeDisabled();
  await page.locator("button[aria-pressed]").first().click();
  await confirm.click();
  await expect(page.getByText("해설", { exact: true })).toBeVisible();

  for (let questionNumber = 1; questionNumber < 5; questionNumber += 1) {
    await page.getByRole("button", { name: "다음 문제" }).click();
    await page.locator("button[aria-pressed]").first().click();
    await page.getByRole("button", { name: "정답 확인" }).click();
  }
  await page.getByRole("button", { name: "결과 보기" }).click();
  const resultHeading = page.getByRole("heading", { name: /^[0-5] \/ 5$/u });
  await expect(resultHeading).toBeVisible();
  const score = (await resultHeading.textContent())?.trim() ?? "";

  await page.getByRole("link", { name: "Day로 돌아가기" }).click();
  await expect(page.getByRole("link", {
    name: `다시 풀기 최근 ${score.replaceAll(" ", "")}`
  })).toBeVisible();
});

test("returns 404 for another owner's guessed standard quiz URL", async ({
  page
}) => {
  await page.goto(
    `/lessons/books/${seedResult.otherOwnerBookId}`
    + `/days/${seedResult.otherOwnerDayId}/quiz`
  );
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
});
