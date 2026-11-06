import { expect, test } from "@playwright/test";
import timings from "../src/content/story-audio.json";
import { STORIES, STORY_WORLDS, storiesOf, storyAudioItems, storyWords } from "../src/content/stories.ts";
import { libraryAudioItems } from "../src/content/library.ts";
import { analyzeWord, checkText, usesVowel, VOWEL_SHAPES, vowelShapes, type Vowel } from "../src/lib/decodable.ts";
import { seedChild } from "./helpers";

test.describe("decodable stories (content/stories.ts)", () => {
  test("the checker catches what it should", () => {
    // Fine in the kamatz/patach world.
    expect(checkText("דָּנָה בָּאָה!", "kamatz-patach")).toEqual([]);
    expect(checkText("הַגָּמָל קָפַץ לַיָּם!", "kamatz-patach")).toEqual([]);
    // A vowel that isn't taught yet.
    expect(checkText("אָכְלָה", "kamatz-patach").join()).toContain("uses shva");
    expect(checkText("כַּדּוּר", "holam").join()).toContain("uses shuruk-kubutz");
    expect(checkText("מִי", "tsere-segol").join()).toContain("uses hiriq");
    // Missing nikud, a ש without its dot, a foreign character.
    expect(checkText("כַּדור", "shva").join()).toContain("has no vowel");
    expect(checkText("שָלוֹם", "shva").join()).toContain("ש without its dot");
    expect(checkText("dog", "shva").join()).toContain("unexpected character");
    // Vowel letters count as vowels, matres are fine.
    expect([...analyzeWord("יוֹם").vowels]).toEqual(["holam"]);
    expect([...analyzeWord("כַּדּוּר").vowels].sort()).toEqual(["kamatz-patach", "shuruk-kubutz"]);
    expect(analyzeWord("פִּיל").problems).toEqual([]);
    expect(analyzeWord("בֵּיצָה").problems).toEqual([]);
    expect(analyzeWord("קוֹרֵאת").problems).toEqual([]);
  });

  test("every word of every story uses only the vowels taught so far", () => {
    const problems = STORIES.flatMap((s) =>
      [s.title, ...s.pages.map((p) => p.text), s.question.text].flatMap((t) => checkText(t, s.world).map((p) => `${s.id}: ${p}`)),
    );
    expect(problems).toEqual([]);
  });

  test("6 stories per world, each one uses its world's new vowel", () => {
    for (const w of STORY_WORLDS) {
      const list = storiesOf(w);
      expect(list, w).toHaveLength(6);
      if (w === "all-nikud") continue;
      for (const s of list) expect(usesVowel([s.title, ...s.pages.map((p) => p.text)].join(" "), w as Vowel), s.id).toBe(true);
    }
  });

  test("🌈 כָּל הַנִּקּוּד: the last shelf, and every story on it shows all 9 vowel shapes", () => {
    expect(STORY_WORLDS.at(-1)).toBe("all-nikud");
    // The checker tells the shapes apart (kamatz ≠ patach, shuruk ≠ kubutz, holam male counts as holam).
    expect([...vowelShapes("כַּדּוּר")].sort()).toEqual(["patach", "shuruk"]);
    expect([...vowelShapes("שָׁלוֹם")].sort()).toEqual(["holam", "kamatz"]);
    expect([...vowelShapes("כֻּלָּם")].sort()).toEqual(["kamatz", "kubutz"]);
    for (const s of storiesOf("all-nikud")) {
      const shapes = vowelShapes(s.pages.map((p) => p.text).join(" "));
      expect(VOWEL_SHAPES.filter((v) => !shapes.has(v)), `${s.id} is missing`).toEqual([]);
    }
  });

  test("short: 3–5 pages, 2–6 words a page, 3 different picture answers, ≤ ~4,700 characters", () => {
    for (const s of STORIES) {
      expect(s.pages.length, s.id).toBeGreaterThanOrEqual(3);
      expect(s.pages.length, s.id).toBeLessThanOrEqual(5);
      for (const p of s.pages) {
        const n = storyWords(p.text).length;
        expect(n, `${s.id}: ${p.text}`).toBeGreaterThanOrEqual(2);
        expect(n, `${s.id}: ${p.text}`).toBeLessThanOrEqual(6);
        expect(p.pic.length, `${s.id}: picture`).toBeGreaterThan(0);
      }
      expect(new Set(s.question.options).size, s.id).toBe(3);
    }
    const chars = storyAudioItems().reduce((n, i) => n + i.text.length, 0);
    expect(chars).toBeLessThanOrEqual(4700);
  });

  test("story audio timings, when there are any, match their pages", () => {
    const items = new Map([...storyAudioItems(), ...libraryAudioItems()].map((i) => [i.key, i.text]));
    for (const [key, e] of Object.entries(timings as unknown as Record<string, { text: string; words: [number, number][] }>)) {
      expect(items.has(key), key).toBe(true);
      if (items.get(key) === e.text) expect(e.words, key).toHaveLength(storyWords(e.text).length);
    }
  });
});

