import { expect, test } from "@playwright/test";

test("a new parent sets up a child, the child picks a buddy and sees the tour", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /בואו נתחיל/ }).click();
  await page.getByRole("textbox").fill("נועה");
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: /בַּת/ }).click();
  await page.getByRole("button", { name: /יוצאים לדרך/ }).click();

  await expect(page).toHaveURL(/\/play$/);
  await page.getByRole("button", { name: "פִּינְגְּוִין" }).click();
  // The 4-card tour, then the map.
  for (let i = 0; i < 4; i++) await page.getByRole("button", { name: /הבא|←/ }).last().click();
  await expect(page.getByText(/הָאִמּוּן הַיּוֹמִי/).first()).toBeVisible();
});
