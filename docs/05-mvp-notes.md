# MVP: letters + kamatz/patach (4 Nov 2026)

## What changed
- **Real voice (ElevenLabs).** All 139 lines use the stock voice "Sarah" with model `eleven_v3`. This is temporary until mom's voice clone. The macOS robot voice is gone.
  - Model choice: v3 read the Hebrew test sentences with nikud correctly. v4 misread "אֵיפֹה הָאוֹת".
  - Cost: about 3,500 of the 10,000 free monthly credits (nikud marks count as characters). Note: the free plan is for **non-commercial use only**. Selling the product needs the Creator plan ($22/mo, or $11 the first month), which is also needed for a professional clone of mom's voice.
  - `npm run audio:eleven` generates missing/changed lines; `-- --dry` counts credits first; `-- --only id1,id2` re-takes specific lines.
  - **Automatic ear:** every clip is transcribed back (speech-to-text). If the transcript differs, the line is flagged. In `/studio` → "לבדוק באוזן" shows what the transcriber heard.
  - Most flags are false alarms: short syllables and letter names get written differently (בָּ → "בא"), or in English letters (כַּף → "Cuff").
  - Real suspects to check by ear: **צ sounds** (צָ heard as "סה", צָב as "Sav"), **כְּמוֹ** (heard as "כמאל"), **חֵית**, **תָּו**, **פֵּא סוֹפִית**.
- **The station problem is fixed.** The steps at the top (📖 learn · 🎯 find · 🖼️ words · 🫧 bubbles · 🎁 prize) are now labelled buttons.
  - "Learn" is always open, so a child can go back to the letters in the middle of a game.
  - A step opens once it's reached.
  - A finished station opens all its steps (replay any part).
- **New letters game: "which word starts with the letter?"** It shows the letter and offers 3 pictures. This links the letter to its **sound**, not only its name (mom: "both").
  - For final letters it asks "which word ends with…".
- **New world: קָמָץ וּפַתָּח** (5 stations), opened from the big map after the letters world.
  - It can also be opened right away with the parents' switch "כל העולמות".
  - **k1–k4: syllables** (אָ מָ לָ בָּ · דָּ גָּ רָ נָ · שָׁ תָּ סָ כָּ · פָּ יָ חָ צָ):
    - 📖 **Syllable builder:** the letter (its name) → tap "add kamatz" and the mark lands under the letter → hear the sound → switch קָמָץ/פַּתָּח (same sound) → a picture word that starts with this sound.
    - k1 opens with a slide showing both marks under א.
    - 👂 **Find the sound:** hear a syllable, tap it. Cards mix kamatz and patach on purpose. This game is scored.
    - 🖼️ **Which word starts like בָּ:** pictures.
  - **k5: first words** (אַבָּא, סַבָּא, מַפָּה, בַּנָּנָה, דָּג, יָד, יָם, צָב, כַּף, כַּד):
    - 📖 Tap each part of the word (it lights up and sounds), then the whole word.
    - 🔍 **Read alone:** the word is shown and NOT spoken, and the child picks the picture. The word is spoken only after the answer. This is real reading, and it's scored.
- **One game engine** (`src/components/ChoiceGame.tsx`) for every quiz, so the hint ladder is the same everywhere: wrong once → that card fades and the question repeats; wrong twice → the guide shows the answer; only a first-try answer counts as "knows".
- **Parents' area:** a kamatz/patach grid (syllables + words, same colors as letters) and the "open all worlds" switch.
- Installed project skills (`.claude/skills`): find-skills, ElevenLabs text-to-speech, Vercel React best practices, web design guidelines, frontend design.

## Research notes
- Israeli grade 1 (Ministry of Education): letters, then kamatz/patach, then the other marks, reading **צירופים** (letter + vowel) and building to words. Our order follows that until mom's order arrives.
- **"עיצורים" (letter sounds):** an AI voice can't reliably say a consonant alone (בְּ without a vowel). So the sound of a letter is taught through **syllables** (בָּ) and **first sounds of words**, which is also how the syllable approach works. If mom wants the pure consonant sound, it's ~30 short clips she records herself.

## Content to check with mom
- The syllable order and groups, and the first words (all draft).
- Kamatz described as "קַו, וּמִתַּחְתָּיו נְקֻדָּה קְטַנָּה" and patach as "רַק קַו". Is that how she says it?
- 👨 אַבָּא and 👴 סַבָּא look alike as pictures.

## Next
1. Listen in `/studio` → "לבדוק באוזן" (10 minutes). Re-take bad lines: `npm run audio:eleven -- --only <id>`.
2. Mom's voice: 1–3 minutes of clean recording → clone → `ELEVEN_VOICE_ID=<her id> npm run audio:eleven -- --only …` (needs a paid plan for a professional clone; an instant clone may be enough to test).
3. Next nikud worlds (צֵירֵה/סֶגּוֹל, חִירִיק…) reuse the same pieces: content file + syllable builder + ChoiceGame.

## Writing letters (added 4 Nov, inspired by כפר אותיות "מציירים אותיות"; our own design, nothing copied)
- **In every letters station, a new step ✍️ "כּוֹתְבִים"** (after "find"). Each letter in 3 rounds:
  - 👀 **Watch:** a pencil writes the letter by itself, stroke by stroke.
  - ✏️ **Trace:** a green start dot with the stroke number, dotted path and arrows.
  - ✍️ **Write alone:** only a faint shape, no arrows, no numbers. This is the real check. If the child starts in the wrong place twice, the start dot appears and it counts as "with help".
- **How the ink works:** it only grows **forward along the right stroke, from the right start**, with a generous margin for small fingers. A shaky hand still makes a neat letter, while the stroke order and direction are learned. Writing from the wrong end draws nothing: the box shakes and the voice says "start here, at the green dot".
- 7 crayon colors, an erase/restart button, and 👀 to watch again. Writing lines like a grade-1 notebook (descenders of ק and final letters go below the line).
- **✍️ My notebook** (`/play/letters/write`, button on the letters map): all reached letters as colorful cards, a ✓ on letters written alone, tap to write any letter again.
- **Mom must check the strokes.** `/studio` → "איך כותבים כל אות" shows all 27 letters with numbered start points. The order and direction are my draft based on common print-letter teaching; children will learn exactly what's there. The file is `src/content/writing.ts`, one line per letter.
- Possible next step: a printable worksheet per letter (trace on paper) for the parent.
