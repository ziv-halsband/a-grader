import { expect, test, type Page } from "@playwright/test";
import { buildReviewItems } from "../src/content/games.ts";
import { LETTERS, LETTER_BY_ID } from "../src/content/letters.ts";
import { dayKey, letterMastery, type MasteryStat } from "../src/lib/mastery.ts";
import { seedChild } from "./helpers";

const DAY = 86_400_000;
const NOW = Date.now();
const ago = (days: number) => NOW - days * DAY;

/** A letter answered right on the first try on these days (days ago), in these kinds. */
function stat(daysAgo: number[], kinds: string[], extra: Partial<MasteryStat> = {}): MasteryStat {
  return {
    firstTry: daysAgo.length,
    withHelp: 0,
    misses: 0,
    lastFirstTry: true,
    at: ago(Math.min(...daysAgo)),
    days: daysAgo.map((d) => dayKey(ago(d))),
    kinds,
    ...extra,
  };
}

async function savedChild(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("grade-a-prepare:v1")!).children[0]);
}

test.describe("real mastery (draft rule: 2 days and 2 kinds of question)", () => {
  test("one day, or one kind, is not enough", () => {
    expect(letterMastery(undefined)).toBe("new");
    expect(letterMastery(stat([0], ["find", "starts"]))).toBe("practicing");
    expect(letterMastery(stat([0, 3], ["find"]))).toBe("practicing");
    expect(letterMastery(stat([0, 3], ["find", "starts"]))).toBe("knows");
    // A save from before 5 Nov (no days/kinds): practicing, never crashes.
    expect(letterMastery({ firstTry: 5, withHelp: 0, misses: 0, lastFirstTry: true, at: ago(1) })).toBe("practicing");
  });

  test("daily practice: weak letters first, due letters next, bloomed letters rarely", () => {
    const weak = ["alef", "bet", "gimel"];
    const due = ["dalet", "he", "vav", "zayin"];
    const bloomed = ["het", "tet", "yod"];
    const stats: Record<string, MasteryStat> = {};
    for (const id of weak) stats[id] = { ...stat([0], ["find"]), lastFirstTry: false, withHelp: 1, misses: 2 };
    for (const id of due) stats[id] = stat([4], ["find"]); // last seen 4 days ago, gap 1 day: overdue
    for (const id of bloomed) stats[id] = stat([0, 2], ["find", "starts"]); // practiced today
    for (let run = 0; run < 20; run++) {
      const items = buildReviewItems([...weak, ...due, ...bloomed], stats, NOW);
      const targets = items.map((i) => i.target);
      expect(items).toHaveLength(6);
      for (const id of weak) expect(targets).toContain(id);
      for (const id of bloomed) expect(targets).not.toContain(id);
      // A letter answered only by name gets a picture question, so it can bloom.
      for (const it of items) if (due.includes(it.target)) expect(it.kind).toBe("starts");
    }
  });
});

test("the garden: seeds, sprouts and flowers; a first bloom is celebrated once", async ({ page }) => {
  await seedChild(page, {
    worldId: "garden",
    letters: { alef: stat([1, 3], ["find", "starts"]), bet: stat([1], ["find"]) },
    playDays: [dayKey(NOW)],
  });
  await page.goto("/play/letters");
  const preview = page.getByRole("link", { name: "הַגִּנָּה שֶׁלִּי" });
  await expect(preview).toHaveClass(/anim-glow/); // something new bloomed
  await preview.click();

  await expect(page).toHaveURL(/\/play\/letters\/garden$/);
  await expect(page.locator('[data-stage="bloom"]')).toHaveCount(1);
  await expect(page.locator('[data-stage="sprout"]')).toHaveCount(1);
  await expect(page.locator('[data-stage="seed"]')).toHaveCount(LETTERS.length - 2);
  await expect(page.getByText("פֶּרַח חָדָשׁ פָּרַח!")).toBeVisible();
  await expect(page.getByLabel("ימים ששיחקנו השבוע: 1")).toBeVisible();

  // Celebrated once: saved, so the next visit just shows the garden.
  await expect.poll(async () => (await savedChild(page)).bloomSeen).toEqual(["alef"]);
  await page.reload();
  await expect(page.getByText("הַגִּנָּה שֶׁלָּךְ!")).toBeVisible();

  // A plant is alive: a tap makes it wiggle.
  await page.getByRole("button", { name: /^ב:/ }).click();
  await expect(page.getByRole("button", { name: /^ב:/ }).locator(".anim-wiggle")).toHaveCount(1);
});

test("the island grows palm trees", async ({ page }) => {
  await seedChild(page, { worldId: "island", gender: "m", letters: { alef: stat([1, 3], ["find", "starts"]) }, bloomSeen: ["alef"] });
  await page.goto("/play/letters/garden");
  await expect(page.getByRole("heading", { name: "הָאִי שֶׁלִּי" })).toBeVisible();
  await expect(page.locator('[data-stage="bloom"]')).toContainText("🌴");
  await expect(page.locator('[data-stage="seed"]').first()).toContainText("🥥");
});

test("an answer in the daily practice is saved with its day and question kind", async ({ page }) => {
  await seedChild(page, { done: ["letters/s1"] });
  await page.goto("/play/letters/review");
  const names = ["alef", "bet", "gimel", "dalet"].map((id) => LETTER_BY_ID[id]);
  const caption = page.locator("p.nikud").filter({ hasText: /אֵיפֹה|מַתְחִיל|נִגְמָר/ }).first();
  await expect(caption).toBeVisible();
  const text = (await caption.textContent())!;
  const target = names.find((l) => text.trim().endsWith(l.name))!;
  const find = text.includes("אֵיפֹה");
  await page.getByRole("button", { name: find ? `האות ${target.name}` : target.word, exact: true }).click();

  await expect
    .poll(async () => (await savedChild(page)).letters[target.id])
    .toMatchObject({ firstTry: 1, days: [dayKey(Date.now())], kinds: [find ? "find" : "starts"] });
  expect((await savedChild(page)).playDays).toEqual([dayKey(Date.now())]);
});

test("parents see green / yellow / gray from the new mastery, with one sentence each", async ({ page }) => {
  await seedChild(page, {
    letters: { alef: stat([1, 3], ["find", "starts"]), bet: stat([1], ["find"]) },
  });
  await page.goto("/parents");
  await page.getByRole("textbox").fill("17");
  await page.getByRole("button", { name: "כניסה" }).click();
  await expect(page.locator('[data-mastery="knows"]')).toHaveCount(1);
  await expect(page.locator('[data-mastery="practicing"]')).toHaveCount(1);
  await expect(page.locator('[data-mastery="new"]')).toHaveCount(LETTERS.length - 2);
  await expect(page.getByText("זוהתה נכון בניסיון הראשון בשני ימים שונים ובשני סוגי שאלות לפחות.")).toBeVisible();
  await expect(page.locator('[data-mastery="practicing"]')).toHaveAttribute("title", /חסר: עוד יום אחד ועוד סוג שאלה/);
});
