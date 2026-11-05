import { expect, test, type Page } from "@playwright/test";
import { seedChild } from "./helpers";

// The games for the hard parts of letters: 🔍 lookalike detective, 🛏️ finals' pajamas, 🔦 letter hunt.
// The games are random, so each game marks the letter it asks for (data-target) and each choice its letter.

async function openGames(page: Page, station: string) {
  await seedChild(page);
  await page.goto(`/play/letters/${station}`);
  await page.getByRole("button", { name: "מְשַׂחֲקִים" }).click();
}

const menuTiles = (page: Page) => page.locator("[data-menu] > button");

/** Letters the child has recorded (from localStorage). */
async function recorded(page: Page): Promise<Record<string, { firstTry: number; withHelp: number }>> {
  return page.evaluate(() => JSON.parse(localStorage.getItem("grade-a-prepare:v1")!).children[0].letters);
}

test("the menu shows only the games that fit the station, never more than 6", async ({ page }) => {
  await openGames(page, "s1");
  await expect(page.getByRole("button", { name: /צַיִד בַּתְּמוּנָה/ })).toBeVisible();
  // No lookalike pair is learned yet at s1, and no final letters.
  await expect(page.getByRole("button", { name: /בַּלָּשׁ/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /פִּיגָ'מוֹת/ })).toHaveCount(0);
  await expect(menuTiles(page)).toHaveCount(6);

  await page.goto("/play/letters/s3");
  await page.getByRole("button", { name: "מְשַׂחֲקִים" }).click();
  await expect(page.getByRole("button", { name: /בַּלָּשׁ/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /פִּיגָ'מוֹת/ })).toHaveCount(0);
  await expect(menuTiles(page)).toHaveCount(6);

  await page.goto("/play/letters/s7");
  await page.getByRole("button", { name: "מְשַׂחֲקִים" }).click();
  await expect(page.getByRole("button", { name: /פִּיגָ'מוֹת/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /בַּלָּשׁ/ })).toBeVisible();
  await expect(menuTiles(page)).toHaveCount(6);
});

test("lookalike detective: the glass shows the difference, a wrong pick is forgiven, 6 rounds back to the menu", async ({ page }) => {
  await openGames(page, "s2");
  await page.getByRole("button", { name: /בַּלָּשׁ/ }).click();
  const game = page.locator('[data-game="detective"]');
  for (let r = 0; r < 6; r++) {
    // Before the glass, nothing is asked.
    await expect(game).toHaveAttribute("data-target", "");
    await page.getByRole("button", { name: "זכוכית מגדלת" }).click();
    await expect(game.locator(".anim-lens")).toHaveCount(2);
    const target = await game.getAttribute("data-target");
    expect(target).toBeTruthy();
    if (r === 0) {
      // A wrong pick: the right card glows, then the child taps it.
      await game.locator(`button[data-letter]:not([data-letter="${target}"])`).click();
      await expect(game.locator(`button[data-letter="${target}"]`)).toHaveClass(/anim-glow/);
    }
    await game.locator(`button[data-letter="${target}"]`).click();
    if (r < 5) await expect(game.getByLabel(`סיבוב ${r + 2} מתוך 6`)).toBeVisible({ timeout: 15_000 });
  }
  await expect(page.getByRole("button", { name: /בַּלָּשׁ/ })).toBeVisible({ timeout: 20_000 });
  const letters = await recorded(page);
  const total = Object.values(letters).reduce((n, s) => n + s.firstTry + s.withHelp, 0);
  expect(total).toBe(6);
  expect(Object.values(letters).some((s) => s.withHelp > 0)).toBe(true);
});

test("finals' pajamas: the right form goes to bed at the end of the word (or wakes at the start)", async ({ page }) => {
  await openGames(page, "s7");
  await page.getByRole("button", { name: /פִּיגָ'מוֹת/ }).click();
  const game = page.locator('[data-game="pajamas"]');
  for (let r = 0; r < 6; r++) {
    await expect(game.getByLabel(`סיבוב ${r + 1} מתוך 6`)).toBeVisible({ timeout: 15_000 });
    const target = await game.getAttribute("data-target");
    const night = target!.endsWith("-sofit");
    if (r === 2) {
      await game.locator(`button[data-letter]:not([data-letter="${target}"])`).click();
      await expect(game.locator(`button[data-letter="${target}"]`)).toHaveClass(/anim-glow/);
    }
    await game.locator(`button[data-letter="${target}"]`).click();
    // At night the letter puts its pajamas on.
    if (night) await expect(game.locator(".pajamas")).toHaveCount(1);
  }
  await expect(page.locator(".pajamas")).toHaveCount(5, { timeout: 15_000 });
  await expect(page.getByRole("button", { name: /פִּיגָ'מוֹת/ })).toBeVisible({ timeout: 20_000 });
  // The first night is a demo (the hand shows it): 5 rounds scored.
  const letters = await recorded(page);
  expect(Object.values(letters).reduce((n, s) => n + s.firstTry + s.withHelp, 0)).toBe(5);
});

test("letter hunt: find every thing that starts with the letter, in 3 scenes, without audio files", async ({ page }) => {
  // No voice files at all: the game must still run on captions (new scene words have no audio yet).
  await page.route("**/audio/**", (route) => route.abort());
  await openGames(page, "s4");
  await page.getByRole("button", { name: /צַיִד בַּתְּמוּנָה/ }).click();
  const game = page.locator('[data-game="hunt"]');
  const seen: string[] = [];
  for (let r = 0; r < 3; r++) {
    await expect(game).toBeVisible({ timeout: 15_000 });
    await expect(game).not.toHaveAttribute("data-target", seen.at(-1) ?? "-", { timeout: 15_000 });
    const target = (await game.getAttribute("data-target"))!;
    seen.push(target);
    const things = game.locator("button[data-letter]");
    await expect(things).toHaveCount(8);
    const hits = game.locator(`button[data-letter="${target}"]`);
    const n = await hits.count();
    expect(n).toBeGreaterThanOrEqual(2);
    expect(n).toBeLessThanOrEqual(3);
    // A wrong thing says its name in a bubble and wobbles.
    const miss = game.locator(`button[data-letter]:not([data-letter="${target}"])`).first();
    const word = (await miss.getAttribute("aria-label"))!;
    await miss.click();
    await expect(miss).toContainText(word);
    for (let i = 0; i < n; i++) await hits.nth(i).click();
  }
  expect(new Set(seen).size).toBe(3);
  await expect(page.getByRole("button", { name: /צַיִד בַּתְּמוּנָה/ })).toBeVisible({ timeout: 20_000 });
  const letters = await recorded(page);
  for (const t of seen) expect(letters[t]?.withHelp).toBe(1);
});
