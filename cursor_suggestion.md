# Taking מַסַּע הַקְּרִיאָה one level up (suggestions, 6 Nov 2026)

Written after reading `docs/STATUS.md`, `docs/00`, `06`, `08`, and researching competitors (Hebrew and English).
Uses the product skills in `.claude/skills/` (strategy, positioning, retention, onboarding, idea validation, pricing).
Nothing here invents mom's method: every content idea is a question for her, not a decision.

---

## TL;DR

1. **The app is already richer than most Hebrew competitors.** Letters, all 6 nikud worlds, 36 decodable stories, real
   handwriting checks, mastery and spaced review. Nobody in the Hebrew market has all of this in one journey.
2. **The biggest risk isn't missing features. It's that no real child or parent has used it yet.** Every rule (mastery,
   writing strictness, prize flow, session length) is tuned on guesses and synthetic data.
3. **Don't compete on "more games".** Kriakala, Letter Board (24 games) and Lomdania (400+ games) already fight there.
   Compete on **"a real grade-1 teacher's method, from the first letter to reading a whole book, before grade 1"**.
4. **The next level is four moves, in this order:**
   1. **Prove it** with 5–10 real families (6 weeks, free).
   2. **Make the parent a partner**, not just a viewer: a 2-minute "read with me" moment each day (what works in Reading.com).
   3. **Put mom in the app** (photo, voice, short clips): the one thing nobody can copy.
   4. **A clear finish line:** "ready for grade 1" = the child reads a little book aloud to the parent, recorded and
      shareable to grandma. That's the outcome parents pay for, and the moment they'll share.
5. **Money:** the real alternative is a private tutor at ₪120–150 an hour. A one-time "school year pass" of about ₪200–250
   is cheap next to that. Test it with a pre-sale before building payments.

---

## 1. Where the app is today (honest view)

### What's strong (keep and protect)
| Strength | Why it matters |
|---|---|
| **One journey**: letters → nikud → syllables → words → stories | Most Hebrew apps are a box of separate games. A path with an end is what parents want. |
| **Decodable stories, checked by code** (`lib/decodable.ts`) | Kids only read what they were taught. This is how phonics is supposed to work, and rare in Hebrew apps. |
| **Real handwriting check** (`scoreFreehand`) | Competitors only trace. We check free writing and tell ד/ר, ה/ח apart. Grade-1 teachers care a lot about writing. |
| **Real mastery** (right on the first try, 2 days, 2 kinds of question) + spaced review | This answers the biggest complaint about Reading Eggs ("he was memorizing, not decoding"). |
| **No timers, no losing, no leaderboards**; a buddy, a garden | Parents praise this. The garden is "mounting value": the more you play, the more you'd lose by leaving. |
| **Local-first, no accounts** | Zero friction to try, and good privacy. |

### What's missing or risky
| Gap | Why it matters |
|---|---|
| **No real users yet** | We don't know if a 5-year-old finishes a station alone, gets bored, or gets stuck. |
| **Mom isn't in the app yet** (the 👩‍🏫 placeholder, a stock AI voice "Sarah") | Our main differentiator is invisible today. Some nikud lines have no audio yet (credits ran out). |
| **Mom's method isn't in yet** (letter sound, letter order, example words) | We're building engines on a placeholder curriculum. |
| **The parent only watches** (progress grids) | Parents are the buyers, and research shows parent-guided practice is what actually builds reading. |
| **No finish line a parent can see** | "Station 7 done" means nothing to a parent. "Reads a little book alone" does. |
| **No way to bring a family back** (no reminder, no install, no account) | Local-first is great for trying, but nothing invites the child back tomorrow except the child. |
| **A long first run** (parent welcome → 3-step setup → buddy pick → 4-card tour → map → station) | The skills' rule: the child should hear and touch a letter within ~30 seconds. Worth measuring. |
| **Breadth is growing fast** (9 game types, 6 nikud worlds, 36 stories) | More to check with mom, more to keep working. Khan Kids' known weakness is "lots of content, little focus". |

