"use client";

import { bookHref, booksOf, LIBRARY, READING_STAGES, type Book, type StageId } from "@/content/library";
import type { Child } from "@/lib/store";
import type { BookColors } from "./BookParts";
import { BookTile } from "./StoryShelf";

/** Each reading stage's shelf color. */
export const STAGE_COLORS: Record<StageId, BookColors> = {
  a: { spine: "#f59e0b", cover: "#fef3c7" },
  b: { spine: "#10b981", cover: "#d1fae5" },
  c: { spine: "#ec4899", cover: "#fce7f3" },
  d: { spine: "#0ea5e9", cover: "#e0f2fe" },
  e: { spine: "#8b5cf6", cover: "#ede9fe" },
};

export const stageOf = (id: StageId) => READING_STAGES.find((s) => s.id === id)!;

/** The book to read next: the first one not read yet, in library order. */
export function nextUnread(child: Child): Book | undefined {
  return LIBRARY.find((b) => !child.books?.[b.id]);
}

/** One stage's shelf: its title and vowel marks, the stickers collected, and its 5 books. */
export function StageShelf({ child, stage, next }: { child: Child; stage: StageId; next?: string }) {
  const s = stageOf(stage);
  const books = booksOf(stage);
  const got = books.filter((b) => child.books?.[b.id]);
  const c = STAGE_COLORS[stage];
  return (
    <section className="w-full" aria-label={s.title} data-stage={stage}>
      <div className="mb-3 flex flex-wrap items-center gap-3 px-1">
        <h2 className="nikud rounded-2xl px-4 py-1 text-2xl font-extrabold text-white shadow" style={{ background: c.spine }}>
          {s.title}
        </h2>
        <span className="nikud rounded-2xl bg-white/80 px-3 py-1 text-3xl font-extrabold tracking-wide" style={{ color: c.spine, lineHeight: 1.6 }} aria-hidden>
          {s.marks}
        </span>
        <span className="ms-auto flex gap-0.5 rounded-full bg-white/70 px-3 py-1 text-xl" aria-label="מדבקות">
          {got.length ? got.map((b) => b.cover).join("") : "📗"}
          <span className="ms-1 text-base font-bold opacity-70">
            {got.length}/{books.length}
          </span>
        </span>
      </div>
      <div className="shelf grid grid-cols-3 gap-4 rounded-3xl px-3 pt-4 pb-5 sm:grid-cols-5">
        {books.map((b) => (
          <BookTile
            key={b.id}
            href={bookHref(b)}
            title={b.title}
            cover={b.cover}
            colors={c}
            read={child.books?.[b.id]}
            glow={next === b.id}
            hand={next === b.id}
            small
          />
        ))}
      </div>
    </section>
  );
}
