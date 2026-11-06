# Mom in the app: the plan (6 Nov 2026, draft for the meeting with mom)

**Goal:** parents and kids feel a real teacher is here (mom's voice, face, method), while AI does the heavy lifting
for everything that changes often. **Spend as little money as possible:** free first, pay only where it clearly wins.

**The rule of thumb:**
- What a child must **copy exactly** (letter names, syllables, reading words) → **mom's real recordings**.
- What **changes often or is long** (instructions, praise, stories) → **AI**, ideally in mom's cloned voice.

---

## A. Mom's real voice (free, biggest quality jump)

- [ ] **A1. Recording studio in the app** (Claude builds, free).
  - In `/studio`, one item at a time: tap ⏺ → say it → hear it → keep or redo.
  - Silence is trimmed and volume evened automatically.
  - Her file replaces the AI file. Progress is shown: "120 / 250 done".
  - Recordings are saved as files in the repo, like today's audio.
- [ ] **A2. Mom records the "must be perfect" set** (mom, about 1–1.5 hours, can be split over a few days).
  - 27 letter names (אָלֶף, בֵּית…)
  - About 250 syllables: each letter × each vowel (בָּ בֵּ בֶּ בִּי בּוֹ בּוּ בְּ…)
  - About 200 words: the letters' example words, the reading words, the hunt scenes
  - Tips: a quiet room, the same distance from the mic, slightly slower than normal, the same "teacher voice" throughout.
- [ ] **A3. Mom records her favorite short lines** (optional, about 15 minutes): "כָּל הַכָּבוֹד!", "יֹפִי!", "בּוֹאוּ נִקְרָא", "שָׁלוֹם, אֲנִי…". Hearing the real teacher praise them is what kids remember.
- [ ] **A4. Mom checks every word and syllable while recording.** It doubles as her content review: is the word right, is the picture right, would she teach it this way?

## B. Mom's cloned voice for everything else (small monthly cost, only when ready)

- [ ] **B1. Decide when to pay** (founder). The free plan is out of credits this month, non-commercial only, and can't clone. Options (check current prices):
  - **ElevenLabs Starter, about $5/month:** a quick voice clone from 1–2 minutes of audio, commercial use, about 30k credits.
  - **ElevenLabs Creator, about $22/month:** a professional clone from 30+ minutes of audio, much closer to her real accent.
  - Can be paid for one month only: make the clone, generate everything, then cancel. Generated files stay forever.
- [ ] **B2. Mom reads for the clone** (mom: 2 minutes for a quick clone, or 30–60 minutes for a professional one). The 36 stories make a ready script.
- [ ] **B3. Regenerate all AI lines in her voice** (Claude: one command, then the automatic ear checks every line).
- [ ] **B4. Mom approves in `/studio`** ("לבדוק באוזן" list); anything off, she records herself in the studio.

**In the meantime (free):**
- [ ] **B0. Try a native Hebrew voice instead of "Sarah"** (founder: 10 minutes, free).
  - Our API key can't browse ElevenLabs' voice library (it lacks the `voices_read` permission), and this month's credits are used up anyway.
  - So: on elevenlabs.io → Voices → Voice Library, filter Hebrew, listen, and pick 2–3 voices that sound like a warm teacher.
  - Then either add `voices_read` to the key, or just send me the voice IDs. After credits renew (or on a paid plan), I generate a few test lines with each so you can compare.

## C. Mom's face: video first, avatar later

- [ ] **C1. Film mom on a phone, free:** 10–15 short clips (5–15 seconds each). Good moments:
  - the welcome ("שָׁלוֹם! אֲנִי הַמּוֹרָה ___, בּוֹאוּ נִלְמַד לִקְרֹא")
  - "meet" each vowel (with her hand movement, if she uses one)
  - the end of each world
  - a "well done" for the parents' area

  Claude adds a small round "mom bubble" that plays a clip at those moments, replacing the 👩‍🏫 emoji.
- [ ] **C2. Mom's photo as the guide's face** (free): a smiling photo in the guide bubble instead of 👩‍🏫. Kids and parents see who's teaching.
- [ ] **C3. Later, an avatar** (HeyGen or similar, about $30/month, check prices), only if we need many more clips than she can film.
  - It needs 2–5 minutes of video of her, plus her cloned voice (B).
  - Clips are made once and stored, like the audio; never live.
- **Rule:** clips are short, can be skipped, and are followed straight away by the child doing something.

## D. Listening to the child read (experiment first)

- [ ] **D1. Feasibility test** (founder + Claude, about free).
  - With parents' consent, record 20–30 clips of family kids reading words and story sentences from the app.
  - Run them through 2–3 speech-to-text services (ElevenLabs Scribe, OpenAI, Google).
  - Measure how often each is right. Expect words to work better than single syllables.
- [ ] **D2. Decide from the numbers.** Only build it if it's right most of the time on real kids.
- [ ] **D3. If yes, build it gently:**
  - The child taps 🎤 and reads a word or sentence.
  - On a match: a celebration.
  - When it isn't sure: "let's listen together", then mom's recording.
  - Never "wrong".
- [ ] **D4. Privacy:**
  - A parent switches it on.
  - The voice is processed and deleted right away, never stored.
  - It needs a small server (the app's first), so the key isn't in the browser.

## E. Questions for mom at the meeting

- [ ] Her method: how does she say a letter's sound (בּ or בָּ)? Her teaching order of letters? Of vowels? (A published series teaches שְׁוָא together with קָמָץ/פַּתָּח.)
- [ ] What do kids call her? Is she OK being recorded, filmed and voice-cloned for the app (written consent)?
- [ ] Does she use a hand movement or a story per letter or vowel? Those become her video clips.
- [ ] Look together at the drafts: example words, nikud worlds, stories, how strict the writing check is, the prize flow.
- [ ] How much time can she give per week (recording sessions, reviewing)?

## F. The app's structure (decided 6 Nov, being built)

The big map has 3 chapters, in the order a child learns:
1. 🔤 **אוֹתִיּוֹת**
2. 🔊 **נִקּוּד:** 6 worlds. Each one goes syllables → reading words → short stories, then a 🌈 "כָּל הַנִּקּוּד" card at the end.
3. 📗 **אֲנִי קוֹרֵא:** a library of little books, stages א׳–ה׳.

"מִלִּים רִאשׁוֹנוֹת", "מִשְׁפָּטִים" and the separate 📚 "סִפּוּרִים" are gone from the big map; they live inside each nikud world.
- [ ] Ask mom: does this match how she teaches (letters → vowels with words and sentences inside → free reading)?

## Suggested order (cheapest first)

1. **A1 + C2** (Claude, free) → **A2 + A3 + C1** (mom records and films) → the app already "has mom in it".
2. **B0** (try a native Hebrew voice) while waiting.
3. **B1–B4** (one paid month for the clone, then cancel if we want).
4. **D1** (the listening experiment) → decide.
5. **C3** (avatar) only if we need it.
