# Status: where we are (5 Nov 2026, evening)

## The product today
**Audience:** גן חובה children (age 5–6) and their parents. **Goal:** reading before grade 1. **Partner:** the founder's mom, a veteran grade-1 teacher.

### What a child can do (all built, tested in Chrome, deployed)
- **Home (`/`):** "מִי מְשַׂחֵק?" profile cards (each child's buddy, world colors, stickers), a welcome for first-time parents, and a 3-step setup: nickname, boy/girl for grammar, island 🏝️ or garden 🌷 world. The parents' entrance is a small 🔒 in the corner.
- **Big map (`/play`):**
  - The greeting by time of day + name ("עֶרֶב טוֹב! עוֹז! מוּכָן לָאִמּוּן הַיּוֹמִי?"). Names come from a ready-made list (`content/names.ts`: עוז, עדן) or a parent's recording, kept on the device only.
  - A **🎲 daily practice** button.
  - 5 topics: letters → **nikud** (one station opening a map of 6 vowel worlds) → words → sentences → stories. Only letters and kamatz/patach are built.
- **Buddy and rewards:**
  - The child picks a buddy (6 animals), then a 4-card tour. The buddy sits in the corner and reacts (jump, tilt, dance).
  - Each station gives a fixed **sticker + gift** pair (`content/rewards.ts`). Milestone stations give a **new hero** (🦉 review station, 🦁 all letters, 🐳 kamatz world).
  - "My room" (`/stickers`): dress the buddy, switch friends, and one collection path in map order.
- **Letters world (`/play/letters`):** 7 letter stations + 2 mixed review stations (🔀 א–ל, 🏆 all letters), a ✍️ notebook, the 🎲 daily practice and the 🌱 letter garden. Each station has 5 steps:
  1. 📖 **learn:** a big letter, its name, then its example word (draft words, starting with kamatz/patach) played back to back ("בֵּית… בַּיִת"), the letter highlighted inside the word. Then a 🗣️ "say it out loud, tap 👂 to check" round (no speech recognition). Mix stations show a wall of all letters instead.
  2. 🎯 **quiz**, 3 kinds mixed: "where is ב?", "what starts with ב?" and 👂 **by ear** (hear "בַּיִת", pick its first letter; the caption hides the word). A wrong answer is explained ("כִּמְעַט! קוֹף מַתְחִיל בָּאוֹת קוֹף"). Sound-alike letters (ט/ת, כּ/ק, א/ע) are never wrong options.
  3. ✍️ **write:** 👀 watch → ✏️ trace (snapped ink, arrows) → ✍️ alone → 🖍️ free writing. A notebook-row board (band, bottom line, a dotted line for finals) with crayon ink. Free writing is checked fairly strictly (lookalikes fail), with a gentle hint (the letter faintly, the part to fix glowing, 👆 where to start); after 2 tries the wobble rules relax. A good letter "polishes": the neat letter draws itself over the child's + a ⭐ stamp. A resting palm no longer breaks the stroke.
  4. 🎮 **games menu** (child picks, ≤ 6 per station, chosen per station): 🔍 **lookalike detective** (both letters drawn from the font; the glass lights up the ink only one of them has: ב's foot, ד's corner), 🛏️ **finals' pajamas** (s7, m2: a letter puts on its final form at the end of a word), 🔦 **letter hunt** in a scene (kitchen, park, sea), bubbles, memory, 📺 quiz show, 🎡 wheel, 🎁 boxes.
  5. 🎁 **surprise:** a chest/egg → sticker + gift (+ hero). **Locked until every other step is finished.**
- **Real mastery (`lib/mastery.ts`, draft rule):** a letter "knows" = right on the first try on 2 different days, in 2 kinds of question. The 🎲 daily practice brings back weak letters first, then letters due after ~1, 3, 7 days, and asks a letter a kind it hasn't had.
- **🌱 Letter garden (`/play/letters/garden`):** every letter is a plant (seed → sprout → flower; coconut → palm on the island), a first-bloom celebration, 💧/☀️ for each day played this week (nothing lost on a missed day). A preview card on the letters map.
- **✍️ Write my name (`/play/letters/write/name`):** the nickname letter by letter (finals at the end of each word), then the whole name re-drawn in the child's own ink; the signature shows on the home card and in "my room".
- **Kamatz/patach world** (`/play/kamatz-patach`, inside nikud): 4 syllable stations (builder, hear-and-find, first sound) + reading words alone. **Paused**: founder: "we really need to improve it", with mom.
- **📚 Stories (`/play/stories`, the big map's 📚; `/play/stories/[world]` per nikud world), DRAFT for mom:** 36 decodable read-along stories, 6 per vowel world, using only the vowels taught so far (`content/stories.ts`, checked by `lib/decodable.ts` in `e2e/stories.spec.ts`). Recurring friends: דָּנָה, אַבָּא, the turtle, the dog, מִיצִי the cat. One sentence per page under an emoji scene; tap a word to hear it, 🔊 reads the page and lights each word (karaoke); a picture question at the end, a sticker on the shelf (✓, ⭐ if right first try). Audio: `npm run audio:stories` (ElevenLabs with timestamps → one mp3 per page + word times in `content/story-audio.json`); without it the reader is text only.
- **Nikud: all 6 vowel worlds** (`/play/nikud`, one engine, content in `content/nikud.ts`, all DRAFT for mom): קָמָץ/פַּתָּח → צֵירֵה/סֶגּוֹל → חִירִיק → חוֹלָם → שׁוּרוּק/קֻבּוּץ → שְׁוָא, each with its own color, stickers, gifts and a hero (🐳 🐆 🦒 🐨 🐙 🦓). A syllables station: 📖 meet the vowel + build (tap the mark, it jumps under the letter, then a word that starts with it) → 🐢/🐇 blend slow then fast → 👂 hear and find → 🖼️ first sound of a picture → 🎁 (locked until all done). The last station of each world: read together (syllable chips, slow/fast) → read alone (picture choice) → 🎁, then a 📚 stories tile (`/play/stories/<world>`). A big step splash before each step. Reading words use only vowels learned so far (checked by `e2e/nikud.spec.ts`). The shva world only teaches the "closing" shva (מַ + זְ → מַזְ). `/play/kamatz-patach` redirects.
- **Parents (`/parents`, code 17):** progress grids (letters green/yellow/gray by the mastery rule, days played this week), a next-step suggestion, settings (nickname, grammar, world, "open all worlds", record the name, reset), 🖨️ printable writing pages (`/print`).
- **Studio (`/studio`):** every voice line with play + the automatic-ear transcript, and all 27 letters' writing strokes for mom to review.

### Tech
- Next.js 16 (App Router, Turbopack, React 19, React Compiler) + Tailwind 4. RTL, Rubik font. Local-first (localStorage), no backend yet.
- Voice: ElevenLabs `eleven_v3`, stock voice "Sarah", pre-generated MP3s in `public/audio` (about 200 lines). No live AI at play time.
- Deploy: GitHub `ziv-halsband/a-grader` → Vercel (auto on push). Free ElevenLabs plan = non-commercial.

## Decisions made (with the founder)
- Audience is גן חובה; content is all of mom's grade-1 topics, delivered before grade 1.
- One adventure map, two worlds (boys/girls by default, either can pick), the same content.
- "Knowing a letter" = name **and** sound (founder). The sound isn't taught explicitly yet (see open questions).
- Voice: pre-generated, checked by an automatic ear, then mom approves. Live ElevenLabs maybe later (needs parental consent).
- Avatar of mom (HeyGen) and live lessons with mom are planned later. Keep the 👩‍🏫 placeholder.
- Practice mode on for now (everything open), but the prize must be earned.

## Open questions for mom (blocking real content)
1. **Letter sound:** teach "בּ" (bare) or "בָּ"? How does she say it? (The research says this is the biggest gap.)
2. **Teaching order** of letters (now alphabetical, placeholder).
3. **Example words** (draft: הַר, וָפֶל, זַיִת, טְרַקְטוֹר, לַוְיָתָן, מַטְרִיָּה, סַנְדָּל, פַּרְפַּר, קַקְטוּס, שָׁעוֹן…).
4. **Writing stroke order** for all 27 letters (`/studio`, `content/writing.ts`).
5. Silent letters א/ע, בּ/ב with and without the dot, a memory story per letter, the kamatz/patach method.
6. What the kids call her (the guide is "הַמּוֹרָה" for now). Her voice clone + avatar.
7. **New (5 Nov evening), all drafts:** the mastery rule (2 days + 2 kinds; should a later miss take "knows" away? should writing count?), review gaps 1/3/7 days, the pajamas story, wording of "אֵיזוֹ אוֹת? תַּגִּיד בְּקוֹל!", is "which letter does אַרְיֵה start with?" fair for silent א/ע, name writing (watch → trace → free; finals in a name before finals are taught; the ׳ in ג׳וני is dropped), the hunt scenes' words (`content/scenes.ts`).

## Next ideas (not started)
- From `docs/07-letters-research.md`: teach the letter sound (once mom decides); one off-screen idea per letter for parents; picture mnemonics drawn into the letter.
- Garden: let a letter "wilt" gently if it's missed later (mom decides), and a parents' view of the garden.
- A recording studio for mom (record each item in the browser, replace the AI file).
- Rebuild the nikud worlds with mom; then words, sentences, stories.
- Later: accounts (Supabase), payment, mom's avatar and live lessons, AI listening.

## Known limitations
- Free-writing check (stricter since 6 Nov, `scoreFreehand` in `content/writing.ts`, tuned with `node scripts/tune-writing.ts`): tells ד/ר, ה/ח, ו/ז, ו/י/ן, ר/ך apart; ב/כ only mostly (a messy כ passes as ב ~1 in 8). Similar round shapes (ס/ם/ט) can still pass for each other. Tuned on synthetic letters: watch real kids on the iPad. Writing still doesn't count toward mastery.
- The Playwright MCP browser draws ך and ן without their tails (a font quirk of that browser, not the app); check finals on a real iPad.
- The voice is a generic AI voice; short lines can sound rushed. Check `/studio` → "לבדוק באוזן".
- Nikud content (letters per station, words, pictures, mark descriptions, the shva approach) is a draft for mom. The new voice lines (≈1,400 characters) still need `npm run audio:eleven`.
