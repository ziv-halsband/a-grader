// Tunes the free-writing check: how often a child's right letter passes, and how often wrong things pass.
// Run: node scripts/tune-writing.ts   (prints pass rates; no files written)
import { scoreFreehand } from "../src/content/writing.ts";
import { kidLetter, LETTER_IDS, loops, wander, zigzag } from "../e2e/synthetic.ts";

const N = 40;
const DESC = new Set(["qof", "kaf-sofit", "nun-sofit", "pe-sofit", "tsadi-sofit"]);
const verbose = process.argv.includes("-v");
const rate = (f: (seed: number) => boolean) => {
  let n = 0;
  for (let s = 1; s <= N; s++) if (f(s)) n++;
  return n / N;
};
const pass = (id: string, ink: ReturnType<typeof kidLetter>) => scoreFreehand(id, ink).pass;

console.log("Right letter (should pass): typical / very wobbly / small 0.55 off-center / big 1.2");
const lows: string[] = [];
let sum = 0;
for (const id of LETTER_IDS) {
  const a = rate((s) => pass(id, kidLetter(id, s)));
  const b = rate((s) => pass(id, kidLetter(id, s + 1000, { mess: 1.4 })));
  const c = rate((s) => pass(id, kidLetter(id, s + 2000, { scale: 0.55, dx: -12, dy: DESC.has(id) ? 22 : 4 })));
  const d = rate((s) => pass(id, kidLetter(id, s + 3000, { scale: 1.2, dy: -3 })));
  sum += a + b + c + d;
  const line = `${id.padEnd(12)} ${[a, b, c, d].map((x) => x.toFixed(2)).join("  ")}`;
  if (verbose || Math.min(a, b, c, d) < 0.9) lows.push(line);
}
console.log(lows.join("\n"));
console.log(`mean right-pass ${(sum / LETTER_IDS.length / 4).toFixed(3)}\n`);

console.log("Wrong letter that passes (asked → drawn: rate), above 0.1:");
let wrong = 0;
let pairs = 0;
const bad: string[] = [];
for (const asked of LETTER_IDS) {
  for (const drawn of LETTER_IDS) {
    if (asked === drawn) continue;
    const x = rate((s) => pass(asked, kidLetter(drawn, s + 5000)));
    wrong += x;
    pairs++;
    if (x > 0.1) bad.push(`${asked}←${drawn} ${x.toFixed(2)}`);
  }
}
console.log(bad.join(", "));
console.log(`mean wrong-pass ${(wrong / pairs).toFixed(4)}\n`);


const scrBad: string[] = [];
for (const id of LETTER_IDS) {
  const z = rate((s) => pass(id, zigzag(id, s)));
  const l = rate((s) => pass(id, loops(s)));
  const w = rate((s) => pass(id, wander(s)));
  const stray = rate((s) => pass(id, [...kidLetter(id, s + 7000), [{ x: 6, y: 8 }, { x: 14, y: 16 }, { x: 8, y: 22 }, { x: 18, y: 26 }]]));

  if (z + l + w > 0 || stray > 0.2) scrBad.push(`${id} zig ${z} loop ${l} wander ${w} +stray ${stray}`);
}
console.log("Scribbles that pass:", scrBad.length ? "\n" + scrBad.join("\n") : "none");

console.log("\nAfter two misses (easier): very wobbly right letter / scribbles / lookalikes");
let e = 0;
let ez = 0;
for (const id of LETTER_IDS) {
  e += rate((s) => scoreFreehand(id, kidLetter(id, s + 1000, { mess: 1.4 }), { easier: true }).pass);
  ez += rate((s) => scoreFreehand(id, zigzag(id, s), { easier: true }).pass) + rate((s) => scoreFreehand(id, wander(s), { easier: true }).pass);
}
console.log(`wobbly pass ${(e / LETTER_IDS.length).toFixed(3)}, scribble pass ${(ez / LETTER_IDS.length / 2).toFixed(3)}`);
for (const [a, b] of [["dalet", "resh"], ["bet", "kaf"], ["he", "het"], ["vav", "zayin"]]) {
  console.log(`${a}←${b} ${rate((s) => scoreFreehand(a, kidLetter(b, s + 5000), { easier: true }).pass).toFixed(2)}`);
}