test.describe("the story reader", () => {
  test("every shelf on /play/stories, a world has its own shelf, and the nikud map's 🌈 opens the last one", async ({ page }) => {
    await seedChild(page);
    await page.goto("/play/stories");
    await expect(page.locator('a[href^="/play/stories/"]')).toHaveCount(STORIES.length);

    await page.goto("/play/stories/hiriq");
    await expect(page.locator('a[href^="/play/stories/hiriq/"]')).toHaveCount(6);

    await page.goto("/play/nikud");
    await page.locator('[data-story-shelf="all-nikud"]').click();
    await expect(page).toHaveURL(/\/play\/stories\/all-nikud$/);
    await expect(page.locator('a[href^="/play/stories/all-nikud/"]')).toHaveCount(6);
  });

  test("the 👆 moves to the 🌈 shelf once every other shelf is read", async ({ page }) => {
    const at = new Date().toISOString();
    const stories = Object.fromEntries(STORIES.filter((s) => s.world !== "all-nikud").map((s) => [s.id, { reads: 1, star: true, at }]));
    await seedChild(page, { stories });
    await page.goto("/play/stories");
    const first = storiesOf("all-nikud")[0];
    await expect(page.getByRole("link", { name: first.title }).locator(".anim-point")).toBeVisible();
  });

  test("the big map has 3 chapters: letters, nikud, אֲנִי קוֹרֵא", async ({ page }) => {
    await seedChild(page);
    await page.goto("/play");
    await expect(page.getByRole("link", { name: /אֲנִי קוֹרֵא/ })).toBeVisible();
    await expect(page.getByText("מִלִּים רִאשׁוֹנוֹת")).toHaveCount(0);
    await expect(page.getByText("מִשְׁפָּטִים")).toHaveCount(0);
    await expect(page.getByText("סִפּוּרִים", { exact: true })).toHaveCount(0);
  });

  test("read a story to the end without audio: tap words, turn pages, answer, get the sticker", async ({ page }) => {
    await seedChild(page);
    const s = STORIES[0];
    await page.goto(`/play/stories/${s.world}/${s.id}`);
    await page.getByRole("button", { name: "לפתוח את הספר" }).click();

    for (const [i, p] of s.pages.entries()) {
      const words = storyWords(p.text);
      await expect(page.locator("[data-word]")).toHaveCount(words.length);
      await expect(page.locator("[data-word]").first()).toContainText(words[0]);
      // Tapping a word with no audio yet must not break anything.
      await page.locator("[data-word]").last().click();
      await expect(page.locator("[data-word]").last()).toBeVisible();
      await page.getByRole("button", { name: i === s.pages.length - 1 ? "לשאלה" : "לעמוד הבא" }).click();
    }

    // The question: one wrong tap (no ⭐), then the right one.
    await expect(page.locator("[data-answer]")).toHaveCount(3);
    await page.locator('[data-answer="wrong"]').first().click();
    await page.locator('[data-answer="right"]').click();
    await expect(page.getByRole("link", { name: /לַמַּדָּף/ })).toBeVisible();
    await expect(page.getByLabel("קראת").first()).toBeVisible();

    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("grade-a-prepare:v1")!).children[0].stories);
    expect(saved[s.id]).toMatchObject({ reads: 1, star: false });

    // Back on the shelf: the book has its ✓ and its sticker.
    await page.getByRole("link", { name: /לַמַּדָּף/ }).click();
    await expect(page).toHaveURL(new RegExp(`/play/stories/${s.world}$`));
    await expect(page.getByRole("link", { name: s.title }).getByLabel("קראת")).toBeVisible();
  });

  test("right on the first try gives a ⭐, and the next book is offered", async ({ page }) => {
    await seedChild(page);
    const s = STORIES[6];
    await page.goto(`/play/stories/${s.world}/${s.id}`);
    await page.getByRole("button", { name: "לפתוח את הספר" }).click();
    for (let i = 0; i < s.pages.length - 1; i++) await page.getByRole("button", { name: "לעמוד הבא" }).click();
    await page.getByRole("button", { name: "לשאלה" }).click();
    await page.locator('[data-answer="right"]').click();
    await expect(page.getByLabel("כוכב")).toBeVisible();
    await expect(page.getByRole("link", { name: new RegExp(STORIES[7].title.replace(/[?!]/g, "")) })).toBeVisible();
  });
});
