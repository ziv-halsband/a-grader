// Generates voice lines with ElevenLabs (temporary stock voice now, mom's cloned voice later).
// Every clip is then transcribed (ElevenLabs speech-to-text) as an automatic "ear":
// if the transcript doesn't match the text, the line is flagged in the studio for a human to listen.
// Nothing is "approved" here: only mom approves, in the studio.
//
// Run:  npm run audio:eleven                 # all lines that are missing or still placeholder
//       npm run audio:eleven -- --dry        # only count characters (credits)
//       npm run audio:eleven -- --only syl-bet,letter-alef   # regenerate these lines
//       ELEVEN_VOICE_ID=... npm run audio:eleven             # another voice (e.g. mom's clone)
//
// Needs ELEVENLABS_API_KEY in .env (never committed).

import { createHash } from "node:crypto";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { VOICE_LINES } from "../src/content/voice.ts";

type Entry = {
  text: string;
  hash: string;
  status: "placeholder" | "generated" | "approved";
  source: string;
  file?: string;
  /** What speech-to-text heard, and whether it matches the text. */
  heard?: string;
  check?: "match" | "differs";
};

const root = join(import.meta.dirname, "..");
const manifestPath = join(root, "src", "content", "audio-manifest.json");
if (existsSync(join(root, ".env"))) process.loadEnvFile(join(root, ".env"));

const KEY = process.env.ELEVENLABS_API_KEY;
const VOICE = process.env.ELEVEN_VOICE_ID ?? "EXAVITQu4vr4xnSDxMaL"; // Sarah (stock): temporary until mom's clone
// eleven_v3 read the Hebrew test sentences with nikud correctly; v4 misread "אֵיפֹה הָאוֹת" (tested 4 Nov 2026).
const MODEL = process.env.ELEVEN_MODEL ?? "eleven_v3";
const args = process.argv.slice(2);
const dry = args.includes("--dry");
const only = args.includes("--only") ? new Set(args[args.indexOf("--only") + 1].split(",")) : null;

const manifest: Record<string, Entry> = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : {};
const hash = (s: string) => createHash("sha1").update(s).digest("hex").slice(0, 10);
/** Compare letters only: no nikud, punctuation or spaces; final letters folded. */
const bare = (s: string) =>
  s
    .replace(/[֑-ׇ'"׳״]/g, "")
    .replace(/[^א-ת]/g, "")
    .replace(/[ךםןףץ]/g, (c) => ({ ך: "כ", ם: "מ", ן: "נ", ף: "פ", ץ: "צ" })[c]!)
    .replace(/י/g, "")
    .replace(/ו/g, "");

const todo = VOICE_LINES.filter(({ id, text }) => {
  if (only) return only.has(id);
  const prev = manifest[id];
  if (!prev || prev.hash !== hash(text)) return true;
  return prev.status === "placeholder";
});

// Drop entries (and files) for lines that no longer exist.
const ids = new Set(VOICE_LINES.map((l) => l.id));
for (const id of Object.keys(manifest)) {
  if (ids.has(id)) continue;
  if (!dry) rmSync(join(root, "public", "audio", manifest[id].file ?? `${id}.m4a`), { force: true });
  delete manifest[id];
}
if (!dry) writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

const chars = todo.reduce((n, l) => n + (l.spoken ?? l.text).length, 0);
console.log(`${todo.length} lines, ${chars} characters (≈ credits) · voice ${VOICE} · model ${MODEL}`);
if (dry || !todo.length) process.exit(0);
if (!KEY) throw new Error("ELEVENLABS_API_KEY is missing in .env");

async function tts(text: string): Promise<Buffer> {
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": KEY!, "content-type": "application/json" },
    body: JSON.stringify({
      text,
      model_id: MODEL,
      language_code: "he",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });
  if (!r.ok) throw new Error(`TTS ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return Buffer.from(await r.arrayBuffer());
}

async function hear(audio: Buffer): Promise<string | undefined> {
  const fd = new FormData();
  fd.append("model_id", "scribe_v1");
  fd.append("language_code", "he");
  fd.append("file", new Blob([new Uint8Array(audio)]), "line.mp3");
  const r = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": KEY! },
    body: fd,
  });
  if (!r.ok) return undefined;
  return ((await r.json()) as { text?: string }).text;
}

let differs = 0;
for (const [i, l] of todo.entries()) {
  const audio = await tts(l.spoken ?? l.text);
  const file = `${l.id}.mp3`;
  writeFileSync(join(root, "public", "audio", file), audio);
  const prevFile = manifest[l.id]?.file ?? `${l.id}.m4a`;
  if (prevFile !== file) rmSync(join(root, "public", "audio", prevFile), { force: true });

  const heard = await hear(audio);
  // Short items (letters, syllables) are often transcribed as abbreviations; those still need a human ear.
  const check = heard !== undefined && bare(heard) === bare(l.text) ? "match" : "differs";
  if (check === "differs") differs++;
  manifest[l.id] = { text: l.text, hash: hash(l.text), status: "generated", source: `elevenlabs:${MODEL}:${VOICE}`, file, heard, check };
  console.log(`${i + 1}/${todo.length} ${check === "match" ? "✓" : "?"} ${l.id}  ${l.text}  →  ${heard ?? "(no transcript)"}`);
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
}
console.log(`done · ${differs} lines to check by ear in /studio`);
