// Story read-along audio: one mp3 per page (and per question) + each word's start/end time, so the reader can
// light up words as they're said (karaoke) and play just one word when it's tapped (no extra credits per word).
// Uses ElevenLabs text-to-speech *with timestamps* (character alignment), same voice/model/env as gen-elevenlabs-audio.ts.
//
// Run:  npm run audio:stories                     # pages that are missing or whose text changed
//       npm run audio:stories -- --dry            # only count characters (credits)
//       npm run audio:stories -- --only kamatz-patach-1/2,hiriq-3/q   # (re)generate these pages
//       npm run audio:stories -- --story holam-2  # every page of one story
//       npm run audio:stories -- --story i-read/a-1   # every line of one library book (📗 אֲנִי קוֹרֵא)
//       npm run audio:stories -- --library        # only the library books (content/library.ts)
//       ELEVEN_VOICE_ID=... npm run audio:stories # another voice (e.g. mom's clone)
//
// Writes public/audio/stories/<story>-<page>.mp3 (library: i-read-<book>-<page>-<line>.mp3) and src/content/story-audio.json.
// Refuses to run if a story isn't decodable (lib/decodable.ts): no credits spent on text mom will send back.
// Needs ELEVENLABS_API_KEY in .env (never committed).

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { STORIES, storyAudioItems, storyWords } from "../src/content/stories.ts";
import { bookTexts, LIBRARY, libraryAudioItems } from "../src/content/library.ts";
import { checkStage, checkText } from "../src/lib/decodable.ts";

/** Per page: the text it was made from (hash), the file, and [start, end] seconds per word (as storyWords splits it). */
type Entry = { text: string; hash: string; file: string; source: string; words: [number, number][] };
type Alignment = { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] };

const root = join(import.meta.dirname, "..");
const manifestPath = join(root, "src", "content", "story-audio.json");
const outDir = join(root, "public", "audio", "stories");
if (existsSync(join(root, ".env"))) process.loadEnvFile(join(root, ".env"));

