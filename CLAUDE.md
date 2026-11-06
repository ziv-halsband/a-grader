@AGENTS.md

# מַסַּע הַקְּרִיאָה (grade-a-prepare): start here

A Hebrew learn-to-read adventure for kindergarten kids (גן חובה, age 5–6), so they reach grade 1 already reading.
Built with the founder's mom, a veteran grade-1 teacher (her method, voice and avatar come later; **never invent her method**,
mark content as a draft for her to check).

- **Live:** Vercel, connected to GitHub `git@github.com:ziv-halsband/a-grader.git` (branch `main`): **every push deploys**.
- **Full status, history and open questions:** [`docs/STATUS.md`](docs/STATUS.md). Read it before planning anything.
- Product docs: `docs/00-vision.md` … `docs/07-letters-research.md` (UX principles in `06`, letters research in `07`).

## Working with the founder
- Writes in English (informal); all product content is Hebrew with full nikud. Explain choices in plain words, no jargon.
- Likes to plan, then hands off big chunks ("act like a senior product designer"). Build fully, test in Chrome, commit, push.
- Works in both Claude Code and Cursor; this file is the shared memory, so put lasting notes here (not in a tool's private memory).
 In Cursor chats: explain the plan briefly in plain words, wait for an OK, then build the whole chunk.
- Sends feedback in batches, often with screenshots: fix every item, verify in the browser, push.
- The founder's own kids test the app on an iPad. Mom has agreed to an AI avatar and voice clone (later).
- UX rules (from `docs/06`): talk less, show more (voice lines ≤ ~5 words); a pointing hand 👆 instead of explaining;
  sounds + the buddy carry feedback; no timers, no losing, no leaderboards; forgiving for small fingers (iPad).

## Skills (in `.claude/skills/`)
- **Product thinking (Lenny's Podcast, `refoundai/lenny-skills`):** defining-product-strategy, product-vision, product-taste,
  roadmap-prioritization, user-onboarding-activation, retention-engagement, customer-interviews, idea-validation,
  measuring-pmf, pricing-strategy, positioning, writing-prds, analyzing-user-feedback, launch-planning.
  Use them when the founder asks product questions ("what next?", pricing, talking to parents, launch).
- Building: frontend-design, web-design-guidelines, vercel-react-best-practices, text-to-speech (ElevenLabs), playwright-cli, find-skills.

## Commands
```bash
npm run dev                                   # founder usually has it running on :3000, don't start another there
npx tsc --noEmit && npx eslint src && npm run build   # check before every commit
npm run test:e2e                              # Playwright: builds, serves :3031, runs e2e/ on iPad (WebKit+touch) + desktop Chrome
npm run audio:eleven -- --dry                 # how many ElevenLabs credits new/changed lines cost
npm run audio:eleven -- --retakes 3           # generate missing/changed voice lines (needs ELEVENLABS_API_KEY in .env)
npm run audio:eleven -- --only id1,id2 --retakes 3    # re-take specific lines
```

## How things fit
- `src/content/`: all content (letters, words, nikud, voice lines, worlds, rewards, writing strokes). Edit content here, not in components.
- `src/content/voice.ts`: **every line a child hears**. A new line needs audio: run `npm run audio:eleven`, then commit `public/audio/*.mp3` + `audio-manifest.json`.
  The script transcribes each clip back (speech-to-text) and flags mismatches; short phrases often come out slurred,
  so reword (e.g. "תּוֹרְךָ!" instead of "עַכְשָׁו אַתָּה!") rather than accept a bad take. Nothing calls ElevenLabs at runtime.
- `src/lib/store.ts`: local-first state in localStorage (no accounts, no server). Add only optional fields.
- `src/lib/progress.ts`: `PRACTICE_MODE = true` opens every built world/station/step for testing (prize still locked until all steps are done). Set false for real kids.
- Station flow: `src/app/play/letters/[station]/StationPlayer.tsx` (learn → quiz → write → games → 🎁). Shared engines: `ChoiceGame`, `LetterQuiz`, `LetterWriter`, `StationDone`.

## Testing
- **Automated:** `e2e/*.spec.ts` (Playwright). Add a test for every bug the founder reports (e.g. `writing.spec.ts`: a shaky,
  fast finger must win; `station.spec.ts`: the prize stays locked). `e2e/helpers.ts` seeds a test child (`seedChild`).
- **Exploring by hand:** the Playwright MCP server (`.mcp.json`) and the `playwright-cli` skill give Claude its own browser,
  separate from the founder's Chrome. Prefer them over the Chrome extension for checking flows.

## Gotchas
- **Testing in Chrome:** don't change the active child on `localhost:3000`; it switches the founder's open tabs too (same localStorage).
  Test on a separate origin: `npm run build && npx next start -p 3030`, use a throwaway child, `localStorage.clear()` there after.
- Agent worktrees live in `.claude/worktrees/` (gitignored). A symlinked `node_modules` breaks Turbopack builds there: use `cp -Rc` (APFS clone).
- ElevenLabs: free plan (10k credits/month, non-commercial, key is TTS + STT only, no library voices). Model `eleven_v3`, stock voice "Sarah" until mom's clone.
- Cursor loads every file named `AGENTS.md` into every chat, so the React skill's compiled guide is `full-guide.md`.
 If `npx skills` updates that skill, rename its `AGENTS.md` again. The Playwright MCP is set in both `.mcp.json` and `.cursor/mcp.json`.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
