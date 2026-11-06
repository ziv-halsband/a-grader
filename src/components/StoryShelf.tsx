"use client";

import Link from "next/link";
import { NIKUD_TOPICS } from "@/content/curriculum";
import { STORIES, storiesOf, type Story, type StoryWorld } from "@/content/stories";
import type { Child, StoryRead } from "@/lib/store";
import type { BookColors } from "./BookParts";
import { PointHand } from "./PointHand";

/** Each shelf's book color (the spine and the cover's glow). */
export const STORY_COLORS: Record<StoryWorld, BookColors> = {
  "kamatz-patach": { spine: "#f59e0b", cover: "#fef3c7" },
  "tsere-segol": { spine: "#0ea5e9", cover: "#e0f2fe" },
  hiriq: { spine: "#ec4899", cover: "#fce7f3" },
  holam: { spine: "#10b981", cover: "#d1fae5" },
  "shuruk-kubutz": { spine: "#8b5cf6", cover: "#ede9fe" },
  shva: { spine: "#f97316", cover: "#ffedd5" },
  "all-nikud": { spine: "#e11d48", cover: "#fef9c3" },
};

/** The last shelf isn't a nikud world: its own title and badge. */
const ALL_NIKUD = { title: "כָּל הַנִּקּוּד", icon: "🌈" };

export function shelfTitle(world: StoryWorld): { title: string; icon: string } {
  return world === "all-nikud" ? ALL_NIKUD : NIKUD_TOPICS.find((t) => t.id === world)!;
}

export const storyHref = (s: Story) => `/play/stories/${s.world}/${s.id}`;

/**
 * A book on a shelf (stories and library books alike): its cover picture and title;
 * ✓ once read, ⭐ if its questions were right on the first try. `glow`: the next book to read.
 */
export function BookTile({
  href,
  title,
  cover,
  colors,
  read,
  hand = false,
  glow = false,
  small = false,
}: {
  href: string;
  title: string;
  cover: string;
  colors: BookColors;
  read?: StoryRead;
  hand?: boolean;
  glow?: boolean;
  small?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={title}
      className={`btn-3d book-card relative flex flex-col items-center overflow-visible bg-white ${small ? "gap-1 pt-2 pb-2" : "gap-2 pt-4 pb-3"} ${
        glow ? "anim-glow" : ""
      }`}
      style={{ borderInlineStart: `${small ? 10 : 14}px solid ${colors.spine}`, background: `linear-gradient(160deg, white 0%, ${colors.cover} 100%)` }}
    >
      <span className={`leading-none drop-shadow ${small ? "text-5xl" : "text-7xl"}`} aria-hidden>
        {cover}
      </span>
      <span className={`nikud px-1 text-center font-extrabold ${small ? "text-base leading-tight" : "text-xl leading-snug"}`}>{title}</span>
      {read && (
        <span
          className={`anim-sticker absolute -top-3 -left-3 flex items-center justify-center rounded-full border-4 border-white font-extrabold text-white shadow ${
            small ? "h-9 w-9 text-lg" : "h-12 w-12 text-2xl"
          } ${read.star ? "bg-amber-400" : "bg-green-500"}`}
          aria-label={read.star ? "קראת, כוכב" : "קראת"}
        >
          {read.star ? "⭐" : "✓"}
        </span>
      )}
      {hand && <PointHand className="-bottom-6 -left-2" />}
    </Link>
  );
}

/** A short story on the shelf. */
export function BookCard({ story, child, hand = false, small = false }: { story: Story; child: Child; hand?: boolean; small?: boolean }) {
  return (
    <BookTile
      href={storyHref(story)}
      title={story.title}
      cover={story.cover}
      colors={STORY_COLORS[story.world]}
      read={child.stories?.[story.id]}
      hand={hand}
      small={small}
    />
  );
}

/** The stickers this child got from a world's books (each book's cover), in shelf order. */
export function shelfStickers(child: Child, world: StoryWorld): string[] {
  return storiesOf(world)
    .filter((s) => child.stories?.[s.id])
    .map((s) => s.cover);
}

/** One world's shelf: its 6 books, and the strip of stickers collected from them. */
export function WorldShelf({ child, world, small = false, handOn }: { child: Child; world: StoryWorld; small?: boolean; handOn?: string }) {
  const topic = shelfTitle(world);
  const stories = storiesOf(world);
  const stickers = shelfStickers(child, world);
  return (
    <section className="w-full" aria-label={topic.title}>
      <div className="mb-3 flex items-center gap-3 px-1">
        <span
          className="nikud flex h-12 min-w-12 items-center justify-center rounded-2xl px-2 text-3xl font-extrabold text-white shadow"
          style={{ background: STORY_COLORS[world].spine }}
        >
          {topic.icon}
        </span>
        <h2 className="nikud text-2xl font-extrabold">{topic.title}</h2>
        <span className="ms-auto flex gap-0.5 rounded-full bg-white/70 px-3 py-1 text-xl" aria-label="מדבקות">
          {stickers.length ? stickers.join("") : "📚"}
          <span className="ms-1 text-base font-bold opacity-70">
            {stickers.length}/{stories.length}
          </span>
        </span>
      </div>
      <div className={`shelf grid gap-4 rounded-3xl px-3 pt-4 pb-5 ${small ? "grid-cols-3 sm:grid-cols-6" : "grid-cols-2 sm:grid-cols-3"}`}>
        {stories.map((s) => (
          <BookCard key={s.id} story={s} child={child} small={small} hand={handOn === s.id} />
        ))}
      </div>
    </section>
  );
}

/** Where the 👆 goes the first time: the first book on the shelf, while the child hasn't read any story yet. */
export function firstBookHand(child: Child, stories: Story[]): string | undefined {
  return Object.keys(child.stories ?? {}).length ? undefined : stories[0]?.id;
}

/**
 * The all-shelves page's 👆: the very first book before any story is read; then, once every nikud world's
 * shelf is read, the first unread book of the last shelf (🌈 כָּל הַנִּקּוּד).
 */
export function allShelvesHand(child: Child): string | undefined {
  const first = firstBookHand(child, STORIES);
  if (first) return first;
  const read = (s: Story) => !!child.stories?.[s.id];
  const others = STORIES.filter((s) => s.world !== "all-nikud");
  if (!others.every(read)) return undefined;
  return storiesOf("all-nikud").find((s) => !read(s))?.id;
}
