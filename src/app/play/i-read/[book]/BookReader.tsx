"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { BookCover, BookDone, emojis, PageNav, PicAnswers } from "@/components/BookParts";
import { Guide } from "@/components/Guide";
import { STAGE_COLORS, stageOf } from "@/components/LibraryShelf";
import { ListenButton, useReadAlong, Words, type Segment } from "@/components/ReadAlong";
import { WorldShell } from "@/components/WorldShell";
import {
  BOOK_BY_ID,
  bookHref,
  bubbleKey,
  lineKey,
  nextBook,
  questionKey,
  type Book,
  type BookPage,
  type BookQuestion,
} from "@/content/library";
import { line } from "@/content/voice";
import { popSound, stopAudio } from "@/lib/audio";
import { actions, type Child } from "@/lib/store";
import { useRequiredChild } from "@/lib/useChild";

/**
 * 📗 A library book. Cover → pages (a picture with a speech bubble over the speaker, 2–4 lines under it) →
 * 1–2 questions ("what happened?" pictures, "who said it?" faces) → a sticker, the buddy dances, the next book.
 * The child reads first: a tapped word is said alone; 🔊 reads the page (lines, then the bubble), word by word.
 */
export function BookReader({ bookId }: { bookId: string }) {
  const child = useRequiredChild();
  const book = BOOK_BY_ID[bookId];
  if (!child) return <WorldShell>{null}</WorldShell>;
  return (
    <WorldShell child={child} back={{ href: "/play/i-read", label: "לספרייה" }}>
      <Reader key={bookId} book={book} child={child} />
    </WorldShell>
  );
}

/** Where a "who said it?" quote is in the book (its bubble's audio is reused). */
function quotePage(book: Book, quote: string): number {
  return book.pages.findIndex((p) => p.say?.text === quote);
}

function Reader({ book, child }: { book: Book; child: Child }) {
  const n = book.pages.length;
  const nq = book.questions.length;
  // -1 = cover, 0..n-1 = pages, n..n+nq-1 = the questions, n+nq = done.
  const [at, setAt] = useState(-1);
  const [dir, setDir] = useState<1 | -1>(1);
  // Captured on opening: the very first book gets the 👆 hints; a first read gets the big confetti.
  const [firstEver] = useState(() => !Object.keys(child.books ?? {}).length);
  const [firstRead] = useState(() => !child.books?.[book.id]);
  const [tappedWord, setTappedWord] = useState(false);
  const [listened, setListened] = useState(false);
  const [allFirst, setAllFirst] = useState(true);
  const colors = STAGE_COLORS[book.stage];
  const next = nextBook(book);

  const go = (to: number) => {
    stopAudio();
    popSound();
    setDir(to > at ? 1 : -1);
    setAt(Math.max(-1, to));
  };

  useEffect(() => () => stopAudio(), []);

  const page = at >= 0 && at < n ? book.pages[at] : null;
  const q = at >= n && at < n + nq ? book.questions[at - n] : null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 pt-2 pb-28">
      {at === 0 && (
        <div className="mb-2 w-full">
          <Guide compact once lines={[line("read-yourself", child.gender)]} />
        </div>
      )}

      {at === -1 && (
        <BookCover title={book.title} cover={book.cover} colors={colors} hand={firstEver} onOpen={() => go(0)} badge={stageOf(book.stage).title} />
      )}

      {page && (
        <>
          <div
            key={at}
            className={`book-page ${dir === 1 ? "anim-page-next" : "anim-page-prev"} relative flex w-full max-w-3xl flex-col items-center gap-3 rounded-[2.5rem] border-4 border-white px-3 pt-3 pb-5 shadow-2xl sm:px-5`}
            style={{ background: `linear-gradient(180deg, ${colors.cover} 0%, var(--card) 50%)` }}
            data-page={at}
          >
            <Page
              book={book}
              index={at}
              page={page}
              wordHand={firstEver && at === 0 && !tappedWord}
              listenHand={firstEver && at === 1 && !listened}
              onTap={() => setTappedWord(true)}
              onListen={() => setListened(true)}
            />
            <span className="absolute bottom-2 left-5 text-sm font-bold opacity-50" aria-hidden>
              {at + 1}/{n}
            </span>
          </div>
          <PageNav at={at} n={n} onGo={go} hand={firstEver && at === 0 && tappedWord} />
        </>
      )}

      {q && (
        <Question
          key={at}
          book={book}
          q={q}
          index={at - n}
          child={child}
          onBack={() => go(n - 1)}
          onRight={(firstTry) => {
            const star = allFirst && firstTry;
            setAllFirst(star);
            if (at === n + nq - 1) actions.finishBook(child.id, book.id, star);
            setTimeout(() => go(at + 1), 900);
          }}
        />
      )}

      {at === n + nq && (
        <BookDone
          title={book.title}
          cover={book.cover}
          child={child}
          star={allFirst}
          firstRead={firstRead}
          doneLine="book-done"
          next={next && { href: bookHref(next), title: next.title, cover: next.cover }}
          shelfHref="/play/i-read"
          onAgain={() => {
            setAllFirst(true);
            go(-1);
          }}
        />
      )}
    </div>
  );
}

