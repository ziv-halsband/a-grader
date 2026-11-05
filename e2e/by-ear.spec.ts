import { expect, test, type Page } from "@playwright/test";
import { seedChild } from "./helpers";

// "Know a letter by ear, not only by eye": 📖 learn's say-it-then-check, and the quiz's 👂 by-ear questions.

/** The quiz's progress ("שאלה n מתוך N"), or null once the quiz is over. */
async function progress(page: Page) {
  const dots = page.locator('[aria-label^="שאלה"]');
  return (await dots.count()) ? dots.getAttribute("aria-label") : null;
}

/** Answers the current question: tries the options one by one (the hint ladder lets every child through). */
async function solve(page: Page) {
  const before = await progress(page);
  const options = page.locator("main button.aspect-square");
  for (let k = 0; k < 3; k++) {
    const b = options.nth(k);
    if (await b.isDisabled()) continue;
    await b.click();
    if (await page.locator("main button.bg-green-100").count()) break;
  }
  await expect.poll(() => progress(page), { timeout: 15_000 }).not.toBe(before);
}

test("learn: say the letter out loud, then 👂 to check, before moving on", async ({ page }) => {
  await seedChild(page);
  await page.goto("/play/letters/s1");
  // Meet the 4 letters; the word is tappable and its picture is there.
  await expect(page.getByRole("button", { name: "המילה אַרְיֵה" })).toBeVisible();
  for (let i = 0; i < 4; i++) await page.getByRole("button", { name: "הבא" }).click();
  // 🗣️ Say it: the name is hidden and "next" waits until the child checks with 👂.
  const ear = page.getByRole("button", { name: "לשמוע אם צדקתי" });
  await expect(ear).toBeVisible();
  for (let i = 0; i < 3; i++) {
    await expect(page.getByRole("button", { name: "הבא" })).toBeDisabled();
    await ear.click();
    await page.getByRole("button", { name: "הבא" }).click();
  }
  const toGame = page.getByRole("button", { name: /לַמִּשְׂחָק/ });
  await expect(toGame).toBeDisabled();
  await ear.click();
  await toGame.click();
  await expect(page.locator('[aria-current="step"]')).toContainText("מוֹצְאִים");
});

test("station quiz: by-ear questions with the picture, and the quiz can be finished", async ({ page }) => {
  await seedChild(page);
  await page.goto("/play/letters/s1");
  await page.getByRole("button", { name: "מוֹצְאִים" }).click();
  let byEar = 0;
  while (await progress(page)) {
    // A by-ear question shows the word's picture with an ear to hear it again ("בַּיִת, לשמוע שוב").
    // The caption must not write the word (the child would match the letter by eye): 👂 instead.
    if (await page.getByRole("button", { name: /., לשמוע שוב$/ }).count()) {
      byEar++;
      await expect(page.locator("main p.nikud").first()).toContainText("👂");
    }
    await solve(page);
  }
  expect(byEar).toBe(2);
  await expect(page.locator('[aria-current="step"]')).toContainText("כּוֹתְבִים");
});

test("review station: one by-ear question has no picture until it is solved", async ({ page }) => {
  await seedChild(page);
  await page.goto("/play/letters/m1");
  await page.getByRole("button", { name: "מוֹצְאִים" }).click();
  let hidden = 0;
  while (await progress(page)) {
    if (await page.getByRole("button", { name: "לשמוע שוב", exact: true }).count()) {
      hidden++;
      await expect(page.getByRole("button", { name: "לשמוע שוב", exact: true })).toContainText("👂");
      const before = await progress(page);
      await solve(page);
      expect(before).not.toBeNull();
      continue;
    }
    await solve(page);
  }
  expect(hidden).toBe(1);
});
