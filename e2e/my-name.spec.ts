import { expect, test, type Page } from "@playwright/test";
import { nameText, nameWords } from "../src/content/myName";
import { strokesFor } from "../src/content/writing";
import { scribbleStroke, seedChild, strokesOnScreen } from "./helpers";

const known = (ids: string[]) =>
  Object.fromEntries(ids.map((id) => [`write:${id}`, { firstTry: 1, withHelp: 0, misses: 0, lastFirstTry: true }]));

/** The letter's own strokes on the writing board (free writing shows no track to read them from). */
async function letterOnScreen(page: Page, letterId: string) {
  const box = (await page.locator('svg[aria-label^="כתיבת"]').boundingBox())!;
  return strokesFor(letterId).map((s) =>
    s.map((p) => ({ x: box.x + (p.x / 100) * box.width, y: box.y + (p.y / 100) * box.height })),
  );
}

/** Writes the current letter freely (a child's wobbly finger), checks it, and moves on. */
async function writeFree(page: Page, letterId: string) {
  for (const s of await letterOnScreen(page, letterId)) await scribbleStroke(page, s, { stopAt: 0.95, wobble: 3 });
  await page.getByRole("button", { name: /סִיַּמְתִּי/ }).click();
  await page.getByRole("button", { name: /הָלְאָה/ }).click();
}

test("a name becomes letters to write: no nikud, finals at the end, spaces, no foreign marks", () => {
  expect(nameText("מִרְיָם")).toBe("מרים");
  expect(nameText("מרימ")).toBe("מרים"); // typed with a regular מ: written with ם
  expect(nameText("דָּנִיאֵל")).toBe("דניאל");
  expect(nameText("יוסף כהן")).toBe("יוסף כהן");
  expect(nameText("ג׳וני")).toBe("גוני");
  expect(nameText("Noa")).toBe("");
  expect(nameWords("מִרְיָם").flat().map((l) => l.letterId)).toEqual(["mem", "resh", "yod", "mem-sofit"]);
});

test("✍️ write my name: letter by letter, then the name in the child's own strokes", async ({ page }) => {
  // מ ר י written before (straight to free writing); ם is new (watch → trace → free).
  await seedChild(page, { nickname: "מִרְיָם", items: known(["mem", "resh", "yod"]) });
  await page.goto("/play/letters/write");
  const tile = page.getByRole("link", { name: /לכתוב את השם שלי/ });
  await expect(tile).toContainText("מרים");
  await tile.click();

  const strip = page.getByLabel("השם שלי: מרים", { exact: true });
  await expect(strip.locator(":scope > div > span")).toHaveCount(4);
  for (const id of ["mem", "resh", "yod"]) {
    await expect(strip.locator('[aria-current="true"]')).toBeVisible();
    await writeFree(page, id);
  }

  // ם: the pencil shows it, then trace (the track is on the board), then free writing.
  const rounds = page.getByLabel("שלבי הכתיבה");
  await expect(rounds.locator("span")).toHaveCount(3); // 👀 ✏️ 🖍️ (no ✍️ round in the name)
  await expect(rounds.locator("span").nth(0)).toHaveText("✅", { timeout: 15_000 });
  for (const s of await strokesOnScreen(page)) await scribbleStroke(page, s);
  await expect(rounds.locator("span").nth(1)).toHaveText("✅", { timeout: 5000 });
  await writeFree(page, "mem-sofit");

  // The signature, kept in the store.
  await expect(page.locator(`svg[aria-label^="השם מרים"]`).first()).toBeVisible();
  const sig = await page.evaluate(
    () => JSON.parse(localStorage.getItem("grade-a-prepare:v1")!).children[0].nameSignature,
  );
  expect(sig.name).toBe("מרים");
  expect(sig.letters).toHaveLength(4);

  // Back in the notebook the tile shows the signature with a star; the home card shows it too.
  await page.getByRole("link", { name: /הָלְאָה/ }).click();
  await expect(page.getByLabel("השם נכתב")).toBeVisible();
  await page.goto("/");
  await expect(page.locator(`svg[aria-label^="השם מרים"]`).first()).toBeVisible();
});

test("a child without Hebrew letters in the nickname gets no name tile", async ({ page }) => {
  await seedChild(page, { nickname: "Noa" });
  await page.goto("/play/letters/write");
  await expect(page.getByRole("link", { name: /לכתוב את האות/ }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /לכתוב את השם שלי/ })).toHaveCount(0);
});

test("the notebook lists letters in station order, finals grouped at the end, with ✓ and ⭐", async ({ page }) => {
  await seedChild(page, {
    unlockAll: true,
    items: { ...known(["bet"]), "write-free:gimel": { firstTry: 1, withHelp: 0, misses: 0, lastFirstTry: true } },
  });
  await page.goto("/play/letters/write");
  const letters = page.getByRole("link", { name: /לכתוב את האות/ });
  await expect(letters).toHaveCount(27);
  const names = await letters.evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
  expect(names[0]).toContain("אָלֶף");
  expect(names.slice(-5).every((n) => n?.includes("סוֹפִית"))).toBe(true);
  await expect(page.getByRole("link", { name: /בֵּית/ }).getByLabel("נכתבה", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /גִּימֶל/ }).getByLabel("נכתבה בכתיבה חופשית")).toBeVisible();
});

test("a palm resting on the board doesn't break the stroke being traced", async ({ page }) => {
  await seedChild(page, { items: known(["vav"]) });
  await page.goto("/play/letters/write/vav");
  const rounds = page.getByLabel("שלבי הכתיבה");
  const [s] = await strokesOnScreen(page);
  const mid = Math.floor(s.length / 2);
  await page.mouse.move(s[0].x, s[0].y);
  await page.mouse.down();
  for (let i = 4; i <= mid; i += 4) await page.mouse.move(s[i].x, s[i].y);
  // A second touch far from the letter lands and lifts, mid-stroke.
  await page.locator('svg[aria-label^="כתיבת"]').evaluate((svg) => {
    const r = svg.getBoundingClientRect();
    const o = { pointerId: 77, bubbles: true, clientX: r.left + 8, clientY: r.bottom - 8, pointerType: "touch" };
    svg.dispatchEvent(new PointerEvent("pointerdown", o));
    svg.dispatchEvent(new PointerEvent("pointerup", o));
  });
  for (let i = mid; i < s.length; i += 4) await page.mouse.move(s[i].x, s[i].y);
  await page.mouse.move(s[s.length - 1].x, s[s.length - 1].y);
  await page.mouse.up();
  await expect(rounds.locator("span").nth(1)).toHaveText("✅", { timeout: 5000 });
});
