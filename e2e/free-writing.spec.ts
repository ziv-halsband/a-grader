import { expect, test, type Page } from "@playwright/test";
import { scoreFreehand, type Pt } from "../src/content/writing";
import { seedChild } from "./helpers";
import { kidLetter, LETTER_IDS, loops, wander, zigzag } from "./synthetic";

// 🖍️ The free-writing check (founder, 6 Nov: "messy or wrong shapes still pass"). Stricter, but a real
// 5-year-old's wobbly-but-right letter must still win. Synthetic children's letters: see e2e/synthetic.ts.

const SEEDS = Array.from({ length: 20 }, (_, i) => i + 1);
const passRate = (asked: string, make: (seed: number) => Pt[][]) =>
  SEEDS.filter((s) => scoreFreehand(asked, make(s)).pass).length / SEEDS.length;

test.describe("the free-writing check (no browser)", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "pure logic: run once");

  test("a shaky, right letter passes (every letter)", () => {
    const rates = LETTER_IDS.map((id) => [id, passRate(id, (s) => kidLetter(id, s))] as const);
    for (const [id, r] of rates) expect(r, `${id} shaky pass rate`).toBeGreaterThanOrEqual(0.75);
    expect(rates.reduce((a, [, r]) => a + r, 0) / rates.length).toBeGreaterThan(0.9);
  });

  test("a too-small or off-center but right letter passes", () => {
    for (const id of ["alef", "gimel", "dalet", "he", "het", "lamed", "mem", "shin", "tav", "bet"]) {
      expect(passRate(id, (s) => kidLetter(id, s + 2000, { scale: 0.55, dx: -14, dy: 6 })), id).toBeGreaterThanOrEqual(0.6);
      expect(passRate(id, (s) => kidLetter(id, s + 3000, { mess: 0.5, scale: 0.7, dx: 12, dy: -6 })), id).toBeGreaterThanOrEqual(0.9);
    }
    // A neat letter written in the corner, half size: no problem.
    expect(scoreFreehand("dalet", kidLetter("dalet", 7, { mess: 0, scale: 0.5, dx: -20, dy: 10 })).pass).toBe(true);
  });

  test("scribbles fail", () => {
    for (const id of LETTER_IDS.filter((id) => !["vav", "yod", "nun-sofit"].includes(id))) {
      expect(passRate(id, (s) => zigzag(id, s)), `${id} zigzag`).toBeLessThanOrEqual(0.1);
      expect(passRate(id, (s) => wander(s)), `${id} wander`).toBeLessThanOrEqual(0.15);
    }
    for (const id of ["alef", "bet", "dalet", "he", "shin"]) expect(passRate(id, (s) => loops(s)), id).toBe(0);
  });

  test("a lookalike fails: ר for ד, כ for ב, ח for ה, ז for ו (and back)", () => {
    const pairs = [
      ["dalet", "resh"],
      ["resh", "dalet"],
      ["bet", "kaf"],
      ["kaf", "bet"],
      ["he", "het"],
      ["het", "he"],
      ["vav", "zayin"],
      ["zayin", "vav"],
    ];
    // A careful child's lookalike (little wobble) almost never passes; a very messy one rarely does.
    for (const [asked, drawn] of pairs) {
      expect(passRate(asked, (s) => kidLetter(drawn, s + 900, { mess: 0.4 })), `${asked}←${drawn}`).toBeLessThanOrEqual(0.05);
      expect(passRate(asked, (s) => kidLetter(drawn, s + 900)), `${asked}←${drawn}`).toBeLessThanOrEqual(0.2);
    }
    const r = scoreFreehand("dalet", kidLetter("resh", 3, { mess: 0.3 }));
    expect(r.pass).toBe(false);
  });

  test("other wrong letters fail too", () => {
    for (const [asked, drawn] of [
      ["alef", "shin"],
      ["gimel", "nun"],
      ["yod", "vav"],
      ["vav", "nun-sofit"],
      ["nun-sofit", "vav"],
      ["resh", "kaf-sofit"],
      ["tet", "samekh"],
      ["lamed", "kaf"],
    ]) {
      expect(passRate(asked, (s) => kidLetter(drawn, s + 500, { mess: 0.5 })), `${asked}←${drawn}`).toBeLessThanOrEqual(0.15);
    }
  });

  test("a missing stroke fails and lights up that stroke", () => {
    const he = kidLetter("he", 4, { mess: 0.4 });
    const r = scoreFreehand("he", [he[0]]); // ה without its leg is ר
    expect(r.pass).toBe(false);
    expect(r.hintStroke).toBe(1);
    expect(r.covered[1].filter((c) => !c).length).toBeGreaterThan(r.covered[1].length / 2);
  });
});

