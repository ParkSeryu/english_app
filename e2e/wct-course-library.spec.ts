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
  const premium = page.getByRole("link", { name: "WCT Premium" });
  await expect(premium).toBeVisible();
  await expect(premium).toHaveAttribute("href", "/lessons/premium");
  await expect(page.getByText("준비 중")).toHaveCount(0);

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

test("reads the approved WCT Premium Day 1 lesson", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "수업" }).click();
  await page.getByRole("link", { name: "WCT Premium" }).click();

  await expect(page).toHaveURL("/lessons/premium");
  await expect(page.getByRole("heading", { name: "WCT Premium" })).toBeVisible();

  await page.getByRole("link", { name: "Day 1" }).click();

  await expect(page).toHaveURL("/lessons/premium/days/day-1");
  await expect(page.getByRole("heading", { name: "Day 1" })).toBeVisible();
  await expect(page.getByText("주격과 목적격")).toBeVisible();
  await expect(page.getByText("관계대명사 뒤에 바로 동사가 나오면 → 생략 불가")).toBeVisible();
  await expect(page.getByText("관계대명사 뒤에 별도의 주어 + 동사가 나오면 → 생략 가능")).toBeVisible();
  await expect(page.getByText("what = the thing that")).toBeVisible();
  await expect(page.getByRole("button", { name: /추가|수정|삭제|저장/ })).toHaveCount(0);
  await expect(page.getByText("AI 보완")).toHaveCount(0);
});

test("returns 404 for an unknown WCT Premium Day", async ({ page }) => {
  await page.goto("/lessons/premium/days/missing-day");
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
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
