# Status: where we are (5 Nov 2026)

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
- **Letters world (`/play/letters`):** 7 letter stations + 2 mixed review stations (🔀 א–ל, 🏆 all letters), a ✍️ notebook, and the 🎲 daily practice. Each station has 5 steps:
  1. 📖 **learn:** a big letter, its name, an example word starting with kamatz/patach (draft words); the letter wiggles when tapped. Mix stations show a wall of all letters instead.
  2. 🎯 **quiz:** "where is ב?" + "what starts with ב?". A wrong answer is explained ("כִּמְעַט! קוֹף מַתְחִיל בָּאוֹת קוֹף"). Sound-alike letters (ט/ת, כּ/ק, א/ע) are never wrong options.
  3. ✍️ **write:** 👀 watch → ✏️ trace (snapped ink, arrows) → ✍️ alone → 🖍️ free writing with a forgiving check. Thresholds were loosened 5 Nov because kids couldn't win on an iPad.
  4. 🎮 **games menu** (child picks): bubbles, memory, 📺 quiz show, 🎡 wheel of luck, 🎁 surprise boxes.
  5. 🎁 **surprise:** a chest/egg → sticker + gift (+ hero). **Locked until every other step is finished.**
- **Kamatz/patach world** (`/play/kamatz-patach`, inside nikud): 4 syllable stations (builder, hear-and-find, first sound) + reading words alone. **Paused**: founder: "we really need to improve it", with mom.
- **Parents (`/parents`, code 17):** progress grids, a next-step suggestion, settings (nickname, grammar, world, "open all worlds", record the name, reset), 🖨️ printable writing pages (`/print`).
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

## Next ideas (not started)
- From `docs/07-letters-research.md`: teach the letter sound; "hear a sound → pick the letter"; real mastery (different days, 2 question types); lookalike duels; final-letter "pajamas" game; write my name; one off-screen idea per letter for parents.
- A recording studio for mom (record each item in the browser, replace the AI file).
- Rebuild the nikud worlds with mom; then words, sentences, stories.
- Later: accounts (Supabase), payment, mom's avatar and live lessons, AI listening.

## Known limitations
- Free-writing check can't tell lookalike letters apart (ד for ר passes).
- The voice is a generic AI voice; short lines can sound rushed. Check `/studio` → "לבדוק באוזן".
- Kamatz world content and wording are drafts and paused.
