# Research: printable worksheets (דַּפֵּי עֲבוֹדָה) for גן חובה / כיתה א׳ (6 Nov 2026)

What Israeli (and other) kindergarten / grade-1 worksheets usually include, and what we take from it.
We copy nobody's pages, text or pictures: every sheet in the app is generated from our own content
(`src/content/letters.ts`, `nikud.ts`, `writing.ts`, `stories.ts`).

## What the usual sheets are
- **Letter writing (כְּתִיבַת אוֹת):** a model letter, often with numbered starting points and arrows, then a row to
  trace on dots and a row to write alone, on notebook lines. Israeli grade-1 notebooks use a band between two lines;
  final letters (ך ן ף ץ) and ק go below the bottom line. Commercial kindergarten workbooks sell "letter knowledge +
  phonological awareness + grapho-motor" as one package. ([Shoshi Klinger's kindergarten catalogue](https://www.shoshiklinger.com/_files/ugd/6f4629_8f86637ddabf452691321b2282a5e691.pdf))
- **Find and circle (מְצָא וְהַקֵּף):** a field of letters with lookalikes mixed in; trains the telling difference
  (ב/כ, ד/ר, ה/ח). One of the most common letter-recognition sheets. ([Kids Academy letter recognition](https://www.kidsacademy.mobi/printable-worksheets/kindergarten/learning-skills/letter-recognition/?page=3), [Letter-sound worksheets](https://support.althea.net/kindergarten-letter-sounds-worksheets))
- **Picture → first sound/letter (צְלִיל פּוֹתֵחַ):** connect or circle the letter a picture starts with. In Hebrew the
  first *syllable* (בָּ in בַּיִת) is the natural unit for 5–6 year olds (see `docs/07`), so for nikud the sheet
  connects a syllable to its picture.
- **Color by letter / by code:** each area marks a letter, a key says which color; fine-motor work plus recognition.
- **Syllable reading (קְרִיאַת הֲבָרוֹת):** rows of a letter with each vowel taught (בָּ בֵּ בִּי…), "add the missing
  vowel", and connect syllables to pictures. The Ministry's grade-1 reading tasks check exactly this: reading letter +
  vowel combinations, then words, then short sentences. ([MoE grade-1 reading assessment guide](https://meyda.education.gov.il/files/Yesodi/ivrit/madrich.pdf), [MoE tasks](https://meyda.education.gov.il/files/Yesodi/ivrit/hanchayot.pdf), [MoE on nikud](https://meyda.education.gov.il/files/Mazkirut_Pedagogit/HebrewPrimary/learning-teaching/books/nikod.pdf))
- **Read and draw (קְרָא וְצַיֵּר):** one decodable sentence + a box to draw it: proves comprehension without asking the
  child to write.
- **Cut and paste (גְּזֹר וְהַדְבֵּק):** cut letter / syllable tiles and glue them to build a word under its picture.

## What parents and teachers like (and what we do about it)
- **Short and finishable:** one task per page, big print, lots of white space. → One A4 sheet per task, ≤ ~25 items.
- **Ink-friendly:** black outlines with a little color; works on a black-and-white printer. → Gray lines, color only for
  the start dot, arrows and the color-key swatches (which also carry the color's name).
- **Matches what the child learns now.** → Sheets are built per station / nikud world, a "bundle" for the child's current station.
- **Name line on top** (kids love writing their name). → Every sheet has "שֵׁם: ____", optionally pre-filled.
- **Tracing helps the shape, but free writing teaches recognition better.** ([James & Engelhardt](https://pmc.ncbi.nlm.nih.gov/articles/PMC4274624)) → The writing sheet
  ends with rows to write alone (only a green start dot).
- **Writing with an adult beside the child predicts grade-1 reading.** ([Levin, Aram et al.](https://cris.haifa.ac.il/en/publications/on-the-contribution-of-kindergarten-writing-to-grade-1-literacy-a/)) → A tiny parent tip in each sheet's footer.

## Our choices that need mom (DRAFT)
- Stroke order and the start dots (from `writing.ts`), the notebook line style.
- Which lookalikes appear in "find and circle"; picture words; the sentences for "read and draw" (taken from our
  decodable stories); the colors and pictures in "color by letter"; tasks' wording (we use the child's grammar,
  or plural when no child is chosen).
