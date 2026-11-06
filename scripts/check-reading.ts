// Quick content check while writing stories and library books (the e2e tests are the real gate).
// Run: node scripts/check-reading.ts
import { STORIES } from "../src/content/stories.ts";
import { bookTexts, LIBRARY, libraryAudioItems } from "../src/content/library.ts";
import { checkStage, checkText, VOWEL_SHAPES, vowelShapes } from "../src/lib/decodable.ts";

let bad = 0;
for (const s of STORIES) {
  const texts = [s.title, ...s.pages.map((p) => p.text), s.question.text];
  const probs = texts.flatMap((t) => checkText(t, s.world));
  if (probs.length) {
    bad++;
    console.log(s.id, probs);
  }
  if (s.world === "all-nikud") {
    const shapes = vowelShapes(s.pages.map((p) => p.text).join(" "));
    const missing = VOWEL_SHAPES.filter((v) => !shapes.has(v));
    if (missing.length) {
      bad++;
      console.log(s.id, "missing shapes:", missing);
    }
  }
}
const chars = STORIES.flatMap((s) => [...s.pages.map((p) => p.text), s.question.text]).join("").length;
console.log(`stories: ${STORIES.length}, ${chars} characters, ${bad} with problems`);

bad = 0;
for (const b of LIBRARY) {
  const probs = bookTexts(b).flatMap((t) => checkStage(t, b.stage));
  const graphemes = (s: string) => [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(s)].map((g) => g.segment);
  b.pages.forEach((p, i) => {
    if (p.say && !graphemes(p.pic).includes(p.say.who)) probs.push(`page ${i + 1}: speaker ${p.say.who} not in ${p.pic}`);
  });
  const quotes = new Set(b.pages.flatMap((p) => (p.say ? [p.say.text] : [])));
  for (const q of b.questions) if (q.kind === "who" && !quotes.has(q.quote)) probs.push(`quote not in book: ${q.quote}`);
  if (probs.length) {
    bad++;
    console.log(b.id, probs);
  }
}
const libChars = libraryAudioItems().reduce((n, i) => n + i.text.length, 0);
console.log(`library: ${LIBRARY.length} books, ${libChars} characters, ${bad} with problems`);