---

## 2. Competitors (new research, adding to `docs/06`)

### Hebrew market: crowded with game collections, no teacher-led journey
| Product | What it is | Price | What we learn |
|---|---|---|---|
| **Kriakala** (קריאה קלה עם הילה) | 10 mini-games, 4 "islands", letters → nikud → stories. By a Hebrew literacy educator (since 2003). Aimed mostly at the **diaspora**. | Free download, 3-day trial, then **one-time** purchase | The closest competitor. They also sell "a real educator". Their promise is specific: "letters in 6–10 weeks at 10–15 min a day". **We need a promise that specific.** |
| **Letter Board / לוח האותיות** | 24 games: letters, nikud, reading, tracing, cursive | Free, no ads | Competes on game count ("3× more than any other app"). Don't play that game. |
| **Lomdania (לומדניה)** | Web/PWA courses: free grade-1 prep, a paid reading course (13 lessons, 400+ games, 35 printables) | **₪39/month or ₪247/year**; family plan ₪69/month | The Israeli price anchor. Installs to the home screen **with a daily reminder**. Has streaks and a "wall of champions" (by persistence). |
| **Shubi (שובי), "הכנה לכיתה א"** | Letters, sounds, words, writing; "designed by a psychologist" | Free (Google Play, 4.7★) | Parents trust an expert's name on the box. |
| **Milim-Li (מילים-לי)** | Letters, first words, **personal printable worksheets** (name writing); a 30-day journey on Android | App store | Printables with the child's name = a reason for the parent to open the app. |
| **Nikudy / Nikudo** | A teacher's method by "belts", physical kits, body movement per vowel | Paid program | The method plus the teacher is the product. That's our model too, but **digital and playful**. |
| **Private tutor** | "הכנה לכיתה א׳" with a teacher | **₪80–180/hour** (usually ₪120–150) | **This is the real competitor (the status quo)** for the parent who's serious about it. |

### English market: where the category is heading
| Product | What it shows |
|---|---|
| **Ello** (AI reading tutor) | Listens while the child **reads aloud**, helps on hard words (try again → syllables → reads it for them), and picks the next book. Weak spots: noise, accents, privacy (raw audio kept 30 days, sent to outside AI), Ello 2.0 rated 3.2 on Google Play, pushy upgrades. **The future of the category, but hard.** Nobody does this well in Hebrew yet. |
| **Reading.com** | **Parent-led**: fully scripted 15-minute lessons where the screen tells the parent what to say. $12.49/month. A Reddit parent: after Reading Eggs failed, "lessons are short, parent-led, no game layer… decoding started moving within a month". |
| **Reading Eggs** | Kids love it, but parents complain it **rewards guessing**: kids chase eggs for their avatar, not reading. A warning for our sticker economy. |
| **Hooked on Phonics** | App + **mailed books and workbooks**. Parents value the off-screen part. Complaint: "bloated, too many menus". |
| **HOMER** | Personalized path; complaints about glitches and unclear auto-renew. |
| **Teach Your Monster to Read** | One-time purchase in the app stores, free on the web. Ownership of "my monster". |

### What the research says, in one line each
- **Game-only apps make kids play; parent-guided apps make kids read.** The winners combine both.
- **Rewards you can earn by guessing teach guessing.**
- **Parents pay for an outcome** ("reads by grade 1"), not for a number of games.
- **Listening AI is the big technical edge**, and Hebrew child speech is still unsolved: an opening, and a risk.

---

## 3. Diagnosis and strategy (from the strategy and positioning skills)

**The crux (the one problem holding the product back):**
We've built a great machine without knowing whether it works for real 5-year-olds and whether parents would pay for it.
And the thing that makes us different (mom and her method) isn't in it yet.

