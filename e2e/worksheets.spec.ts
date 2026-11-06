import { expect, test, type Page } from "@playwright/test";
import { LETTER_STATIONS, LETTERS } from "../src/content/letters";
import { NIKUD_WORLDS } from "../src/content/nikud";
import { checkText, type Vowel } from "../src/lib/decodable";
import { buildBundle, buildSheets, parseSource, sourceKey, typesFor, type WsSource } from "../src/content/worksheets";
import { seedChild } from "./helpers";

// 📄 Printable worksheets (/print): every sheet type renders, each sheet is exactly one A4 page and nothing
// spills off it, the content is sound (decodable sentences, matched pictures), and parents can reach it.

const ALL_SOURCES: WsSource[] = [
  ...LETTER_STATIONS.map((s) => parseSource(`letters:${s.id}`)!),
  ...LETTERS.map((l) => parseSource(`letter:${l.id}`)!),
  ...NIKUD_WORLDS.flatMap((w) => [
    parseSource(`nikud:${w.id}`)!,
    ...w.stations.filter((s) => s.kind === "syllables").map((s) => parseSource(`nikud:${w.id}:${s.id}`)!),
  ]),
];

test("every source builds every sheet type, with nothing missing", () => {
  for (const src of ALL_SOURCES) {
    for (const t of typesFor(src)) {
      const sheets = buildSheets(src, t);
      expect(sheets.length, `${sourceKey(src)} ${t}`).toBeGreaterThan(0);
      for (const s of sheets) {
        const where = `${sourceKey(src)} ${t}`;
        if (s.type === "find") for (const b of s.boxes) expect(b.cells.filter((c) => b.targets.includes(c)).length, where).toBeGreaterThan(4);
        if (s.type === "match" || s.type === "nikud") {
          expect(s.rows.length, where).toBeGreaterThanOrEqual(4);
          expect(s.tokens.length, where).toBe(s.rows.length);
          // Each picture's word starts with exactly one of the offered letters / syllables.
          for (const r of s.rows) expect(s.tokens.filter((tk) => r.word.normalize("NFC").startsWith(tk.normalize("NFC"))), `${where} ${r.word}`).toHaveLength(1);
        }
        if (s.type === "nikud") {
          expect(s.missing.length, where).toBeGreaterThanOrEqual(4);
          for (const m of s.missing) expect((m.before + m.answer + m.after).normalize("NFC")).not.toBe("");
        }
        if (s.type === "color") for (const k of s.keys) expect(k.token, where).toBeTruthy();
        if (s.type === "read") {
          expect(s.sentences.length, where).toBe(3);
          const w = (src as Extract<WsSource, { kind: "nikud" }>).worldId;
          for (const sent of s.sentences) expect(checkText(sent, w as Vowel), sent).toEqual([]);
        }
        if (s.type === "cut") {
          expect(s.words.length, where).toBeGreaterThanOrEqual(2);
          expect(s.tiles.length, where).toBe(s.words.reduce((n, x) => n + x.tiles.length, 0));
          for (const x of s.words) expect(x.tiles.join("").normalize("NFC"), where).toBe(x.word.normalize("NFC"));
        }
      }
    }
  }
});

/** Every sheet on the page keeps its content inside the A4 box (nothing cut off on paper). */
async function expectSheetsFit(page: Page) {
  const overflow = await page.locator(".ws-sheet").evaluateAll((els) =>
    els.map((el) => el.scrollHeight - el.clientHeight).filter((d) => d > 1),
  );
  expect(overflow).toEqual([]);
}

const CASES: [string, string[]][] = [
  ["letter:bet", ["write", "find", "match", "color", "cut"]],
  ["letter:tsadi-sofit", ["write", "find", "match", "color", "cut"]],
  ["nikud:hiriq", ["find", "nikud", "color", "read", "cut"]],
  ["nikud:holam:o1", ["find", "nikud", "color", "read", "cut"]],
];

for (const [src, types] of CASES) {
  test(`every sheet type renders on A4: ${src}`, async ({ page }) => {
    await seedChild(page);
    for (const type of types) {
      await page.goto(`/print?src=${encodeURIComponent(src)}&type=${type}`);
      const sheet = page.locator(`.ws-sheet[data-sheet="${type}"]`);
      await expect(sheet.first()).toBeVisible();
      await expect(page.locator(".ws-sheet")).toHaveCount(buildSheets(parseSource(src)!, type as never).length);
      await expectSheetsFit(page);
    }
  });
}

test("the writing sheet: a model with numbered start dots, rows to trace and rows to write alone", async ({ page }) => {
  await page.goto("/print?src=letter:kaf-sofit&type=write");
  const sheet = page.locator('.ws-sheet[data-sheet="write"]');
  await expect(sheet.locator("[data-model]")).toBeVisible();
  await expect(sheet.locator("[data-row]")).toHaveCount(6);
  await expect(sheet.getByText("כּוֹתְבִים לְבַד")).toBeVisible();
  // The old one-letter page still works.
  await page.goto("/print/bet");
  await expect(page.locator('.ws-sheet[data-sheet="write"] [data-model]')).toBeVisible();
});

test("one A4 page per sheet in the PDF (a whole bundle)", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "page.pdf() is Chromium only");
  await seedChild(page);
  for (const src of ["letters:s1", "nikud:kamatz-patach", "nikud:shva"]) {
    await page.goto(`/print?src=${encodeURIComponent(src)}&type=all`);
    const n = buildBundle(parseSource(src)!).length;
    await expect(page.locator(".ws-sheet")).toHaveCount(n);
    await page.evaluate(() => document.fonts.ready);
    await page.emulateMedia({ media: "print" });
    await expectSheetsFit(page);
    const pdf = await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true });
    const pages = pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g)?.length;
    expect(pages, src).toBe(n);
  }
});

test("parents find the worksheets, and the bundle is the child's current station", async ({ page }) => {
  await seedChild(page, { done: ["letters/s1"] });
  await page.goto("/parents");
  await page.getByRole("textbox").fill("17");
  await page.getByRole("button", { name: "כניסה" }).click();
  await page.locator("[data-worksheets]").getByRole("link", { name: /החבילה של/ }).click();
  await expect(page).toHaveURL(/\/print\?src=letters%3As2&type=all/);
  await expect(page.locator(".ws-sheet")).toHaveCount(buildBundle(parseSource("letters:s2")!).length);
  await expect(page.getByRole("button", { name: /כל הדפים לתחנה של/ })).toBeVisible();

  // Picking another sheet in the builder updates the preview.
  await page.getByRole("tab", { name: "ניקוד" }).click();
  await page.getByRole("button", { name: /קוראים ומציירים/ }).click();
  await expect(page.locator('.ws-sheet[data-sheet="read"]')).toHaveCount(1);
  await expect(page.locator("[data-sentence]")).toHaveCount(3);
});

test("a 📄 tile on the letters map and on a nikud world map", async ({ page }) => {
  await seedChild(page);
  await page.goto("/play/letters");
  await expect(page.locator("[data-worksheets-tile]")).toHaveAttribute("href", "/print?src=letters:s1&type=all");
  await page.goto("/play/nikud/hiriq");
  await expect(page.locator("[data-worksheets-tile]")).toHaveAttribute("href", /\/print\?src=nikud%3Ahiriq%3Ai1&type=all/);
  await page.locator("[data-worksheets-tile]").click();
  await expect(page.locator('.ws-sheet[data-sheet="nikud"]')).toHaveCount(1);
});
