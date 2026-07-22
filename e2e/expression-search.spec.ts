import { expect, test } from "@playwright/test";

test.beforeEach(async ({ request }) => {
  const reset = await request.post("/test/reset");
  expect(reset.ok()).toBe(true);

  const firstTopic = await request.post("/test/seed-approved-expression-day");
  expect(firstTopic.ok()).toBe(true);
});

test("user searches expressions in English and Korean", async ({ page }) => {
  await page.goto("/expressions");

  await page.getByPlaceholder("영어 또는 한국어를 입력하세요").fill("BIRTH RATE");

  await expect(page).toHaveURL(/q=BIRTH(?:\+|%20)RATE/);
  await expect(page.getByText("BIRTH RATE 검색 결과 1개")).toBeVisible();
  await expect(page.getByRole("link", { name: "The birth rate in Korea is decreasing." })).toBeVisible();
  await expect(page.getByLabel("표현 토픽 선택")).toBeHidden();

  await page.getByPlaceholder("영어 또는 한국어를 입력하세요").fill("출산율");
  await expect(page.getByText("출산율 검색 결과 1개")).toBeVisible();
  await expect(page.getByRole("link", { name: "The birth rate in Korea is decreasing." })).toBeVisible();

  await page.getByRole("button", { name: "검색어 지우기" }).click();
  await expect(page.getByLabel("표현 토픽 선택")).toBeVisible();
});
