import type { ReactNode } from "react";
import { LETTER_BY_ID } from "@/content/letters";
import { strokesFor, toPoints, type Pt } from "@/content/writing";
import { WS_TEXT as T, type FindBox, type MatchRow, type MissingVowel, type Sheet } from "@/content/worksheets";

// 📄 The printable sheets: one A4 page each (`.ws-sheet` in globals.css). Plain markup, no state, so the same
// component serves the preview, the print and the old /print/<letter> page. Ink-friendly: gray lines, black text,
// color only where it helps (the start dot, the arrows, the color key).

export type SheetHead = {
  /** Pre-filled on the name line (else an empty line to write on). */
  name?: string;
  /** The little mascot in the corner (the child's buddy, or 🐞). */
  mascot?: string;
};

export function SheetView({ sheet, head }: { sheet: Sheet; head: SheetHead }) {
  switch (sheet.type) {
    case "write":
      return <WriteSheet letterId={sheet.letterId} head={head} />;
    case "find":
      return <FindSheet sheet={sheet} head={head} />;
    case "match":
      return (
        <Frame head={head} title={T.match} emoji="🖼️" type="match">
          <Instruction>{T.matchHow}</Instruction>
          <MatchColumns rows={sheet.rows} tokens={sheet.tokens} size="big" />
        </Frame>
      );
    case "nikud":
      return <NikudSheet sheet={sheet} head={head} />;
    case "color":
      return <ColorSheet sheet={sheet} head={head} />;
    case "read":
      return <ReadSheet sentences={sheet.sentences} head={head} />;
    case "cut":
      return <CutSheet sheet={sheet} head={head} />;
  }
}

// ---------------------------------------------------------------- frame

function Frame({ head, title, emoji, type, children }: { head: SheetHead; title: string; emoji: string; type: string; children: ReactNode }) {
  return (
    <article className="ws-sheet nikud" data-sheet={type}>
      <header className="flex items-end justify-between gap-[4mm] border-b-[0.6mm] border-slate-300 pb-[2.5mm]">
        <h2 className={`flex items-center gap-[2.5mm] leading-[1.25] font-extrabold whitespace-nowrap ${title.length > 18 ? "text-[7mm]" : "text-[8.5mm]"}`}>
          <span className="ws-emoji text-[9mm]" aria-hidden>
            {emoji}
          </span>
          {title}
        </h2>
        <div className="flex items-end gap-[3mm] text-[5mm]">
          <span className="flex items-end gap-[2mm]">
            {T.name}
            <span className="inline-block min-w-[40mm] border-b-[0.4mm] border-slate-500 px-[1mm] text-center text-[6mm] leading-[1.2] font-bold">
              {head.name ?? " "}
            </span>
          </span>
          <span className="ws-emoji ws-mascot text-[11mm] leading-none" aria-hidden>
            {head.mascot ?? "🐞"}
          </span>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col pt-[4mm]">{children}</div>
      <footer className="pt-[2mm] text-center text-[3mm] text-slate-400">{T.footer}</footer>
    </article>
  );
}

function Instruction({ children }: { children: ReactNode }) {
  return <p className="mb-[4mm] text-[6mm] leading-[1.5] font-bold text-slate-700">{children}</p>;
}

// ---------------------------------------------------------------- ✍️ writing a letter