/** One page: the picture (with the bubble), the lines, and 🔊. */
function Page({
  book,
  index,
  page,
  wordHand,
  listenHand,
  onTap,
  onListen,
}: {
  book: Book;
  index: number;
  page: BookPage;
  wordHand: boolean;
  listenHand: boolean;
  onTap: () => void;
  onListen: () => void;
}) {
  const segments: Segment[] = [
    ...page.lines.map((text, j) => ({ key: lineKey(book.id, index, j), text })),
    ...(page.say ? [{ key: bubbleKey(book.id, index), text: page.say.text }] : []),
  ];
  const bubbleSeg = page.lines.length;
  const { lit, talking, readAll, tapWord } = useReadAlong(segments);
  const tap = (s: number, i: number) => {
    onTap();
    tapWord(s, i);
  };

  return (
    <>
      <Scene
        pic={page.pic}
        bg={page.bg}
        who={page.say?.who}
        speaking={lit?.seg === bubbleSeg}
        bubble={page.say && <Words text={page.say.text} seg={bubbleSeg} lit={lit} onTap={tap} className="gap-x-2" />}
      />
      <div className="flex w-full items-center gap-2">
        <div className="nikud book-lines flex flex-1 flex-col items-center font-extrabold">
          {page.lines.map((text, j) => (
            <Words key={j} text={text} seg={j} lit={lit} onTap={tap} hand={wordHand && j === 0} />
          ))}
        </div>
      </div>
      <ListenButton
        talking={talking}
        hand={listenHand}
        onClick={() => {
          onListen();
          readAll();
        }}
      />
    </>
  );
}

/**
 * The page's picture: each emoji pops in over a faded backdrop. A speech bubble sits above the picture with its
 * tail pointing at the speaker (measured, so it's right at any width); the speaker wiggles while it's read.
 */
function Scene({ pic, bg, who, bubble, speaking = false }: { pic: string; bg?: string; who?: string; bubble?: ReactNode; speaking?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const bub = useRef<HTMLDivElement>(null);
  const spk = useRef<HTMLSpanElement>(null);
  const [tail, setTail] = useState<number | null>(null);
  const items = emojis(pic);
  const speaker = who ? items.indexOf(who) : -1;
  const hasBubble = !!bubble;

  useEffect(() => {
    if (!hasBubble || !box.current) return;
    const measure = () => {
      const b = bub.current?.getBoundingClientRect();
      const s = spk.current?.getBoundingClientRect();
      if (!b || !s || !b.width) return;
      setTail(Math.max(26, Math.min(b.width - 26, s.left + s.width / 2 - b.left)));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(box.current);
    const t = setTimeout(measure, 700); // once everything popped in
    return () => {
      ro.disconnect();
      clearTimeout(t);
    };
  }, [hasBubble, pic, who]);

  return (
    <div
      ref={box}
      className="relative flex min-h-[clamp(9rem,27vh,16rem)] w-full flex-col items-center justify-end overflow-hidden rounded-[2rem] bg-white/60 px-3 pt-3 pb-2"
    >
      {bg && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[clamp(10rem,32vh,18rem)] leading-none opacity-25" aria-hidden>
          {bg}
        </span>
      )}
      {bubble && (
        <div ref={bub} className="book-bubble nikud anim-rise relative z-10 mb-4 max-w-[94%] px-4 py-1 font-extrabold" data-bubble>
          {bubble}
          <span className="book-bubble-tail" style={{ left: tail ?? "50%" }} aria-hidden />
        </div>
      )}
      <div className="relative flex items-end gap-1" aria-hidden>
        {items.map((e, i) => (
          <span
            key={i}
            ref={i === speaker ? spk : undefined}
            className={`anim-scene inline-block leading-none drop-shadow-lg ${bubble ? "text-[clamp(3.6rem,10.5vh,6.5rem)]" : "text-[clamp(4.5rem,14vh,8rem)]"}`}
            style={{ animationDelay: `${200 + i * 160}ms` }}
          >
            <span className={`inline-block ${i === speaker && speaking ? "anim-talk" : ""}`}>{e}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** A question: "what happened?" (read it, pick a picture) or "who said it?" (a bubble, pick a face). */
function Question({
  book,
  q,
  index,
  child,
  onRight,
  onBack,
}: {
  book: Book;
  q: BookQuestion;
  index: number;
  child: Child;
  onRight: (firstTry: boolean) => void;
  onBack: () => void;
}) {
  const seg: Segment =
    q.kind === "pic"
      ? { key: questionKey(book.id, index), text: q.text }
      : { key: bubbleKey(book.id, Math.max(0, quotePage(book, q.quote))), text: q.quote };
  const { lit, talking, readAll, tapWord } = useReadAlong([seg]);

  return (
    <div
      className="anim-page-next flex w-full max-w-3xl flex-col items-center gap-5 rounded-[2.5rem] border-4 border-white bg-[var(--card)] px-4 pt-5 pb-7 shadow-2xl"
      data-question={q.kind}
    >
      {q.kind === "pic" ? (
        <>
          <span className="text-6xl" aria-hidden>
            🤔
          </span>
          <p className="nikud book-lines font-extrabold">
            <Words text={q.text} seg={0} lit={lit} onTap={tapWord} />
          </p>
        </>
      ) : (
        <>
          <Guide compact lines={["who-said"]} />
          <div className="book-bubble nikud relative px-5 py-2 font-extrabold" data-bubble>
            <Words text={q.quote} seg={0} lit={lit} onTap={tapWord} className="gap-x-2" />
            <span className="book-bubble-tail" style={{ left: "50%" }} aria-hidden />
          </div>
          <span className="mt-1 text-5xl" aria-hidden>
            ❓
          </span>
        </>
      )}
      <ListenButton talking={talking} onClick={() => readAll()} />
      <PicAnswers options={q.options} child={child} onRight={onRight} />
      <button onClick={onBack} className="btn-3d nikud bg-white px-5 py-2 text-lg font-bold" aria-label="לחזור לספר">
        → 📖
      </button>
    </div>
  );
}
