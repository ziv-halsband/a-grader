import { expect, test, type Page } from "@playwright/test";
import { NIKUD_TOPICS } from "../src/content/curriculum";
import {
  NIKUD_SYLLABLE_BY_ID,
  NIKUD_SYLLABLES,
  NIKUD_WORD_BY_ID,
  NIKUD_WORDS,
  NIKUD_WORLDS,
  allowedVowels,
  normalizeNikud,
  readWord,
  shownSyllable,
} from "../src/content/nikud";
import { rewardPath } from "../src/content/rewards";
import { VOICE_BY_ID } from "../src/content/voice";
import { WORLDS } from "../src/content/worlds";
import { seedChild } from "./helpers";

// The nikud worlds: the content rules (every word readable with the vowels learned so far), every world loads,
// a whole station can be played to the surprise, and the surprise stays locked until every step is done.

test.describe("content", () => {
  // Pure checks: once is enough.
  test.skip(({ browserName }) => browserName !== "chromium");

  test("every reading word uses only the vowels learned so far, and its own world's vowel", () => {
    for (const w of NIKUD_WORLDS) {
      const ok = allowedVowels(w.id);
      for (const st of w.stations.filter((s) => s.kind === "words")) {
        for (const id of st.itemIds) {
          const word = NIKUD_WORD_BY_ID[id];
          expect(word, `${w.id}: word ${id}`).toBeTruthy();
          const r = readWord(word.word);
          expect(r.problems, `${word.word}: ${r.problems.join(", ")}`).toEqual([]);
          for (const v of r.vowels) expect(ok, `${word.word} uses "${v}" in ${w.id}`).toContain(v);
          expect(r.vowels, `${word.word} doesn't use ${w.vowel}`).toContain(w.vowel);
        }
      }
    }
  });

  test("the validator catches a vowel that wasn't learned yet", () => {
    // שָׁלוֹם has a holam: not allowed in the kamatz/patach world.
    expect(readWord("שָׁלוֹם").vowels).toContain("o");
    expect(allowedVowels("kamatz-patach")).not.toContain("o");
    // A missing vowel in the middle of a word (no written shva) is a problem.
    expect(readWord("מַזלֵג").problems.length).toBeGreaterThan(0);
    expect(readWord("מַזְלֵג").problems).toEqual([]);
  });

  test("each syllable's picture word starts with it, and every syllable sounds like its world", () => {
    for (const s of NIKUD_SYLLABLES) {
      const world = NIKUD_WORLDS.find((w) => w.id === s.worldId)!;
      const word = NIKUD_WORD_BY_ID[s.word];
      expect(word, s.id).toBeTruthy();
      expect(world.marks.map((m) => m.id), s.id).toContain(s.mark);
      expect(normalizeNikud(word.word).startsWith(normalizeNikud(shownSyllable(s))), `${word.word} / ${shownSyllable(s)}`).toBe(
        true,
      );
      const first = readWord(shownSyllable(s)).chips[0];
      expect(first.vowel === world.vowel || (world.vowel === "shva" && first.closed), s.id).toBe(true);
    }
    // A station never asks for two syllables of the same letter (the find game would have two right answers).
    for (const w of NIKUD_WORLDS)
      for (const st of w.stations.filter((x) => x.kind === "syllables")) {
        const shown = st.itemIds.map((id) => shownSyllable(NIKUD_SYLLABLE_BY_ID[id]));
        expect(new Set(shown).size).toBe(shown.length);
      }
  });

  test("ids, pictures, audio lines, rewards", () => {
    expect(NIKUD_WORLDS.map((w) => w.id)).toEqual(NIKUD_TOPICS.map((t) => t.id));
    expect(new Set(NIKUD_WORDS.map((w) => w.id)).size).toBe(NIKUD_WORDS.length);
    for (const w of NIKUD_WORDS) {
      expect(w.emoji.length, w.id).toBeGreaterThan(0);
      expect(VOICE_BY_ID[w.audio], `audio ${w.audio}`).toBeTruthy();
    }
    for (const s of NIKUD_SYLLABLES) expect(VOICE_BY_ID[s.audio], `audio ${s.audio}`).toBeTruthy();
    for (const w of NIKUD_WORLDS) {
      for (const m of w.marks) expect(VOICE_BY_ID[m.line], m.line).toBeTruthy();
      expect(VOICE_BY_ID[w.soundLine], w.soundLine).toBeTruthy();
      expect(VOICE_BY_ID[`nw-${w.id}`]).toBeTruthy();
    }
    const path = rewardPath(WORLDS.garden);
    for (const w of NIKUD_WORLDS)
      for (const s of w.stations) {
        const r = path.find((x) => x.key === `${w.id}/${s.id}`);
        expect(r?.sticker && r.gift, `${w.id}/${s.id}`).toBeTruthy();
      }
  });
});

/** Taps a ChoiceGame's options (a wrong one is forgiven) until the game is over. */
async function answerAll(page: Page, game: string) {
  const root = page.locator(`[data-game="${game}"]`);
  await expect(root).toBeVisible({ timeout: 10_000 });
  for (let n = 0; n < 120; n++) {
    if ((await root.count()) === 0) return;
    const opt = root.locator(".anim-rise button:not([disabled])").first();
    await opt.click({ timeout: 2_000 }).catch(() => {});
    await page.waitForTimeout(120);
  }
  throw new Error(`${game} didn't end`);
}

/** The splash before each step goes away with a tap. */
async function skipSplash(page: Page) {
  // It also closes by itself after a moment, so it may be gone already.
  const splash = page.locator("[data-splash]");
  await splash.click({ timeout: 3_000 }).catch(() => {});
  await expect(splash).toHaveCount(0);
}