/** Strokes of one letter inside a row's 100-wide cell (viewBox units of the writing box). */
function LetterInk({ letterId, mode, x }: { letterId: string; mode: "trace" | "start"; x: number }) {
  const strokes = strokesFor(letterId);
  return (
    <g transform={`translate(${x} 0)`}>
      {mode === "trace" &&
        strokes.map((pts, i) => (
          <polyline
            key={i}
            points={toPoints(pts)}
            fill="none"
            stroke="#64748b"
            strokeWidth={3.6}
            strokeDasharray="0.1 4.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      {strokes[0] && <circle cx={strokes[0][0].x} cy={strokes[0][0].y} r="2.8" fill="#22c55e" />}
    </g>
  );
}

/** Letters that go below the line (finals, ק) or above the band (ל): the row shows their extra line. */
function reach(letterId: string) {
  const ys = strokesFor(letterId).flat().map((p) => p.y);
  return { below: Math.max(...ys) > 84, above: Math.min(...ys) < 18 };
}

/** One grade-1 notebook row (right to left): a dashed top line, the baseline, and a dotted line below for finals. */
function NotebookRow({ letterId, cells }: { letterId: string; cells: ("trace" | "start" | "empty")[] }) {
  const n = cells.length;
  const w = n * 100;
  const { below } = reach(letterId);
  return (
    <svg viewBox={`0 0 ${w} 104`} className="block w-full" aria-hidden data-row>
      <line x1="0" x2={w} y1="22" y2="22" stroke="#94a3b8" strokeWidth="0.7" strokeDasharray="3 3" />
      <line x1="0" x2={w} y1="80" y2="80" stroke="#334155" strokeWidth="1" />
      {below && <line x1="0" x2={w} y1="98" y2="98" stroke="#94a3b8" strokeWidth="0.7" strokeDasharray="1 3" />}
      {cells.map((c, i) => (c === "empty" ? null : <LetterInk key={i} letterId={letterId} mode={c} x={w - (i + 1) * 100} />))}
    </svg>
  );
}

/** The model: the letter in ink with its numbered start dots and arrows (DRAFT (mom): the stroke order). */
function ModelLetter({ letterId }: { letterId: string }) {
  const strokes = strokesFor(letterId);
  const { below } = reach(letterId);
  return (
    <svg viewBox="0 0 100 104" className="h-[42mm] w-[40mm]" aria-label={`${LETTER_BY_ID[letterId].name}: ${T.model}`} data-model>
      <line x1="0" x2="100" y1="22" y2="22" stroke="#94a3b8" strokeWidth="0.6" strokeDasharray="3 3" />
      <line x1="0" x2="100" y1="80" y2="80" stroke="#334155" strokeWidth="0.8" />
      {below && <line x1="0" x2="100" y1="98" y2="98" stroke="#94a3b8" strokeWidth="0.6" strokeDasharray="1 3" />}
      {strokes.map((pts, i) => (
        <polyline key={i} points={toPoints(pts)} fill="none" stroke="#1e293b" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {strokes.map((pts, i) => (
        <g key={`m${i}`}>
          {arrowsOn(pts).map((a, k) => (
            <path key={k} d="M -3.4 -3 L 3.4 0 L -3.4 3 Z" fill="#f97316" transform={`translate(${a.x} ${a.y}) rotate(${a.deg})`} />
          ))}
          <circle cx={pts[0].x} cy={pts[0].y} r="5.2" fill="#22c55e" />
          <text x={pts[0].x} y={pts[0].y + 0.3} textAnchor="middle" dominantBaseline="central" fontSize="6.8" fontWeight="800" fill="white">
            {i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}

/** Direction arrows along a stroke: one per ~45 units of length (at least one), never on the start dot. */
function arrowsOn(pts: Pt[]) {
  if (pts.length < 10) return [];
  const n = Math.max(1, Math.min(3, Math.round(pts.length / 45)));
  return Array.from({ length: n }, (_, k) => {
    const i = Math.floor(pts.length * ((k + 1) / (n + 1)));
    const a = pts[i];
    const b = pts[Math.min(pts.length - 1, i + 2)];
    return { x: a.x, y: a.y, deg: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI };
  });
}

export function WriteSheet({ letterId, head }: { letterId: string; head: SheetHead }) {
  const l = LETTER_BY_ID[letterId];
  const word = [...l.word.normalize("NFC")];
  // Highlight the letter inside its word (the first letter, or the last one for a final letter).
  const at = l.final ? word.findLastIndex((c) => c === l.char) : word.findIndex((c) => c === l.char);
  let end = at + 1;
  while (end < word.length && /[֑-ׇ]/.test(word[end])) end++;
  const ROW = 6;
  return (
    <Frame head={head} title={T.write(l.name)} emoji="✍️" type="write">
      <section className="flex h-[52mm] items-stretch gap-[6mm]">
        <div className="flex flex-col items-center rounded-[4mm] border-[0.5mm] border-slate-300 px-[3mm] pt-[1mm] pb-[2mm]">
          <span className="text-[4mm] font-bold text-slate-500">{T.model}</span>
          <ModelLetter letterId={l.id} />
        </div>
        <div className="flex flex-1 flex-col justify-center gap-[3mm] text-[5.5mm]">
          <div className="flex items-center gap-[3mm]">
            <span className="ws-emoji text-[16mm] leading-none" aria-hidden>
              {l.emoji}
            </span>
            <span className="text-[11mm] font-extrabold" data-word>
              {word.slice(0, at).join("")}
              <span className="text-orange-600">{word.slice(at, end).join("")}</span>
              {word.slice(end).join("")}
            </span>
          </div>
          <ul className="flex flex-col gap-[1.5mm] text-[5mm] text-slate-600">
            <li className="flex items-center gap-[2mm]">
              <span className="flex size-[5.5mm] items-center justify-center rounded-full bg-green-500 text-[3.6mm] font-extrabold text-white">1</span>
              {T.start}
            </li>
            <li className="flex items-center gap-[2mm]">
              <svg viewBox="-4 -4 8 8" className="size-[5.5mm]" aria-hidden>
                <path d="M -3.4 -3 L 3.4 0 L -3.4 3 Z" fill="#f97316" transform="rotate(180)" />
              </svg>
              {T.arrow}
            </li>
          </ul>
        </div>
      </section>

      <RowLabel>{T.trace}</RowLabel>
      <NotebookRow letterId={l.id} cells={Array(ROW).fill("trace")} />
      <NotebookRow letterId={l.id} cells={Array(ROW).fill("trace")} />
      <RowLabel>{T.alone}</RowLabel>
      <NotebookRow letterId={l.id} cells={["trace", ...Array(ROW - 1).fill("start")]} />
      <NotebookRow letterId={l.id} cells={["start", ...Array(ROW - 1).fill("empty")]} />
      <NotebookRow letterId={l.id} cells={Array(ROW).fill("empty")} />
      <NotebookRow letterId={l.id} cells={Array(ROW).fill("empty")} />
    </Frame>
  );
}

function RowLabel({ children }: { children: ReactNode }) {
  return <p className="mt-[3mm] text-[5mm] font-bold text-slate-600">{children}</p>;
}

// ---------------------------------------------------------------- 🔎 find and circle

function FindSheet({ sheet, head }: { sheet: Extract<Sheet, { type: "find" }>; head: SheetHead }) {
  const how = sheet.unit === "letter" ? T.findLetter : T.findSyllable;
  return (
    <Frame head={head} title={T.find} emoji="🔎" type="find">
      <div className="flex flex-1 flex-col justify-around gap-[6mm]">
        {sheet.boxes.map((b, i) => (
          <FindGrid key={i} box={b} how={how} single={sheet.boxes.length === 1} unit={sheet.unit} />
        ))}
      </div>
    </Frame>
  );
}

function FindGrid({ box, how, single, unit }: { box: FindBox; how: string; single: boolean; unit: "letter" | "syllable" }) {
  const rows = Math.ceil(box.cells.length / box.cols);
  const cell = single ? 22 : 21; // mm
  return (
    <section className="flex flex-col gap-[3mm]">
      <div className="flex items-center gap-[4mm]">
        <span className="flex items-center gap-[2mm]">
          {box.targets.map((t) => (
            <span key={t} className="flex size-[17mm] items-center justify-center rounded-full border-[0.8mm] border-slate-800 text-[10mm] leading-none font-extrabold">
              {t}
            </span>
          ))}
        </span>
        <span className="text-[6mm] leading-[1.4] font-bold text-slate-700">{how}</span>
      </div>
      <div
        className="mx-auto grid rounded-[4mm] border-[0.5mm] border-slate-300 p-[3mm]"
        style={{ gridTemplateColumns: `repeat(${box.cols}, ${cell}mm)`, gridTemplateRows: `repeat(${rows}, ${cell * 0.82}mm)` }}
        data-grid
      >
        {box.cells.map((c, i) => (
          <span key={i} className={`flex items-center justify-center leading-none font-bold ${unit === "letter" ? "text-[12mm]" : "text-[10mm]"}`}>
            {c}
          </span>
        ))}
      </div>
      <p className="text-[5.5mm] text-slate-600">
        {T.howMany} <span className="inline-block w-[18mm] border-b-[0.4mm] border-slate-500" />
      </p>
    </section>
  );
}

// ---------------------------------------------------------------- 🖼️ connect pictures and letters/syllables

function MatchColumns({ rows, tokens, size }: { rows: MatchRow[]; tokens: string[]; size: "big" | "small" }) {
  const box = size === "big" ? "size-[26mm]" : "size-[19mm]";
  return (
    <div className="flex flex-1 flex-col justify-around" data-match>
      {rows.map((row, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="flex items-center gap-[3mm]">
            <span className={`ws-emoji flex ${box} items-center justify-center rounded-[4mm] border-[0.5mm] border-slate-300 ${size === "big" ? "text-[17mm]" : "text-[12mm]"} leading-none`}>
              {row.pic}
            </span>
            <Dot />
          </div>
          <div className="flex items-center gap-[3mm]">
            <Dot />
            <span
              className={`flex ${box} items-center justify-center rounded-[4mm] border-[0.6mm] border-slate-700 ${size === "big" ? "text-[15mm]" : "text-[11mm]"} leading-none font-extrabold`}
            >
              {tokens[i]}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

const Dot = () => <span className="inline-block size-[3.5mm] rounded-full bg-slate-800" />;

// ---------------------------------------------------------------- 🔊 nikud: syllables ↔ pictures + the missing vowel

function NikudSheet({ sheet, head }: { sheet: Extract<Sheet, { type: "nikud" }>; head: SheetHead }) {
  return (
    <Frame head={head} title={T.nikud} emoji="🔊" type="nikud">
      <Instruction>{T.nikudHow}</Instruction>
      <div className="flex h-[118mm] flex-col">
        <MatchColumns rows={sheet.rows} tokens={sheet.tokens} size="small" />
      </div>
      <div className="mt-[5mm] border-t-[0.5mm] border-dashed border-slate-300 pt-[4mm]">
        <div className="flex items-center justify-between">
          <Instruction>{T.missingHow}</Instruction>
          <span className="mb-[4mm] flex gap-[3mm] rounded-[3mm] bg-slate-100 px-[4mm] py-[1mm] text-[9mm] leading-[1.4] font-bold" data-bank>
            {sheet.bank.map((b) => (
              <span key={b}>{b}</span>
            ))}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-[8mm] gap-y-[7mm] px-[4mm]">
          {sheet.missing.map((m, i) => (
            <Missing key={i} m={m} />
          ))}
        </div>
      </div>
    </Frame>
  );
}

function Missing({ m }: { m: MissingVowel }) {
  return (
    <div className="flex items-center gap-[2.5mm]" data-missing>
      <span className="ws-emoji text-[15mm] leading-none" aria-hidden>
        {m.pic}
      </span>
      <span className="text-[13mm] leading-[1.6] font-bold whitespace-nowrap">
        {m.before}
        {m.place === "vav" ? (
          <span className="mx-[0.8mm] inline-block h-[12mm] w-[7mm] translate-y-[2mm] rounded-[1mm] border-[0.4mm] border-dashed border-slate-500" />
        ) : (
          <span className="relative inline-block">
            {m.letter}
            <span
              className={`absolute left-1/2 size-[6mm] -translate-x-1/2 rounded-full border-[0.4mm] border-dashed border-slate-500 ${
                m.place === "under" ? "bottom-[-2.5mm]" : "top-[-2mm]"
              }`}
            />
          </span>
        )}
        {m.after}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------- 🎨 color by letter

function ColorSheet({ sheet, head }: { sheet: Extract<Sheet, { type: "color" }>; head: SheetHead }) {
  const cols = sheet.pattern[0].length;
  const cell = 15; // mm
  return (
    <Frame head={head} title={sheet.unit === "letter" ? T.colorLetter : T.colorSyllable} emoji="🎨" type="color">
      <Instruction>{T.color}</Instruction>
      <div className="mb-[5mm] flex flex-wrap justify-center gap-x-[7mm] gap-y-[3mm]" data-key>
        {sheet.keys.map((k) => (
          <span key={k.token} className="flex items-center gap-[2mm] rounded-[3mm] border-[0.5mm] border-slate-300 px-[3mm] py-[1mm]">
            <span className="text-[10mm] leading-[1.3] font-extrabold">{k.token}</span>
            <span className="text-[6mm]">=</span>
            <span className="inline-block size-[8mm] rounded-full border-[0.4mm] border-slate-500" style={{ background: k.color }} />
            <span className="text-[6mm] font-bold">{k.name}</span>
          </span>
        ))}
      </div>
      <div
        className="mx-auto grid border-[0.5mm] border-slate-400"
        style={{ gridTemplateColumns: `repeat(${cols}, ${cell}mm)`, gridAutoRows: `${cell}mm` }}
        data-grid
      >
        {sheet.pattern.flatMap((row, y) =>
          [...row].map((ch, x) => {
            const k = sheet.keys[sheet.slots.indexOf(ch)];
            return (
              <span
                key={`${y}-${x}`}
                className={`flex items-center justify-center border-[0.2mm] border-slate-300 leading-none font-bold text-slate-600 ${
                  sheet.unit === "letter" ? "text-[6.5mm]" : "text-[5mm]"
                }`}
              >
                {k?.token}
              </span>
            );
          }),
        )}
      </div>
    </Frame>
  );
}

// ---------------------------------------------------------------- 📖 read and draw

function ReadSheet({ sentences, head }: { sentences: string[]; head: SheetHead }) {
  return (
    <Frame head={head} title={T.read} emoji="📖" type="read">
      <Instruction>{T.readHow}</Instruction>
      <div className="flex flex-1 flex-col justify-between gap-[5mm]">
        {sentences.map((s, i) => (
          <section key={i} className="flex flex-1 flex-col gap-[2mm]">
            <p className="text-[10mm] leading-[1.6] font-bold" data-sentence>
              {s}
            </p>
            <div className="flex-1 rounded-[4mm] border-[0.6mm] border-slate-400" />
          </section>
        ))}
      </div>
    </Frame>
  );
}

// ---------------------------------------------------------------- ✂️ cut and paste

function CutSheet({ sheet, head }: { sheet: Extract<Sheet, { type: "cut" }>; head: SheetHead }) {
  const tile = "h-[19mm] w-[19mm]";
  return (
    <Frame head={head} title={T.cut} emoji="✂️" type="cut">
      <Instruction>{sheet.unit === "letter" ? T.cutLetters : T.cutSyllables}</Instruction>
      <div className="flex flex-1 flex-col justify-around">
        {sheet.words.map((w, i) => (
          <div key={i} className="flex items-center gap-[5mm]" data-cut-word>
            <span className="ws-emoji flex size-[24mm] items-center justify-center text-[18mm] leading-none" aria-hidden>
              {w.pic}
            </span>
            <div className="flex flex-col gap-[1mm]">
              {w.showModel && <span className="text-[8mm] leading-[1.5] font-bold text-slate-500">{w.word}</span>}
              <div className="flex gap-[2mm]">
                {w.tiles.map((_, k) => (
                  <span key={k} className={`${tile} rounded-[2mm] border-[0.5mm] border-dashed border-slate-500 bg-slate-50`} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-[4mm] border-t-[0.6mm] border-dashed border-slate-500 pt-[3mm]">
        <p className="mb-[3mm] text-[5mm] font-bold text-slate-600">{T.cutHere}</p>
        <div className="flex flex-wrap justify-center gap-0" data-tiles>
          {sheet.tiles.map((t, i) => (
            <span key={i} className={`flex ${tile} items-center justify-center border-[0.5mm] border-slate-700 text-[10mm] leading-none font-extrabold`}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </Frame>
  );
}
