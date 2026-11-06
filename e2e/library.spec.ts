import { expect, test } from "@playwright/test";
import { bookTexts, booksOf, LIBRARY, libraryAudioItems, READING_STAGES } from "../src/content/library.ts";
import { checkStage, stageVowels, usesVowel } from "../src/lib/decodable.ts";
import { seedChild } from "./helpers";

const words = (t: string) => t.split(/\s+/).filter(Boolean);
const graphemes = (s: string) => [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(s)].map((g) => g.segment);

test.describe("📗 the library's books (content/library.ts)", () => {
  test("stages: kamatz/patach + shva first, then holam, hiriq, tsere/segol, shuruk/kubutz", () => {
    expect(READING_STAGES.map((s) => s.id)).toEqual(["a", "b", "c", "d", "e"]);
    expect([...stageVowels("a")].sort()).toEqual(["kamatz-patach", "shva"]);
    expect(stageVowels("b").has("holam")).toBe(true);
    expect(stageVowels("b").has("hiriq")).toBe(false);
    expect(stageVowels("c").has("tsere-segol")).toBe(false);
    expect(stageVowels("e").size).toBe(6);
    // The checker per stage.
    expect(checkStage("דָּנָה קָפְצָה!", "a")).toEqual([]);
    expect(checkStage("לֹא", "a").join()).toContain("uses holam");
    expect(checkStage("מִי", "b").join()).toContain("uses hiriq");
    expect(checkStage("אֶת", "c").join()).toContain("uses tsere-segol");
    expect(checkStage("הוּא", "d").join()).toContain("uses shuruk-kubutz");
  });

  test("every word of every book (title, lines, bubbles, questions) is decodable for its stage", () => {
    const problems = LIBRARY.flatMap((b) => bookTexts(b).flatMap((t) => checkStage(t, b.stage).map((p) => `${b.id}: ${p}`)));
    expect(problems).toEqual([]);
  });

  test("5 books per stage; each uses its stage's new vowel", () => {
    for (const s of READING_STAGES) {
      const books = booksOf(s.id);
      expect(books, s.id).toHaveLength(5);
      for (const b of books) {
        const text = bookTexts(b).join(" ");
        expect(s.adds.some((v) => usesVowel(text, v)), b.id).toBe(true);
      }
    }
  });

  test("real little books: 4–8 pages, 1–4 short lines, a bubble's speaker is in the picture, 1–2 fair questions", () => {
    const ids = new Set<string>();
    for (const b of LIBRARY) {
      expect(ids.has(b.id), b.id).toBe(false);
      ids.add(b.id);
      expect(b.pages.length, b.id).toBeGreaterThanOrEqual(4);
      expect(b.pages.length, b.id).toBeLessThanOrEqual(8);
      expect(b.pages.some((p) => p.say), `${b.id} has a speech bubble`).toBe(true);
      expect(b.pages.reduce((n, p) => n + p.lines.length, 0), `${b.id} is more than one line a page`).toBeGreaterThan(b.pages.length);
      for (const [i, p] of b.pages.entries()) {
        expect(p.lines.length, `${b.id} p${i + 1}`).toBeGreaterThanOrEqual(1);
        expect(p.lines.length, `${b.id} p${i + 1}`).toBeLessThanOrEqual(4);
        for (const l of p.lines) expect(words(l).length, `${b.id}: ${l}`).toBeLessThanOrEqual(7);
        expect(graphemes(p.pic).length, `${b.id} p${i + 1} picture`).toBeGreaterThan(0);
        if (p.say) expect(graphemes(p.pic), `${b.id} p${i + 1}: who speaks`).toContain(p.say.who);
      }
      expect(b.questions.length, b.id).toBeGreaterThanOrEqual(1);
      expect(b.questions.length, b.id).toBeLessThanOrEqual(2);
      const quotes = b.pages.flatMap((p) => (p.say ? [p.say] : []));
      for (const q of b.questions) {
        expect(new Set(q.options).size, b.id).toBe(3);
        if (q.kind === "who") {
          const said = quotes.find((s) => s.text === q.quote);
          expect(said, `${b.id}: "${q.quote}" is in the book`).toBeTruthy();
          expect(q.options[0], `${b.id}: the right face said it`).toBe(said!.who);
        }
      }
    }
    // Every audio key is unique (one mp3 per line later).
    const keys = libraryAudioItems().map((i) => i.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

test.describe("📗 the library", () => {
  test("the big map's אֲנִי קוֹרֵא opens the shelves, by stage, the first book glowing", async ({ page }) => {
    await seedChild(page);
    await page.goto("/play");
    await page.getByRole("link", { name: /אֲנִי קוֹרֵא/ }).click();
    await expect(page).toHaveURL(/\/play\/i-read$/);
    await expect(page.locator("[data-stage]")).toHaveCount(5);
    for (const s of READING_STAGES) {
      await expect(page.locator(`[data-stage="${s.id}"] a[href^="/play/i-read/"]`)).toHaveCount(5);
    }
    await expect(page.getByRole("link", { name: LIBRARY[0].title }).locator(".anim-point")).toBeVisible();
  });

  test("read a whole book with no audio: tap words, turn pages, answer, get the sticker, keep going", async ({ page }) => {
    await seedChild(page);
    const b = LIBRARY[0];
    await page.goto(`/play/i-read/${b.id}`);
    await page.getByRole("button", { name: "לפתוח את הספר" }).click();

    for (const [i, p] of b.pages.entries()) {
      const page$ = page.locator(`[data-page="${i}"]`);
      const n = p.lines.reduce((k, l) => k + words(l).length, 0) + (p.say ? words(p.say.text).length : 0);
      await expect(page$.locator("[data-word]")).toHaveCount(n);
      await expect(page$.locator("[data-bubble]")).toHaveCount(p.say ? 1 : 0);
      // No recording yet: tapping a word and 🔊 must not break anything.
      await page$.locator("[data-word]").last().click();
      await expect(page$.locator("[data-word]").last()).toBeVisible();
      if (i === 0) await page.getByRole("button", { name: "להקשיב" }).click();
      await page.getByRole("button", { name: i === b.pages.length - 1 ? "לשאלה" : "לעמוד הבא" }).click();
    }

    // Question 1 (a picture): one wrong tap, then the right one. Question 2 (who said it?): right away.
    await expect(page.locator('[data-question="pic"]')).toBeVisible();
    await page.locator('[data-answer="wrong"]').first().click();
    await page.locator('[data-answer="right"]').click();
    await expect(page.locator('[data-question="who"]')).toBeVisible();
    await page.locator('[data-answer="right"]').click();

    await expect(page.getByRole("link", { name: /לַמַּדָּף/ })).toBeVisible();
    await expect(page.getByLabel("קראת").first()).toBeVisible();
    await expect(page.getByRole("link", { name: new RegExp(LIBRARY[1].title) })).toBeVisible();

    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("grade-a-prepare:v1")!).children[0].books);
    expect(saved[b.id]).toMatchObject({ reads: 1, star: false });

    // Back on the shelf: the book has its ✓, and the next book glows.
    await page.getByRole("link", { name: /לַמַּדָּף/ }).click();
    await expect(page).toHaveURL(/\/play\/i-read$/);
    await expect(page.getByRole("link", { name: b.title }).getByLabel("קראת")).toBeVisible();
    await expect(page.getByRole("link", { name: LIBRARY[1].title }).locator(".anim-point")).toBeVisible();
  });

  test("all answers right on the first try give a ⭐; next book continues", async ({ page }) => {
    await seedChild(page);
    const b = LIBRARY.find((x) => x.stage === "e")!;
    await page.goto(`/play/i-read/${b.id}`);
    await page.getByRole("button", { name: "לפתוח את הספר" }).click();
    for (let i = 0; i < b.pages.length - 1; i++) await page.getByRole("button", { name: "לעמוד הבא" }).click();
    await page.getByRole("button", { name: "לשאלה" }).click();
    for (let i = 0; i < b.questions.length; i++) {
      await page.locator('[data-answer="right"]').click();
      if (i < b.questions.length - 1) await expect(page.locator(`[data-question="${b.questions[i + 1].kind}"]`)).toBeVisible();
    }
    await expect(page.getByLabel("כוכב")).toBeVisible();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("grade-a-prepare:v1")!).children[0].books);
    expect(saved[b.id]).toMatchObject({ reads: 1, star: true });
  });

  test("the short-story reader shows 🔊 even without a recording", async ({ page }) => {
    await seedChild(page);
    await page.goto("/play/stories/hiriq/hiriq-1");
    await page.getByRole("button", { name: "לפתוח את הספר" }).click();
    await page.getByRole("button", { name: "להקשיב" }).click();
    await expect(page.locator("[data-word]").first()).toBeVisible();
  });
});
