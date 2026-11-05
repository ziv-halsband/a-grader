import { expect, test } from "@playwright/test";
import { scribbleStroke, seedChild, strokesOnScreen } from "./helpers";

// Founder, 5 Nov: "we can't win there". A shaky, fast finger that lifts early must still win trace and alone.
for (const letter of ["he", "alef", "shin"]) {
  test(`a child's finger can write ${letter} (trace, then alone)`, async ({ page }) => {
    await seedChild(page, { items: { [`write:${letter}`]: { firstTry: 1, withHelp: 0, misses: 0, lastFirstTry: true } } });
    await page.goto(`/play/letters/write/${letter}`);
    const rounds = page.getByLabel("שלבי הכתיבה");
    await expect(rounds).toContainText("✅"); // watch skipped (written before) → trace

    for (const round of [2, 3]) {
      const strokes = await strokesOnScreen(page);
      for (const s of strokes) await scribbleStroke(page, s);
      await expect(rounds.locator("span").nth(round - 1)).toHaveText("✅", { timeout: 5000 });
    }
  });
}
