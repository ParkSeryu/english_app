import { expect, test, type APIRequestContext } from "@playwright/test";

type SeedResponse = {
  expressionDay: { id: string };
};

async function seedTopic(request: APIRequestContext) {
  const response = await request.post("/test/seed-approved-expression-day");
  expect(response.ok()).toBe(true);
  return await response.json() as SeedResponse;
}

test("switches expression topics without another page request", async ({ page, request }) => {
  const reset = await request.post("/test/reset");
  expect(reset.ok()).toBe(true);

  const firstTopic = await seedTopic(request);
  const secondTopic = await seedTopic(request);

  await page.goto(`/expressions?topic=${firstTopic.expressionDay.id}`);
  const topicSelect = page.getByRole("combobox");
  await expect(topicSelect).toHaveValue(firstTopic.expressionDay.id);

  const topicRequests: string[] = [];
  page.on("request", (outgoingRequest) => {
    const url = new URL(outgoingRequest.url());
    if (url.pathname === "/expressions" && url.searchParams.get("topic") === secondTopic.expressionDay.id) {
      topicRequests.push(outgoingRequest.url());
    }
  });

  await topicSelect.selectOption(secondTopic.expressionDay.id);

  await expect.poll(() => new URL(page.url()).searchParams.get("topic")).toBe(secondTopic.expressionDay.id);
  await expect(topicSelect).toHaveValue(secondTopic.expressionDay.id);
  await expect(page.locator('a[href^="/expressions/new"]')).toHaveAttribute("href", `/expressions/new?topic=${secondTopic.expressionDay.id}`);
  expect(topicRequests).toEqual([]);

  await page.goBack();
  await expect(topicSelect).toHaveValue(firstTopic.expressionDay.id);
});
