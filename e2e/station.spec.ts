import { expect, test, type Page } from "@playwright/test";
import { seedChild } from "./helpers";

// The prize path (founder, 5 Nov): each finished step drops a ⭐ into the 🎁; the 🎁 stays locked until every
// other step is done; tapping it early gives nothing (a wiggle, a knock and the 👆 at the next step).

const bar = (page: Page) => page.getByRole("navigation", { name: "שלבי התחנה" });
const prize = (page: Page) => bar(page).locator('[data-step="done"]');
const stars = (page: Page) => prize(page).locator("[data-stars]");
const stickers = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("grade-a-prepare:v1")!).children[0].stickers.length as number);

/** The quiz's progress ("שאלה n מתוך N"), or null once the quiz is over. */
async function progress(page: Page) {
  const dots = page.locator('[aria-label^="שאלה"]');
  return (await dots.count()) ? dots.getAttribute("aria-label") : null;
}

/** Answers the current question: tries the options one by one (the hint ladder lets every child through). */
async function solve(page: Page) {
  const before = await progress(page);
  const options = page.locator("main button.aspect-square");
  for (let k = 0; k < 4; k++) {
    const b = options.nth(k);
    if (!(await b.count()) || (await b.isDisabled())) continue;
    await b.click();
    if (await page.locator("main button.bg-green-100").count()) break;
  }
  await expect.poll(() => progress(page), { timeout: 15_000 }).not.toBe(before);
}

async function solveAll(page: Page) {
  await expect(page.locator('[aria-label^="שאלה"]')).toBeVisible();
  while (await progress(page)) await solve(page);
}

/** 📖 learn in a letters station: next through the letters, then say-it + 👂 for each, then on to the quiz. */
async function finishMeet(page: Page) {
  const next = page.getByRole("button", { name: "הבא" });
  const ear = page.getByRole("button", { name: "לשמוע אם צדקתי" });
  const toGame = page.getByRole("button", { name: /לַמִּשְׂחָק/ });
  for (let i = 0; i < 30; i++) {
    if ((await toGame.count()) && (await ear.count())) {
      await ear.click();
      await toGame.click();
      return;
    }
    if (await ear.count()) await ear.click();
    await next.click();
  }
  throw new Error("learn never ended");
}

test("letters: tapping the 🎁 early gives nothing, and the hand points at the next step", async ({ page }) => {
  await seedChild(page);
  await page.goto("/play/letters/s2");
  await expect(prize(page)).toHaveAttribute("data-state", "locked");
  await expect(prize(page)).toContainText("🔒");
  await expect(stars(page)).toHaveAttribute("data-stars", "0");
  await prize(page).click();
  // Still learning; no chest/egg, no sticker; the 👆 shows the next step to do.
  await expect(page.locator('[aria-current="step"]')).toContainText("לוֹמְדִים");
  await expect(page.locator('[data-step="meet"] .anim-point')).toBeVisible();
  await expect(page.getByRole("button", { name: "בֵּיצַת קְסָמִים" })).toHaveCount(0);
  expect(await stickers(page)).toBe(0);
});

test("kamatz: tapping the 🎁 early gives nothing either", async ({ page }) => {
  await seedChild(page);
  await page.goto("/play/kamatz-patach/k1");
  await expect(prize(page)).toHaveAttribute("data-state", "locked");
  await prize(page).click();
  await expect(page.locator('[aria-current="step"]')).toContainText("לוֹמְדִים");
  await expect(page.getByRole("button", { name: "בֵּיצַת קְסָמִים" })).toHaveCount(0);
  expect(await stickers(page)).toBe(0);
});

