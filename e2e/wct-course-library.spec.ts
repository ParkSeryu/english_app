import { expect, test } from "@playwright/test";

let otherOwnerBookId = "";

test.beforeEach(async ({ request }) => {
  expect((await request.post("/test/reset")).ok()).toBe(true);
  const seed = await request.post("/test/seed-wct-book");
  expect(seed.ok()).toBe(true);
  otherOwnerBookId = (await seed.json()).otherOwnerBookId;
});

test("reads WCT by book and Day without Topic or edit controls", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "수업" }).click();

  await expect(page).toHaveURL("/lessons");
  const premium = page.getByRole("article", { name: "WCT Premium 준비 중" });
  await expect(premium).toBeVisible();
  await expect(premium.getByRole("link")).toHaveCount(0);
  await expect(premium.getByRole("button")).toHaveCount(0);

  const bottomNavLabels = await page
    .getByRole("navigation", { name: "하단 주요 메뉴" })
    .getByRole("link")
    .allTextContents();
  expect(bottomNavLabels).toEqual(["표현", "암기", "수업", "묘사", "질문"]);
  await page.getByRole("link", { name: /WCT Pattern book Prenovice/ }).click();
  await expect(page.getByText("Day 1 (수동태)")).toBeVisible();
  await expect(page.getByText("Day 13 (if 가능)")).toBeVisible();
  await expect(page.getByText("Day 16 (간접의문문)")).toBeVisible();

  await page.getByRole("link", { name: /Day 13 \(if 가능\)/ }).click();
  await expect(page.getByText("핵심 패턴")).toBeVisible();
  await expect(page.getByText("AI 보완")).toBeVisible();
  await expect(page.getByText("중요 메모")).toBeVisible();
  await expect(page.getByText("핵심 연습")).toBeVisible();
  await expect(page.getByText(/Topic/i)).toHaveCount(0);
  await expect(page.getByRole("button", { name: /추가|수정|삭제|저장/ })).toHaveCount(0);
});

test("keeps the bottom navigation visible at desktop widths", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/");

  await expect(page.getByRole("navigation", { name: "하단 주요 메뉴" })).toBeVisible();
  await expect(page.getByRole("link", { name: "수업" })).toBeVisible();
});

test("does not expose another owner's book by guessed URL", async ({ page }) => {
  await page.goto(`/lessons/books/${otherOwnerBookId}`);
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  await expect(page.getByText("Other Owner WCT")).toHaveCount(0);
});