const KEY = process.env.ELEVENLABS_API_KEY;
const VOICE = process.env.ELEVEN_VOICE_ID ?? "EXAVITQu4vr4xnSDxMaL"; // Sarah (stock): temporary until mom's clone
const MODEL = process.env.ELEVEN_MODEL ?? "eleven_v3";
const args = process.argv.slice(2);
const dry = args.includes("--dry");
const arg = (name: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const only = arg("--only") ? new Set(arg("--only")!.split(",")) : null;
const storyOnly = arg("--story");

// 1. Every story must be decodable before we spend anything.
const problems = [
  ...STORIES.flatMap((s) =>
    [s.title, ...s.pages.map((p) => p.text), s.question.text].flatMap((t) => checkText(t, s.world).map((p) => `${s.id}: ${p}`)),
  ),
  ...LIBRARY.flatMap((b) => bookTexts(b).flatMap((t) => checkStage(t, b.stage).map((p) => `i-read/${b.id}: ${p}`))),
];
if (problems.length) {
  console.error(`Not decodable, fix content/stories.ts first:\n  ${problems.join("\n  ")}`);
  process.exit(1);
}

const manifest: Record<string, Entry> = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : {};
const hash = (s: string) => createHash("sha1").update(s).digest("hex").slice(0, 10);
const fileOf = (key: string) => `${key.replaceAll("/", "-")}.mp3`;
const items = [...storyAudioItems(), ...libraryAudioItems()];
const libraryOnly = args.includes("--library");

const todo = items.filter(({ key, text }) => {
  if (only) return only.has(key);
  if (storyOnly) return key.startsWith(`${storyOnly}/`);
  if (libraryOnly && !key.startsWith("i-read/")) return false;
  const prev = manifest[key];
  return !prev || prev.hash !== hash(text) || !existsSync(join(outDir, prev.file));
});

// Drop pages that no longer exist (a story got shorter or was removed).
const keys = new Set(items.map((i) => i.key));
for (const key of Object.keys(manifest)) {
  if (keys.has(key)) continue;
  if (!dry) rmSync(join(outDir, manifest[key].file), { force: true });
  delete manifest[key];
}

const chars = todo.reduce((n, l) => n + l.text.length, 0);
const all = items.reduce((n, l) => n + l.text.length, 0);
const lib = libraryAudioItems().reduce((n, l) => n + l.text.length, 0);
console.log(
  `${todo.length} of ${items.length} pages/lines, ${chars} characters (≈ credits; everything: ${all}, of it the library: ${lib}) · voice ${VOICE} · model ${MODEL}`,
);
if (dry || !todo.length) process.exit(0);
if (!KEY) throw new Error("ELEVENLABS_API_KEY is missing in .env");
mkdirSync(outDir, { recursive: true });

async function ttsTimed(text: string): Promise<{ audio: Buffer; alignment?: Alignment }> {
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}/with-timestamps?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": KEY!, "content-type": "application/json" },
    body: JSON.stringify({
      text,
      model_id: MODEL,
      language_code: "he",
      // A little slower and steadier than the guide lines: children read along.
      voice_settings: { stability: 0.6, similarity_boost: 0.75, speed: 0.9 },
    }),
  });
  if (!r.ok) throw new Error(`TTS ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const j = (await r.json()) as { audio_base64: string; alignment?: Alignment; normalized_alignment?: Alignment };
  return { audio: Buffer.from(j.audio_base64, "base64"), alignment: j.alignment ?? j.normalized_alignment };
}

const isLetter = (c: string) => /[א-ת]/.test(c);

/**
 * Word times from the character alignment. The alignment usually has the input's characters one to one;
 * if not, match on Hebrew letters only (marks and punctuation dropped); as a last resort spread by length.
 */
function wordTimes(text: string, al: Alignment | undefined, duration: number): [number, number][] {
  const words = storyWords(text);
  // Each word's [first, last] index in `text`, counting only letters ("!" and nikud don't need a time).
  const ranges: [number, number][] = [];
  let from = 0;
  for (const w of words) {
    const at = text.indexOf(w, from);
    from = at + w.length;
    const idx = [...w].map((c, i) => (isLetter(c) ? at + i : -1)).filter((i) => i >= 0);
    ranges.push([idx[0] ?? at, idx.at(-1) ?? at + w.length - 1]);
  }
  const r2 = (n: number) => Math.round(n * 1000) / 1000;
  if (al && al.characters.join("") === text) {
    return ranges.map(([a, b]) => [r2(al.character_start_times_seconds[a]), r2(al.character_end_times_seconds[b])]);
  }
  if (al) {
    // Letters only, on both sides.
    const textLetters = [...text].map((c, i) => [c, i] as const).filter(([c]) => isLetter(c));
    const alLetters = al.characters.map((c, i) => [c, i] as const).filter(([c]) => isLetter(c));
    if (textLetters.map(([c]) => c).join("") === alLetters.map(([c]) => c).join("")) {
      const pos = new Map(textLetters.map(([, ti], k) => [ti, alLetters[k][1]]));
      return ranges.map(([a, b]) => [
        r2(al.character_start_times_seconds[pos.get(a)!]),
        r2(al.character_end_times_seconds[pos.get(b)!]),
      ]);
    }
    console.warn(`   alignment doesn't match the text, spreading by length: ${text}`);
  }
  const total = words.reduce((n, w) => n + w.length, 0);
  let t = 0;
  return words.map((w) => {
    const d = (duration * w.length) / total;
    const span: [number, number] = [r2(t), r2(t + d)];
    t += d;
    return span;
  });
}

for (const [i, { key, text }] of todo.entries()) {
  const { audio, alignment } = await ttsTimed(text);
  const duration = alignment?.character_end_times_seconds.at(-1) ?? 3;
  const words = wordTimes(text, alignment, duration);
  const file = fileOf(key);
  writeFileSync(join(outDir, file), audio);
  manifest[key] = { text, hash: hash(text), file, source: `elevenlabs:${MODEL}:${VOICE}`, words };
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`${i + 1}/${todo.length} ${key}  ${text}  ${words.map(([a, b]) => `${a}-${b}`).join(" ")}`);
}
console.log("done · listen to a few in the reader (🔊) before showing mom");
