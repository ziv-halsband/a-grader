# Build notes: first prototype (3 Nov 2026, overnight)

## How to run

```bash
npm install
npm run dev          # http://localhost:3000
```

It's best to look at it on a tablet or phone (same Wi-Fi: `http://<your-mac-ip>:3000`), because that's how kids will use it.

## What's built

| Screen | Path | What it does |
|---|---|---|
| Parent onboarding | `/` | 3 steps: a nickname (no full name or birth date), boy/girl (for Hebrew grammar: לחץ/לחצי), and the world. Also "who's playing?" when there are several kids. |
| Adventure map | `/play` | All 10 topics of the year as stations on one winding path. Only **מכירים אותיות** is open; the rest are locked ("coming soon"). |
| Letters world | `/play/letters` | 7 stations (א-ד, ה-ח, ט-ל, מ-ע, פ-ר, ש-ת, final letters). Each opens after the previous one, and finished stations can be replayed. |
| A station | `/play/letters/s1` … `s7` | **👀 Meet**: a big letter, its name, and an example word with the letter colored. Tapping replays the sound. **🎯 Find the letter**: "אֵיפֹה הָאוֹת ___?" with 3 cards (includes lookalike letters such as ב/כ, ד/ר once both have been learned, plus review of earlier stations). **🫧 Bubbles**: pop every bubble of the letter. **🎁 Sticker** + "again / onward / map". |
| Sticker book | `/stickers` | One sticker per station, different stickers in each world. |
| Parents' area | `/parents` | Gate (type "17" written in words, so a 5-year-old can't get in). What we practiced, one next-step suggestion that says what it's based on, a letters grid (not yet / practicing / knows on their own), and settings: nickname, grammar, world, reset, delete. |
| Mom's studio | `/studio` | Every line a child hears (84), with nikud, a ▶️ play button and its status, plus the letters content waiting for mom's review. |

### The two worlds
- **אִי הָאוֹצָר** (treasure island): sea, islands and a ship. Stickers are treasures 💎🪙🗝️.
- **גַּן הַקְּסָמִים** (magic garden): flowers and fairy houses. Stickers are 🌸🦋🌈.
- The learning content is the same in both. The default follows boy/girl, but the parent can pick either world for any child.

### Product decisions I made (please review)
- **No timer, no penalty, no daily streak.** A wrong answer: the card fades and the question repeats. A second wrong answer: mom shows the right letter and the child taps it. Only a first-try answer counts as "knows".
- **The bubbles game isn't scored.** It's for fun and practice. Only "find the letter" counts toward progress.
- **"Knows on their own"** = at least 2 first-try answers, including the latest one. This is a placeholder rule until mom defines when a child moves on.
- **The next-step suggestion** is based only on letters that needed help in the latest answer, and it always shows the reason.
- **The guide (mom)** is a 👩‍🏫 placeholder. Tapping her repeats what she said. Everything she says also appears as text, for the parent.

## What's placeholder (and must change)
1. **The voice is the macOS robot voice (Carmit)**, marked "temporary voice, not for children" in the studio. It's only there so the flow can be heard. Some nikud and stress will be wrong.
2. **Letter order = alphabet**, and the example words and lookalike pairs are my draft (`src/content/letters.ts`). Mom should replace them.
3. **Topic order on the big map** is a draft (`src/content/curriculum.ts`).
4. **Data lives only in the browser (localStorage).** No accounts and no server yet.

## How it's built (for later steps)
- Next.js 16 + Tailwind 4, RTL Hebrew, Rubik font (handles nikud).
- **All content lives in `src/content/`** (letters, topics, worlds, voice lines). Mom's changes go there, with no code changes.
- **Audio pipeline:** every line has an id → `public/audio/<id>.m4a`, and `src/content/audio-manifest.json` keeps its text + status (`placeholder` → `generated` → `approved`). `npm run audio:placeholder` regenerates the temporary voice and **never overwrites approved audio**. The ElevenLabs step will be a sibling script that writes `generated`, and mom approves in the studio.
- The store (`src/lib/store.ts`) is shaped so it can move to Supabase (one child = one row, plus per-letter stats).

## Suggested next steps (to discuss)
1. **Mom:** her yearly plan (`01-year-map.md`) + the letters topic card (`02-topic-card-template.md`). Especially the letter order, her example words, how she teaches the letter *sound* (not only its name), and her hints.
2. **Mom's voice:** a 1–3 minute recording for an ElevenLabs instant clone, then one test: does it say the 27 letter names and the 27 example words correctly? This tells us early whether the voice clone is good enough.
3. **Avatar:** one HeyGen clip of mom saying the welcome line, driven by the approved ElevenLabs audio, to see how it looks in place of the 👩‍🏫.
4. **Then:** GitHub + Vercel, so mom can try it on her phone. Supabase comes later, when we want accounts and syncing.

## Questions for the morning
- What do the kids call your mom in the game? ("המורה ___", "סבתא ___", a character name?)
- Do the two worlds feel right? Should there be more than two later (space, animals...)?
- In kindergarten, should "knowing a letter" mean its **name** (אָלֶף), its **sound** (/a/), or both? This changes the games and the recordings.
