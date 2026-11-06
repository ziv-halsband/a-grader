import type { Page } from "@playwright/test";

const KEY = "grade-a-prepare:v1";

/** A fresh test child saved before the page loads (buddy picked, tour seen), so a test starts where it needs to. */
export async function seedChild(page: Page, extra: Record<string, unknown> = {}) {
  const child = {
    id: "e2e",
    nickname: "בדיקה",
    gender: "f",
    worldId: "garden",
    createdAt: new Date().toISOString(),
    letters: {},
    items: {},
    done: [],
    stickers: [],
    buddy: "unicorn",
    starter: "unicorn",
    tourSeen: true,
    ...extra,
  };
  await page.addInitScript(
    ([key, value]) => {
      if (!window.localStorage.getItem(key)) window.localStorage.setItem(key, value);
    },
    [KEY, JSON.stringify({ version: 1, children: [child], activeChildId: child.id })] as const,
  );
}

/** The writing board's strokes as screen points (from the drawn letter track), in drawing order. */
export async function strokesOnScreen(page: Page): Promise<{ x: number; y: number }[][]> {
  return page.evaluate(() => {
    const svg = document.querySelector('svg[aria-label^="כתיבת"]') as SVGSVGElement;
    const m = svg.getScreenCTM()!;
    return [...svg.querySelectorAll("polyline[data-track]")].map((pl) =>
      pl
        .getAttribute("points")!
        .split(" ")
        .map((xy) => {
          const [x, y] = xy.split(",").map(Number);
          const p = new DOMPoint(x, y).matrixTransform(m);
          return { x: p.x, y: p.y };
        }),
    );
  });
}

/**
 * A child's finger: few move events (like Safari on an iPad), a little wobble, and lifting a bit before the end.
 */
export async function scribbleStroke(page: Page, pts: { x: number; y: number }[], { stopAt = 0.88, wobble = 5 } = {}) {
  const end = Math.max(2, Math.floor(pts.length * stopAt));
  const step = Math.max(1, Math.floor(end / 6));
  await page.mouse.move(pts[0].x, pts[0].y);
  await page.mouse.down();
  for (let i = step; i < end; i += step) {
    const j = (Math.random() * 2 - 1) * wobble;
    await page.mouse.move(pts[i].x + j, pts[i].y - j);
  }
  await page.mouse.move(pts[end - 1].x, pts[end - 1].y);
  await page.mouse.up();
}
