import { expect, test } from "@playwright/test";

test.beforeEach(async ({ request }) => {
  const reset = await request.post("/test/reset");
  expect(reset.ok()).toBe(true);
  const seed = await request.post("/test/seed-approved-expression-day");
  expect(seed.ok()).toBe(true);
});

test("user tests only the expressions in a selected date topic", async ({ page }) => {
  await page.goto("/expressions");

  await page.getByRole("link", { name: "이 날짜 표현 테스트" }).click();

  await expect(page).toHaveURL(/\/memorize\?topic=.+/);
  await expect(page.getByRole("heading", { name: "날짜별 표현 테스트" })).toBeVisible();
  await expect(page.getByText("2026-04-27 · 오늘의 영어표현")).toBeVisible();
  await expect(page.getByText("남은 표현 2개")).toBeVisible();
  await expect(page.getByRole("heading", { name: "한국의 출산율이 감소하고 있어요." })).toBeVisible();
  await expect(page.getByText("The birth rate in Korea is decreasing.")).toBeHidden();

  await page.getByRole("button", { name: /정답 보기/ }).click();
  await page.getByRole("button", { name: /쉬움/ }).click();
  await expect(page.getByRole("heading", { name: "저는 먹지 않으려고 노력해요." })).toBeVisible();

  await page.getByRole("button", { name: /정답 보기/ }).click();
  await page.getByRole("button", { name: /쉬움/ }).click();

  await expect(page.getByText("이 날짜의 표현 테스트를 마쳤습니다")).toBeVisible();
  await expect(page.getByRole("link", { name: "표현 목록으로 돌아가기" })).toHaveAttribute("href", /\/expressions\?topic=.+/);
});
