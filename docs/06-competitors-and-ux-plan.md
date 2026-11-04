# Competitors, what kids and parents love, and our UX plan (4 Nov 2026)

## Who we looked at
| Product | What it is | What people love | What they complain about |
|---|---|---|---|
| **Matific** (math, K–6) | Short interactive "episodes" (5–15 min) + worksheets; an adaptive adventure, a training zone and an arena | Feedback is **part of the game world**, not "wrong!"; just-in-time help; built-in spaced review; kids feel math is *played* | Needs a teacher/parent to set up; extrinsic rewards are thin |
| **Khan Academy Kids** | Free, 5 animal characters, narrator Kodi Bear | A 2–4-year-old can use it **alone**: Kodi shows how to tap/drag, gives hints, then gets out of the way; stories with the same characters | Lots of content, little focus |
| **Teach Your Monster to Read** | Phonics adventure; the child **creates a monster** and teaches it to read | Ownership of "my monster"; accessories earned per sound and per world; mini-games kids replay | Long intro on first launch |
| **Endless Alphabet** | Letters are goofy monsters | Touched letters **come alive**: wiggle, make their sound; funny animation after each word; **no timer, no failure** | Price; more vocabulary than alphabet |
| **Reading Eggs** | 12 maps, 120 lessons | **An egg hatches a critter** after each lesson; golden eggs to spend in an arcade; certificates per map | Loud, repetitive sounds; subscription |
| **Duolingo ABC** | Short phonics lessons on a path | Short; **one big "start" button**; no ads | Repetitive later |
| **Kriakala** (Hebrew, 3–8) | Games + puzzles + stories, one-time $9.99 | A **pet** fed and dressed with stars earned; balloon adventure map; tap-to-read stories; memory, snake, runner | Weekly leaderboard (not suitable for 5-year-olds in our view) |
| **Nikudy / Nikudo** (Hebrew) | Teacher-led method by "belts"; physical games sent home; printable files | **Body movement for every vowel**; printable practice; a real teacher behind it | Mostly offline/printable; not a game |
| **כפר אותיות** (Hebrew) | Village hub of topics; tracing letters with crayons | Simple loop: hear → choose → sticker; tracing with numbered strokes; coloring | Plain; little progression |
| **Alef-bet apps** (Davka, Bullseye, Adventure with Alef…) | Single-skill games | Mnemonics for letter shapes; arcade speed for older kids | Same pictures over and over, "kids over 5 get bored" |