**Guiding policy (how we'll beat it):**
Stop widening and start **proving and deepening**. Every next piece of work should either (a) put real kids and parents
in front of the app, (b) put mom into it, or (c) make the "ready for grade 1" result visible to the parent.

**Positioning (draft):**
- **For:** Israeli parents of a גן חובה child who want them to start grade 1 already reading.
- **Instead of:** a private tutor (expensive, scheduling) or a pile of letter games (fun, but no path and no proof).
- **We are:** a reading journey by a veteran grade-1 teacher, from the first letter to reading a whole little book, in 10
  minutes a day.
- **Unlike game apps:** a child can't win by guessing; a sticker means they really know it.
- **The foil:** "a box of 24 letter games".
- **One-liner (Hebrew, draft):** "מוֹרָה לְכִתָּה א׳ בַּכִּיס: מֵהָאוֹת הָרִאשׁוֹנָה וְעַד סֵפֶר רִאשׁוֹן, לִפְנֵי כִּתָּה א׳."

**Where we don't play (on purpose):** the diaspora (Kriakala's market), ages 3–4, math, English, a games arcade.

---

## 4. Suggestions, in priority order

### ① Prove it: a 6-week pilot with 5–10 real families (idea validation, customer interviews)
**Why first:** every other decision (session length, how strict writing is, the prize flow, price) depends on it.
- Recruit 5–10 גן חובה families, ideally through mom's teacher network (less biased than friends). Ask for written consent.
- **Watch 3 kids play live** (sit beside them, iPad, don't help). Note where they hesitate, tap randomly, or ask an adult.
- After 1 week and 4 weeks, a 15-minute call with each parent (customer-interviews skill: ask about the **last time**
  they practiced reading at home, not "would you use…").
- **Measure, privately and simply** (no server needed at first: a hidden "export my data" in `/parents` that the
  parent sends us on WhatsApp):
  - **Activation:** did the child finish the first station on day 1?
  - **Habit:** days played per week, weeks 1–4.
  - **Learning:** letters that "know" by the mastery rule after 2 and 4 weeks.
- **Success bar (draft):** most kids play 3+ days a week in week 3, and parents say they'd be "very disappointed"
  without it (the measuring-PMF skill's 40% test).

### ② Make the parent a partner: "📖 read with me" (2 minutes a day)
**Why:** it's what actually builds reading (Reading.com), it sells the app to the payer, and it's what mom does in class.
- After each station (or once a day), a short **parent card**: "tonight, ask her to read: בַּיִת, דָּג. If she gets stuck,
  say: 'what sound does ב make?'" Tap ✓ / 🙂 "needed help". Script by mom, ≤ 3 lines.
- The parent's ✓ feeds mastery as a third "kind" of evidence: **reading aloud**. This is also a free **"wizard of Oz"
  version of AI listening**: the parent is the ear. We learn exactly what AI listening would need to do, before paying for it.
- **One off-screen idea per letter** (already in "next ideas"): "find 3 things at home that start with ב".

### ③ Mom in the app (from `docs/08`, moved up in priority)
**Why:** it's the moat. Kriakala has "Hila", Shubi has "a psychologist"; we have **a real grade-1 teacher**, if people can see her.
- Cheapest, biggest effect first: **her photo** in the guide bubble, **her recorded letter names and syllables** (the
  in-app recording studio, A1), **10–15 phone clips** (welcome, meet each vowel, end of each world).
- On the home screen and parents' area: **"the method of ___, a grade-1 teacher for __ years"**. Parents decide on trust.
- Blocked on mom's answers (letter sound, order, words). **Suggest one focused meeting** using the list in `docs/08` §E.

### ④ A finish line: "🎓 I'm ready for grade 1"
**Why:** parents pay for an outcome. Today the app has many small finishes and no big one.
- **A readiness check** a parent can run (5 minutes): letters, a few syllables, 3 words, one sentence. Also useful as a
  **placement** for kids who already know letters (Reading.com does this), so they don't start bored at א.
- **Graduation:** the child reads a little book aloud; the app **records it on the device**; the parent gets a
  certificate and can **share the recording with grandma** (WhatsApp). This is the emotional peak, and our best
  word-of-mouth moment. No server needed: the file stays on the device until the parent shares it.
- **A parent-facing promise**, once the pilot gives real numbers: "about __ weeks at 10 minutes a day". Don't publish a
  number before the pilot.

### ⑤ Protect learning from "playing for stickers" (the Reading Eggs trap)
- Check that **no reward can be earned by fast random tapping**. Ideas to test: after 2 quick wrong taps, pause, the
  buddy models the answer, and that question doesn't count toward the ⭐.
- Tie the **big** rewards (heroes, garden flowers) to **mastery**, not to finishing steps. The small ones (stickers)
  can stay generous.
- Count **writing** toward mastery (an open question for mom), so the strongest feature also "counts".

### ⑥ First run: a letter in 30 seconds (onboarding skill)
- Measure in the pilot: seconds from opening the app to the child's first tap on a letter.
- Likely fix: **parent setup can come later** (start with "who's playing?" + buddy, then straight to the first letter);
  move the 4-card rewards tour to **after the first station**, when the child has just felt the reward.

### ⑦ Bring families back, without guilt (retention skill)
- **Install to home screen** (PWA) with an **optional, parent-set daily reminder** ("a 10-minute adventure with בֵּית
  today?"). Lomdania does this.
- **Mounting value**, which we already have: the garden, the name signature, the buddy's wardrobe. Add the **child's own
  reading recordings** over time ("listen to how you read in November!"). Parents love this, and it's something to lose.
- **No punishing streaks, no leaderboards** (vision rule). The garden's "nothing lost on a missed day" is the right model.
- **A weekly WhatsApp-style summary** for the parent (generated on the device, the parent taps "share to myself"):
  "this week: 4 days, learned ג and ד, try this tonight…".

### ⑧ Listening AI: keep it an experiment (`docs/08` D)
- Hebrew child speech recognition is unproven. Ello shows even English struggles with noise and accents.
- Run the **D1 feasibility test** after the pilot, using the parent's ✓/✗ from ② as the "right answer" to compare with.
- If it works, it's a real moat. If not, "read with me" (②) already delivers most of the value.

### ⑨ Price: test it before building payments (pricing skill)
- **Anchors in Israel:** tutor ₪120–150/hour; Lomdania ₪39/month or ₪247/year; Kriakala a one-time unlock.
- **Draft model:** the **letters world free** (the "aha" before any paywall), then a **one-time "until grade 1" pass**,
  about **₪199–249 per child** (or per family). One-time fits a 9–10 month goal better than a subscription, and avoids
  the "unclear auto-renew" complaints HOMER gets.
- **Test with a pre-sale (fake door):** at the end of the letters world, a "unlock the nikud journey, ₪___" card →
  "we're opening in __, leave your number". Count taps. Talk to the people who tapped. Order of magnitude first, exact
  number later.
- Remember: ElevenLabs free plan = **non-commercial**. Before charging, move to a paid plan or mom's own recordings.

### ⑩ Timing
- The grade-1 worry grows over the gan chova year and peaks before September. **A pilot now (Nov–Dec)** gives real
  results and parent quotes in time for a launch in the **spring**, when parents are actively looking.

---

## 5. What not to do (yet)
- **More game types or more worlds** before the pilot. We already have more than kids can try.
- **Leaderboards or a "wall of champions"**, even by effort. Not for 5-year-olds.
- **AI-generated stories at play time** (Ello's Story Creation isn't reviewed by a human). Our rule is "generate, mom
  approves, then fix it in place". Keep it.
- **Accounts, servers, payments** before the pilot says families stay.
- **A specific promise to parents** ("reading in 8 weeks") before we've measured it.

---

## 6. A 6-week plan (draft)
| Week | Founder + mom | Building (Claude) |
|---|---|---|
| 1 | The mom meeting (`docs/08` §E): method answers, consent, photo, first recordings | Recording studio (A1), mom's photo in the guide, a private "export progress" for the pilot |
| 2 | Recruit 5–10 families, watch 3 kids play live | Fixes from watching; first-run shortened (⑥) |
| 3 | Families play | "📖 read with me" parent card (②), anti-guessing check (⑤) |
| 4 | Week-1 calls with parents | Readiness check / placement (④) |
| 5 | Families play | Home-screen install + optional reminder (⑦); the fake-door price card (⑨) |
| 6 | Week-4 calls, the PMF question, decide | Graduation: read a book aloud, record, certificate, share (④) |

---

## 7. Questions for you
1. Can mom find 5–10 families (her network, a גן she knows)? This is the single most useful next step.
2. Who is the buyer you picture: an anxious parent (the child is behind) or an ambitious one (wants a head start)? It
   changes the message.
3. Israel only for now, or also Hebrew-speaking families abroad (Kriakala's market)?
4. Would you rather charge once per year or monthly? (Draft suggestion: once, ₪199–249, tested with a fake door first.)
5. Would mom be comfortable with her name and face on the product ("the method of…")?

---

## Sources
- Kriakala: [site](https://kriakala.com/) · [kindergarten page](https://kriakala.com/hebrew-for-kindergarten) · [games + pricing FAQ](https://kriakala.com/hebrew-reading-games)
- Letter Board / לוח האותיות: [Google Play](https://play.google.com/store/apps/details?hl=he&id=com.shwartz.alefbeit) · [App Store](https://apps.apple.com/us/app/letter-board-learn-hebrew-abc/id6754824944)
- Lomdania: [courses and prices](https://lomdania.co.il/courses/) · [family plan](https://lomdania.co.il/family/) · [free grade-1 prep](https://lomdania.co.il/1st-grade-prep/) · [app + reminders](https://lomdania.co.il/app/)
- Shubi, הכנה לכיתה א: [Google Play](https://play.google.com/store/apps/details?id=air.com.shubi.readwriteF&hl=he) · Milim-Li: [site](https://valorem.ing/apps/he/milimli)
- Private tutor prices: [GoMorim](https://gomorim.co.il/%D7%94%D7%9B%D7%A0%D7%94-%D7%9C%D7%9B%D7%99%D7%AA%D7%94-%D7%90) · [Shioorim](https://shioorim.co.il/%D7%9E%D7%95%D7%A8%D7%94-%D7%A4%D7%A8%D7%98%D7%99/%D7%A7%D7%A8%D7%99%D7%90%D7%94-%D7%95%D7%9B%D7%AA%D7%99%D7%91%D7%94/%D7%9C%D7%95%D7%93) · [Mora-Mora price index](https://moremora.co.il/%D7%9E%D7%97%D7%99%D7%A8%D7%95%D7%9F-%D7%A9%D7%99%D7%A2%D7%95%D7%A8%D7%99%D7%9D-%D7%A4%D7%A8%D7%98%D7%99%D7%99%D7%9D)
- Ello: [Edulist review](https://edulist.com/l/ello) · [KidsAITools review](https://www.kidsaitools.com/en/articles/ello-ai-reading-app-detailed-review) · [Tech Arcade](https://www.techarcade.io/products/ello/) · [Peabody (privacy)](https://peabody.kids/resources/software/ello)
- Reading.com: [site](https://www.reading.com/) · [how lessons work](https://support.reading.com/en/articles/8774977) · [App Store](https://apps.apple.com/us/app/learn-to-read-reading-com/id1534938305)
- English apps compared: [Tiny Hands Play](https://tinyhandsplay.com/guides/learn-to-read-apps-compared/) · [Open and Go Phonics](https://openandgophonics.com/reviews/best-phonics-apps/) · [Homer vs Reading Eggs](https://www.topconsumerreviews.com/best-learn-to-read-products/compare/homer-vs-reading-eggs.php) · [Reddit: three apps compared](https://www.reddit.com/r/Homeschooling/comments/1tmvb3b/i_tried_three_different_learn_to_read_apps_for/)
- Earlier competitor work: `docs/06-competitors-and-ux-plan.md`
