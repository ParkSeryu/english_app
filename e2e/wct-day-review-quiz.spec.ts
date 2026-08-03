import { expect, type Page, test } from "@playwright/test";

type SeedResult = {
  bookId: string;
  day13Id: string;
  otherOwnerBookId: string;
  otherOwnerDayId: string;
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

async function completeQuiz(page: Page, choiceIndex = 0) {
  for (let questionNumber = 1; questionNumber <= 5; questionNumber += 1) {
    await expect(page.getByText(`${questionNumber} / 5`, { exact: true }))
      .toBeVisible();
    await page.locator("main section").getByRole("button")
      .nth(choiceIndex).click();
    await expect(page.getByText(/정답이에요|아쉬워요/)).not.toBeVisible();
    await page.getByRole("button", { name: "정답 확인" }).click();
    await expect(page.getByText(/정답이에요|아쉬워요/)).toBeVisible();
    await expect(page.getByText("해설", { exact: true })).toBeVisible();
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
  await page.goto(dayHref);

  await page.getByRole("link", { name: "문제 풀기 5문제" }).click();
  await expect(page).toHaveURL(`${dayHref}/quiz`);
  const firstScore = await completeQuiz(page);

  await page.getByRole("link", { name: "Day로 돌아가기" }).click();
  await expect(page.getByRole("link", {
    name: `다시 풀기 최근 ${firstScore.replaceAll(" ", "")}`
  })).toBeVisible();

  await page.getByRole("link", {
    name: `다시 풀기 최근 ${firstScore.replaceAll(" ", "")}`
  }).click();
  const secondScore = await completeQuiz(page, 1);

  await page.getByRole("link", { name: "Day로 돌아가기" }).click();
  await expect(page.getByRole("link", {
    name: `다시 풀기 최근 ${secondScore.replaceAll(" ", "")}`
  })).toBeVisible();
});

test("completes a WCT Premium Day quiz", async ({ page }) => {
  const dayHref = "/lessons/premium/days/day-1";
  await page.goto(dayHref);

  await page.getByRole("link", { name: "문제 풀기 5문제" }).click();
  await expect(page).toHaveURL(`${dayHref}/quiz`);
  const score = await completeQuiz(page);

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
