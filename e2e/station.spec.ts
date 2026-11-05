import { expect, test } from "@playwright/test";
import { seedChild } from "./helpers";

test("the surprise can't be opened before every step is finished", async ({ page }) => {
  await seedChild(page);
  await page.goto("/play/letters/s2");
  const prize = page.getByRole("navigation", { name: "שלבי התחנה" }).getByRole("button").last();
  await expect(prize).toContainText("🔒");
  await prize.click();
  await expect(page.locator('[aria-current="step"]')).toContainText("לוֹמְדִים");
});

test("the games menu has 5 games", async ({ page }) => {
  await seedChild(page);
  await page.goto("/play/letters/s1");
  await page.getByRole("button", { name: "מְשַׂחֲקִים" }).click();
  for (const name of ["בּוּעוֹת", "זִכָּרוֹן", "שַׁעֲשׁוּעוֹן", "גַּלְגַּל הַמַּזָּל", "תֵּבוֹת הַפְתָּעָה"]) {
    await expect(page.getByRole("button", { name: new RegExp(name) })).toBeVisible();
  }
});
