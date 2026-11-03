# מסע הקריאה (grade-a-prepare)

An adventure that teaches kindergarten kids (גן חובה) to read Hebrew before grade 1, guided by a veteran grade-1 teacher.

```bash
npm install
npm run dev                 # http://localhost:3000
npm run audio:placeholder   # regenerate temporary voice lines (macOS)
```

- Product docs and decisions: [`docs/`](docs/) (start with `00-vision.md`, and see `04-build-notes.md` for the current state)
- Content (letters, topics, worlds, voice lines): `src/content/`
- Stack: Next.js · later Supabase, Vercel, ElevenLabs
