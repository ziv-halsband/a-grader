# מסע הקריאה (grade-a-prepare)

An adventure that teaches kindergarten kids (גן חובה) to read Hebrew before grade 1, guided by a veteran grade-1 teacher.

```bash
npm install
npm run dev                 # http://localhost:3000
npm run audio:eleven        # generate voice lines with ElevenLabs (needs ELEVENLABS_API_KEY in .env)
npm run audio:placeholder   # offline fallback: macOS robot voice
```

- Product docs and decisions: [`docs/`](docs/) (start with `00-vision.md`, and see `05-mvp-notes.md` for the current state)
- Content (letters, topics, worlds, voice lines): `src/content/`
- Stack: Next.js · ElevenLabs (voice) · later Supabase, Vercel