// ── In the app ──

const board = (page: Page) => page.locator('svg[aria-label^="כתיבת"]');

/** The child's finger drawing strokes given in the board's 100×100 box. */
async function drawBox(page: Page, strokes: Pt[][]) {
  const box = (await board(page).boundingBox())!;
  for (const s of strokes) {
    const pts = s.map((p) => ({ x: box.x + (p.x / 100) * box.width, y: box.y + (p.y / 100) * box.height }));
    await page.mouse.move(pts[0].x, pts[0].y);
    await page.mouse.down();
    for (const p of pts.slice(1)) await page.mouse.move(p.x, p.y, { steps: 2 });
    await page.mouse.up();
  }
}

/** Straight to free writing: a letter written before, in the name writer (👀 → 🖍️). */
async function openFree(page: Page, letterId: string) {
  // The child's name is the letter itself, so the name writer opens straight on free writing.
  const names: Record<string, string> = { dalet: "ד", bet: "ב", gimel: "ג" };
  await seedChild(page, {
    nickname: names[letterId],
    items: { [`write:${letterId}`]: { firstTry: 1, withHelp: 0, misses: 0, lastFirstTry: true } },
  });
  await page.goto("/play/letters/write/name");
  await board(page).waitFor();
}

const check = (page: Page) => page.getByRole("button", { name: /סִיַּמְתִּי/ });

test("🖍️ a wobbly right letter wins: the neat letter draws itself over it and gets a star", async ({ page }) => {
  await openFree(page, "gimel");
  await drawBox(page, kidLetter("gimel", 11));
  await check(page).click();
  await expect(page.getByLabel("כוכב")).toBeVisible();
  await expect(page.getByRole("button", { name: /הָלְאָה/ })).toBeVisible();
});

test("🖍️ a scribble doesn't pass: the letter shows faintly and the hand shows where to start", async ({ page }) => {
  await openFree(page, "bet");
  await drawBox(page, zigzag("bet", 3));
  await check(page).click();
  await expect(page.getByLabel("כוכב")).toHaveCount(0);
  await expect(board(page).locator(".anim-glow-soft")).not.toHaveCount(0);
  await expect(page.locator("span.anim-point").first()).toBeVisible();
  // Never a "wrong" word on screen.
  await expect(page.getByText(/טָעוּת|לֹא נָכוֹן|שָׁגוּי/)).toHaveCount(0);
});

test("🖍️ ר written when asked ד doesn't pass; then a real ד does", async ({ page }) => {
  await openFree(page, "dalet");
  await drawBox(page, kidLetter("resh", 5, { mess: 0.4 }));
  await check(page).click();
  await expect(board(page).locator(".anim-glow-soft")).not.toHaveCount(0);
  await expect(page.getByLabel("כוכב")).toHaveCount(0);

  await page.getByRole("button", { name: "למחוק ולהתחיל מחדש" }).click();
  await drawBox(page, kidLetter("dalet", 5));
  await check(page).click();
  await expect(page.getByLabel("כוכב")).toBeVisible();
});