test("letters: every finished step adds a ⭐; one game counts for 🎮; the 🎁 waits for the last step", async ({ page }) => {
  await seedChild(page);
  await page.goto("/play/letters/s2");

  await finishMeet(page);
  await expect(stars(page)).toHaveAttribute("data-stars", "1");
  // A short splash of the next step, tap to skip.
  const splash = page.locator("[data-splash]");
  if (await splash.count()) await splash.click();
  await expect(page.locator('[aria-current="step"]')).toContainText("מוֹצְאִים");

  await solveAll(page);
  await expect(stars(page)).toHaveAttribute("data-stars", "2");
  await expect(page.locator('[aria-current="step"]')).toContainText("כּוֹתְבִים");

  // Skip writing for now (practice mode): play one game. Back at the menu, the 🎮 step is done.
  await bar(page).locator('[data-step="play"]').click();
  await page.getByRole("button", { name: /בַּלָּשׁ/ }).click();
  const game = page.locator('[data-game="detective"]');
  for (let r = 0; r < 6; r++) {
    await page.getByRole("button", { name: "זכוכית מגדלת" }).click();
    await expect(game.locator(".anim-lens")).toHaveCount(2);
    const target = await game.getAttribute("data-target");
    await game.locator(`button[data-letter="${target}"]`).click();
    if (r < 5) await expect(game.getByLabel(`סיבוב ${r + 2} מתוך 6`)).toBeVisible({ timeout: 15_000 });
  }
  await expect(page.getByRole("button", { name: /בַּלָּשׁ/ })).toBeVisible({ timeout: 20_000 });
  await expect(stars(page)).toHaveAttribute("data-stars", "3");
  await expect(bar(page).locator('[data-step="play"]')).toHaveAttribute("data-state", "done");

  // 3 of 4: still locked. "To the surprise" leads to the step that is missing (writing).
  await expect(prize(page)).toHaveAttribute("data-state", "locked");
  await prize(page).click();
  await expect(page.locator('[data-step="write"] .anim-point')).toBeVisible();
  await page.getByRole("button", { name: /לַהַפְתָּעָה/ }).click();
  await expect(page.locator('[aria-current="step"]')).toContainText("כּוֹתְבִים");
  expect(await stickers(page)).toBe(0);
});

test("kamatz words: all steps → the 🎁 opens, stars drop in, the prize is won; a replay shows it collected", async ({ page }) => {
  await seedChild(page);
  await page.goto("/play/kamatz-patach/k5");
  await expect(stars(page)).toHaveAttribute("data-stars", "0");

  // 📖 learn: next through the words, then "read alone".
  const next = page.getByRole("button", { name: "הבא" });
  while (await next.count()) await next.click();
  await page.getByRole("button", { name: /לִקְרֹא לְבַד/ }).click();
  await expect(stars(page)).toHaveAttribute("data-stars", "1");
  await expect(prize(page)).toHaveAttribute("data-state", "locked");

  // 🔍 read: the last step. Then the prize opens by itself.
  await solveAll(page);
  await expect(page.locator('[aria-current="step"]')).toContainText("פְּרָס");
  await expect(stars(page)).toHaveAttribute("data-stars", "2");
  await expect(prize(page)).not.toHaveAttribute("data-state", "locked");

  // The egg: the 2 stars drop in, then it can be opened.
  const egg = page.getByRole("button", { name: "בֵּיצַת קְסָמִים" });
  await expect(egg).toHaveAttribute("data-filled", "yes", { timeout: 5000 });
  await egg.click();
  await expect(page.locator('[data-reveal="new"]')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText("מַדְבֵּקָה חֲדָשָׁה", { exact: true })).toBeVisible();
  await expect(page.getByText("מַתָּנָה לֶחָבֵר", { exact: true })).toBeVisible();
  expect(await stickers(page)).toBe(1);

  // A replay: the 🎁 is open (already collected) and shows what was won, without giving it again.
  await page.reload();
  await expect(prize(page)).toHaveAttribute("data-state", "collected");
  await prize(page).click();
  await expect(page.locator('[data-reveal="collected"]')).toBeVisible();
  await expect(page.getByText("כְּבָר בָּאוֹסֶף")).toBeVisible();
  expect(await stickers(page)).toBe(1);
});

test("the first station shows all 5 classic games", async ({ page }) => {
  await seedChild(page);
  await page.goto("/play/letters/s1");
  await page.getByRole("button", { name: "מְשַׂחֲקִים" }).click();
  for (const name of ["בּוּעוֹת", "זִכָּרוֹן", "שַׁעֲשׁוּעוֹן", "גַּלְגַּל הַמַּזָּל", "תֵּבוֹת הַפְתָּעָה"]) {
    await expect(page.getByRole("button", { name: new RegExp(name) })).toBeVisible();
  }
});