const stepsBar = (page: Page) => page.getByRole("navigation", { name: "שלבי התחנה" });

test("the nikud map shows all 6 worlds, each opens its own map with a 📚 stories tile", async ({ page }) => {
  await seedChild(page);
  await page.goto("/play/nikud");
  await expect(page.locator("[data-nikud-world]")).toHaveCount(6);
  for (const w of NIKUD_WORLDS) {
    await page.goto(`/play/nikud/${w.id}`);
    await expect(page.getByRole("heading", { name: w.mapTitle })).toBeVisible();
    for (const s of w.stations) await expect(page.locator(`a[href="/play/nikud/${w.id}/${s.id}"]`)).toBeVisible();
    await expect(page.locator(`a[href="/play/stories/${w.id}"]`)).toBeVisible();
  }
});

test("the old kamatz address still works", async ({ page }) => {
  await seedChild(page);
  await page.goto("/play/kamatz-patach/k2");
  await expect(page).toHaveURL(/\/play\/nikud\/kamatz-patach\/k2$/);
  await skipSplash(page);
  await expect(stepsBar(page)).toBeVisible();
});

test("every station of every world opens", async ({ page }) => {
  await seedChild(page);
  for (const w of NIKUD_WORLDS)
    for (const s of w.stations) {
      await page.goto(`/play/nikud/${w.id}/${s.id}`);
      await skipSplash(page);
      await expect(page.locator('[aria-current="step"]')).toBeVisible();
    }
});

test("the surprise can't be opened before every step is finished", async ({ page }) => {
  await seedChild(page);
  await page.goto("/play/nikud/holam/o2");
  await skipSplash(page);
  const prize = stepsBar(page).getByRole("button").last();
  await expect(prize).toContainText("🔒");
  await prize.click();
  await expect(page.locator('[aria-current="step"]')).toContainText("לוֹמְדִים");
  // Doing just one game doesn't open it either.
  await stepsBar(page).getByRole("button", { name: "שׁוֹמְעִים" }).click();
  await skipSplash(page);
  await answerAll(page, "find");
  await skipSplash(page);
  await expect(stepsBar(page).getByRole("button").last()).toContainText("🔒");
});

test("a whole syllables station: meet the vowel, build, blend, find, first sound, then the surprise", async ({ page }) => {
  await seedChild(page);
  await page.goto("/play/nikud/tsere-segol/e1");

  // 📖 learn: meet the two marks, then build each syllable (tap the mark, it lands under the letter).
  await skipSplash(page);
  await expect(page.getByRole("button", { name: "צֵירֵה" })).toBeVisible();
  await page.getByRole("button", { name: "הבא" }).click();
  for (let i = 0; i < 4; i++) {
    await page.getByRole("button", { name: /^להוסיף/ }).click({ force: true });
    await expect(page.locator("[data-built]")).toBeVisible();
    if (i < 3) await page.getByRole("button", { name: "הבא" }).click();
  }
  await page.getByRole("button", { name: "לַמִּשְׂחָק! 🎯" }).click();

  // 🐢 → 🐇 blend each syllable.
  await skipSplash(page);
  for (let i = 0; i < 4; i++) {
    await page.getByRole("button", { name: "לאט" }).click();
    await expect(page.locator('[data-phase="joined"]')).toBeVisible({ timeout: 5_000 });
    await page.getByRole("button", { name: "מהר" }).click();
    await expect(page.locator('[data-phase="done"]')).toBeVisible();
    await page.getByRole("button", { name: i < 3 ? "הבא" : "סיימנו" }).click();
  }

  // 👂 find, 🖼️ first sound.
  await skipSplash(page);
  await answerAll(page, "find");
  await skipSplash(page);
  await expect(stepsBar(page).getByRole("button").last()).toContainText("🔒");
  await answerAll(page, "starts");

  // 🎁 now open: tap the egg.
  await skipSplash(page);
  await page.getByRole("button", { name: WORLDS.garden.surprise.label }).click({ force: true });
  await expect(page.getByRole("link", { name: /לַתַּחֲנָה הַבָּאָה/ })).toBeVisible({ timeout: 10_000 });
  const done = await page.evaluate(() => JSON.parse(localStorage.getItem("grade-a-prepare:v1")!).children[0].done);
  expect(done).toContain("tsere-segol/e1");
  const items = await page.evaluate(() => JSON.parse(localStorage.getItem("grade-a-prepare:v1")!).children[0].items);
  expect(Object.keys(items).some((k) => k.startsWith("syl:e-"))).toBe(true);
});

test("the reading-words station: read together, read alone, the surprise, then 📚 stories", async ({ page }) => {
  await seedChild(page);
  await page.goto("/play/nikud/shva/v4");
  await skipSplash(page);
  // Tap a chip, then 🐢 and 🐇.
  await page.locator("[data-chip]").first().click();
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "הבא" }).click();
  await page.getByRole("button", { name: "לִקְרֹא לְבַד! 🔍" }).click();
  await skipSplash(page);
  await answerAll(page, "read");
  await skipSplash(page);
  await page.getByRole("button", { name: WORLDS.garden.surprise.label }).click({ force: true });
  await expect(page.getByRole("link", { name: /לַסִּפּוּרִים/ })).toHaveAttribute("href", "/play/stories/shva", { timeout: 10_000 });
  const items = await page.evaluate(() => JSON.parse(localStorage.getItem("grade-a-prepare:v1")!).children[0].items);
  expect(Object.keys(items).filter((k) => k.startsWith("read:")).length).toBe(8);
});
