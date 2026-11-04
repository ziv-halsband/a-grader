// Generates PLACEHOLDER audio for every voice line with the macOS Hebrew voice (Carmit).
// These are only so the prototype can be heard; they are NOT for children. They will be
// replaced by mom's ElevenLabs voice, and each file is marked "approved" only after mom listens.
//
// Run: npm run audio:placeholder   (macOS only; skips lines whose file and text are unchanged)

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { VOICE_LINES } from "../src/content/voice.ts";

type Entry = { text: string; hash: string; status: "placeholder" | "generated" | "approved"; source: string; file?: string };

const root = join(import.meta.dirname, "..");
const outDir = join(root, "public", "audio");
const manifestPath = join(root, "src", "content", "audio-manifest.json");
mkdirSync(outDir, { recursive: true });

const manifest: Record<string, Entry> = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, "utf8"))
  : {};

const hash = (s: string) => createHash("sha1").update(s).digest("hex").slice(0, 10);
let made = 0;

for (const { id, text, spoken } of VOICE_LINES) {
  const h = hash(text);
  const prev = manifest[id];
  // Never overwrite audio mom approved or that came from the real voice, unless its text changed.
  if (prev && prev.hash === h && existsSync(join(outDir, prev.file ?? `${id}.m4a`))) continue;
  if (prev && prev.status !== "placeholder" && prev.hash === h) continue;
  const file = join(outDir, `${id}.m4a`);

  const aiff = join(tmpdir(), `${id}.aiff`);
  execFileSync("say", ["-v", "Carmit", "-r", "150", "-o", aiff, spoken ?? text]);
  execFileSync("afconvert", ["-f", "m4af", "-d", "aac", aiff, file]);
  rmSync(aiff);
  if (prev?.file && prev.file !== `${id}.m4a`) rmSync(join(outDir, prev.file), { force: true });
  manifest[id] = { text, hash: h, status: "placeholder", source: "macos-carmit", file: `${id}.m4a` };
  made++;
}

// Drop entries for lines that no longer exist.
const ids = new Set(VOICE_LINES.map((l) => l.id));
for (const id of Object.keys(manifest)) {
  if (ids.has(id)) continue;
  rmSync(join(outDir, manifest[id].file ?? `${id}.m4a`), { force: true });
  delete manifest[id];
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(`audio: ${made} generated, ${VOICE_LINES.length} lines total`);