## What this means for a 5-year-old (design principles)
1. **Talk less, show more.** Our own founder test: "the voice says a bit too much." Matific and Khan Kids teach the *action* with a pointing hand and short words. **Rule: one instruction ≤ 6 words. An intro is said once, not every time.** A hand 👆 shows what to tap.
2. **Feedback lives in the world.** Correct = a chime, the card jumps, the buddy cheers. Wrong = a soft "boop", the card wobbles. **No spoken scolding**, and fewer spoken words overall.
3. **Something that is mine.** A buddy that the child picks and dresses (Teach Your Monster, Kriakala). This is the strongest "come back tomorrow" pull in the category, and it works without competition or leaderboards.
4. **A surprise at the end.** A chest or egg to tap open (Reading Eggs critters): anticipation, then reward.
5. **Everything is alive.** Every letter on screen reacts to a tap: it wiggles and says its name (Endless Alphabet).
6. **Short.** A station should take 5–8 minutes (Matific episodes). Fewer steps, more variety inside them.
7. **Mix question types** inside a quiz (name → letter, letter → first sound of a picture), so it doesn't feel like drilling.
8. **No timers, no losing, no leaderboards.** Already our rule; competitors confirm it's what parents praise.
9. **A real teacher, a real method** (Nikudy's strength, and ours: mom). Later: her videos, songs and movement per letter/vowel.
10. **Off-screen too.** Printable pages for parents (Matific, Nikudy, כפר אותיות).

## What we change (letters world first, nikud paused)

### Phase 1: now
- [x] **Shorter voice:** every line rewritten to ≤ 6 words where possible; intros said once per session; spoken "wrong" lines replaced by sounds.
- [x] **Sound effects** (synthesized, no files): correct chime, soft wrong "boop", pop, sparkle on rewards.
- [x] **A buddy for the trip:** the child picks one (6 animals) at the start; it sits in the corner of every game, cheers when right, tilts "hmm" when wrong, dances at the end, and giggles when tapped.
- [x] **Dress the buddy:** every station also gives an accessory (hat, crown, glasses…). "My room" (the sticker page) shows the buddy, stickers, and the wardrobe.
- [x] **Surprise at the end of a station:** tap a chest (island) / an egg (garden) → it shakes, opens, the sticker and the accessory fly out.
- [x] **Shorter stations: 5 steps instead of 6:** 📖 learn → 🎯 quiz (mixed: "where is ב?" + "what starts with ב?") → ✍️ write → 🎮 play (bubbles **or** the new memory game) → 🎁 surprise.
- [x] **New game: memory pairs** (letter ↔ its picture).
- [x] **Letters come alive** in "learn": a tap makes the letter wiggle, boing, say its name, and the buddy giggles. (Not yet on every screen.)
- [x] **A pointing hand 👆** for first-time actions: the next station on the map, the letter in "learn", the green start dot in writing, the chest/egg.
- [x] Writing: "watch" only the first time a letter is written (it's in the 👀 button afterwards).

Built and tested in Chrome on 4 Nov (a full station end to end with a temporary test child, then removed).
Notes:
- Very short lines are often rushed by the AI voice; `npm run audio:eleven -- --flagged --retakes 2` re-takes them automatically. "עַכְשָׁו אַתָּה" never came out clean, so it's now "תּוֹרְךָ! / תּוֹרֵךְ!".
- Praise is spoken only every other right answer; the chime and the buddy do the rest.
- The kamatz/patach world is paused: it opens only with the parents' "all worlds" switch.

### Phase 2: next
- [x] **🎲 Surprise round** (Matific's adaptive adventure), on the letters map after the first station: 6 questions for this child. Letters that needed help last time come first, then letters not practiced for a while, plus some randomness; every third question is a picture question.
- [x] **🖨️ Printable page per letter** (`/print`, linked from the parents' area): the model with numbered start dots and arrows, 2 rows to trace with a pencil, 1 row to write alone.
- **Letter mnemonics from mom** (ג "walks", ב "a house with a door"…), shown in "learn".
- **Mom's videos, songs and a movement for each letter** (Nikudy's body-movement idea, in mom's words).
- **Short stories** with tap-to-hear words, built only from letters already learned.

### Phase 3: later
- Listening (child says the letter, AI checks), only after a feasibility test with consenting family kids.
- Nikud worlds rebuilt with the same pieces + mom's method; accounts, payment, sync.

## Sources
- [Matific: parents](https://www.matific.com/us/en-us/home/parents) · [Matific: teachers](https://www.matific.com/us/en-us/home/teachers/) · [Matific episodes (AAMT)](https://makeitcount.aamt.edu.au/Digital-Learning/Learning/Just-in-time-learning/Matific)
- [Khan Academy Kids characters](https://khankids.zendesk.com/hc/en-us/articles/360049358751-Learn-more-about-the-characters-inside-Khan-Academy-Kids)
- [Teach Your Monster to Read (App Store)](https://apps.apple.com/au/app/id828392046)
- [Endless Alphabet (Macworld review)](https://www.macworld.com/article/221077/review-your-kids-will-love-learning-with-endless-alphabet-for-ios.html) · [Common Sense Media](https://www.commonsensemedia.org/app-reviews/endless-alphabet)
- [Reading Eggs rewards](https://kb.readingeggs.com/3-rewards-systems) · [Reading Eggs reviews](https://hiphomeschoolmoms.com/reading-eggs/reviews/)
- [Kriakala (App Store)](https://apps.apple.com/us/app/id6752532036)
- [Nikudy (Hidabroot article)](https://www.hidabroot.org/article/1191232)
- [Parents on Reddit about reading apps (GummySearch)](https://gummysearch.com/tools/best-products/educational-app/)
- Hebrew alef-bet apps: [Alef Bet Bullseye](https://apps.apple.com/us/app/id1081250079), [Hebrew Alphabet Learning](https://apps.apple.com/us/app/hebrew-alphabet-learning/id1554448029), [JTA on alef-bet apps](https://jta.org/?p=1788986)
