"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BuddyAvatar } from "@/components/BuddyAvatar";
import { Confetti } from "@/components/Confetti";
import { Guide } from "@/components/Guide";
import { PointHand } from "@/components/PointHand";
import { STORY_COLORS, storyHref } from "@/components/StoryShelf";
import { WorldShell } from "@/components/WorldShell";
import { STORIES, STORY_BY_ID, storyAudioKey, storyWords, type Story } from "@/content/stories";
import { line, PRAISE } from "@/content/voice";
import { popSound, rightSound, say, sparkleSound, stopAudio, wrongSound } from "@/lib/audio";
import { cheer } from "@/lib/buddy";
import { actions, type Child } from "@/lib/store";
import { pageAudio, playPage, playWord } from "@/lib/storyAudio";
import { pick as pickOne, shuffle } from "@/lib/random";
import { useRequiredChild } from "@/lib/useChild";

/**
 * 📖 The read-along reader. Cover → one sentence per page (the picture above) → "what happened?" → a sticker.
 * The child reads first: tapping a word says just that word; 🔊 reads the page and lights each word as it's said.
 * Works without audio (text only): words still bounce when tapped, and 🔊 hides.
 */
export function StoryReader({ storyId }: { storyId: string }) {
  const child = useRequiredChild();
  const story = STORY_BY_ID[storyId];
  if (!child) return <WorldShell>{null}</WorldShell>;
  return (
    <WorldShell child={child} back={{ href: `/play/stories/${story.world}`, label: "למדף הספרים" }}>
      <Reader key={storyId} story={story} child={child} />
    </WorldShell>
  );
}

/** The next book after this one: the same world's next, then the next world's first. */
function nextStory(story: Story): Story | undefined {
  return STORIES[STORIES.indexOf(story) + 1];
}

/** Splits an emoji scene into its emoji (so each one can pop in on its own). */
function emojis(s: string): string[] {
  try {
    return [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(s)].map((g) => g.segment);
  } catch {
    return [s];
  }
}

function Reader({ story, child }: { story: Story; child: Child }) {
  const n = story.pages.length;
  // -1 = cover, 0..n-1 = pages, n = the question, n+1 = done.
  const [at, setAt] = useState(-1);
  const [dir, setDir] = useState<1 | -1>(1);
  // Captured on opening: the very first story ever gets the 👆 hints; a first read gets the sticker flying in.
  const [firstEver] = useState(() => !Object.keys(child.stories ?? {}).length);
  const [firstRead] = useState(() => !child.stories?.[story.id]);
  const [tappedWord, setTappedWord] = useState(false);
  const [star, setStar] = useState(false);
  const colors = STORY_COLORS[story.world];

  const go = (to: number) => {
    stopAudio();
    popSound();
    setDir(to > at ? 1 : -1);
    setAt(to);
  };

  useEffect(() => () => stopAudio(), []);

  const page = at >= 0 && at < n ? story.pages[at] : null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 pt-2 pb-28">
      {at === 0 && (
        <div className="mb-2 w-full">
          <Guide compact once lines={[line("read-yourself", child.gender)]} />
        </div>
      )}

      {at === -1 && (
        <Cover story={story} colors={colors} hand={firstEver} onOpen={() => go(0)} />
      )}

      {page && (
        <>
          <div
            key={at}
            className={`story-page ${dir === 1 ? "anim-page-next" : "anim-page-prev"} relative flex w-full max-w-3xl flex-col items-center gap-4 rounded-[2.5rem] border-4 border-white px-4 pt-4 pb-6 shadow-2xl`}
            style={{ background: `linear-gradient(180deg, ${colors.cover} 0%, var(--card) 55%)` }}
          >
            <Scene pic={page.pic} bg={page.bg} />
            <Sentence
              audioKey={storyAudioKey(story.id, at)}
              text={page.text}
              hand={firstEver && at === 0 && !tappedWord}
              onTap={() => setTappedWord(true)}
            />
            <span className="absolute bottom-2 left-5 text-sm font-bold opacity-50" aria-hidden>
              {at + 1}/{n}
            </span>
          </div>
          <div className="mt-5 flex w-full max-w-3xl items-center justify-between gap-3">
            <button
              onClick={() => go(at - 1)}
              aria-label="לעמוד הקודם"
              className="btn-3d flex h-16 w-16 items-center justify-center bg-white text-3xl font-extrabold"
            >
              →
            </button>
            <Dots n={n} at={at} />
            <button
              onClick={() => go(at + 1)}
              aria-label={at === n - 1 ? "לשאלה" : "לעמוד הבא"}
              className="btn-3d relative flex h-20 w-24 items-center justify-center bg-accent text-4xl font-extrabold text-white"
            >
              ←{firstEver && at === 0 && tappedWord && <PointHand className="-bottom-8 -left-1" />}
            </button>
          </div>
        </>
      )}

      {at === n && (
        <Question
          story={story}
          child={child}
          onRight={(firstTry) => {
            setStar(firstTry);
            actions.finishStory(child.id, story.id, firstTry);
            setTimeout(() => go(n + 1), 900);
          }}
          onBack={() => go(n - 1)}
        />
      )}

      {at === n + 1 && <Done story={story} child={child} star={star} firstRead={firstRead} onAgain={() => go(-1)} />}
    </div>
  );
}

function Cover({ story, colors, hand, onOpen }: { story: Story; colors: { spine: string; cover: string }; hand: boolean; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      aria-label="לפתוח את הספר"
      className="btn-3d anim-rise relative mt-4 flex w-full max-w-md flex-col items-center gap-4 px-6 pt-8 pb-8"
      style={{ borderInlineStart: `22px solid ${colors.spine}`, background: `linear-gradient(160deg, white 0%, ${colors.cover} 100%)` }}
    >
      <span className="anim-bob text-[9rem] leading-none drop-shadow-lg" aria-hidden>
        {story.cover}
      </span>
      <span className="nikud text-center text-5xl font-extrabold">{story.title}</span>
      <span className="mt-2 flex h-16 w-24 items-center justify-center rounded-3xl bg-accent text-4xl font-extrabold text-white shadow" aria-hidden>
        📖
      </span>
      {hand && <PointHand className="-bottom-4 left-1/3" />}
    </button>
  );
}

/** The page's picture: each emoji pops in, over a big faded backdrop (the sea, a tree, the night…). */
function Scene({ pic, bg }: { pic: string; bg?: string }) {
  return (
    <div className="relative flex h-[clamp(9rem,30vh,17rem)] w-full items-center justify-center overflow-hidden rounded-[2rem] bg-white/60" aria-hidden>
      {bg && <span className="absolute inset-0 flex items-center justify-center text-[clamp(10rem,34vh,19rem)] leading-none opacity-25">{bg}</span>}
      <div className="relative flex items-end gap-1">
        {emojis(pic).map((e, i) => (
          <span
            key={i}
            className="anim-scene inline-block text-[clamp(4.5rem,15vh,8.5rem)] leading-none drop-shadow-lg"
            style={{ animationDelay: `${200 + i * 160}ms` }}
          >
            {e}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * One sentence, every word a button. Tap → that word (from the page audio); 🔊 → the whole page, word by word.
 * `autoPlay` reads it once on arrival (the question).
 */
function Sentence({
  audioKey,
  text,
  hand = false,
  onTap,
  autoPlay = false,
  small = false,
}: {
  audioKey: string;
  text: string;
  hand?: boolean;
  onTap?: () => void;
  autoPlay?: boolean;
  small?: boolean;
}) {
  const words = storyWords(text);
  const audio = pageAudio(audioKey, text);
  const [lit, setLit] = useState<number | null>(null);
  const [bounce, setBounce] = useState<{ i: number; n: number } | null>(null);
  const [talking, setTalking] = useState(false);

  const readAll = () => {
    if (!audio) return;
    setTalking(true);
    playPage(audio, setLit).then(() => setTalking(false));
  };

  useEffect(() => {
    if (!autoPlay || !audio) return;
    const t = setTimeout(() => {
      setTalking(true);
      playPage(audio, setLit).then(() => setTalking(false));
    }, 500);
    return () => clearTimeout(t);
  }, [autoPlay, audio]);

  const tap = (i: number) => {
    onTap?.();
    setBounce((b) => ({ i, n: (b?.n ?? 0) + 1 }));
    setTalking(false);
    if (!audio) {
      popSound();
      return;
    }
    setLit(i);
    playWord(audio, i).then(() => setLit((l) => (l === i ? null : l)));
  };

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <p
        className={`nikud flex flex-wrap justify-center gap-x-3 gap-y-1 font-extrabold ${small ? "text-4xl sm:text-5xl" : "text-5xl sm:text-6xl"}`}
        style={{ lineHeight: 1.7 }}
      >
        {words.map((w, i) => (
          <button
            key={`${i}-${bounce?.i === i ? bounce.n : 0}`}
            onClick={() => tap(i)}
            data-word={i}
            data-lit={lit === i || undefined}
            className={`story-word relative rounded-2xl px-1.5 ${bounce?.i === i ? "anim-word" : ""}`}
          >
            {w}
            {hand && i === 0 && <PointHand className="-bottom-10 left-1/2" />}
          </button>
        ))}
      </p>
      {audio && (
        <button
          onClick={readAll}
          aria-label="להקשיב"
          className={`btn-3d flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl ${talking ? "anim-talk" : ""}`}
        >
          🔊
        </button>
      )}
    </div>
  );
}

function Dots({ n, at }: { n: number; at: number }) {
  return (
    <div className="flex items-center gap-2" aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className={`h-3.5 rounded-full transition-all ${i === at ? "w-8 bg-accent" : i < at ? "w-3.5 bg-accent/50" : "w-3.5 bg-white"}`} />
      ))}
    </div>
  );
}

/** "What happened?": the question (read aloud if we have it) and 3 picture answers. A wrong tap just wobbles. */
function Question({
  story,
  child,
  onRight,
  onBack,
}: {
  story: Story;
  child: Child;
  onRight: (firstTry: boolean) => void;
  onBack: () => void;
}) {
  const right = story.question.options[0];
  const [order] = useState(() => shuffle(story.question.options));
  const [misses, setMisses] = useState(0);
  const [wrong, setWrong] = useState<{ o: string; n: number } | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  const pick = (o: string) => {
    if (picked) return;
    if (o === right) {
      setPicked(o);
      rightSound();
      cheer("happy");
      const p = pickOne(PRAISE);
      say(p === "champ" ? line("champ", child.gender) : p);
      onRight(misses === 0);
      return;
    }
    wrongSound();
    cheer("oops");
    setMisses((m) => m + 1);
    setWrong((w) => ({ o, n: (w?.n ?? 0) + 1 }));
  };

  return (
    <div className="anim-page-next flex w-full max-w-3xl flex-col items-center gap-6 rounded-[2.5rem] border-4 border-white bg-[var(--card)] px-4 pt-6 pb-8 shadow-2xl">
      <span className="text-6xl" aria-hidden>
        🤔
      </span>
      <Sentence audioKey={storyAudioKey(story.id, "q")} text={story.question.text} autoPlay small />
      <div className="grid w-full grid-cols-3 gap-3 sm:gap-5" role="group" aria-label="תשובות">
        {order.map((o) => (
          <button
            key={`${o}-${wrong?.o === o ? wrong.n : 0}`}
            onClick={() => pick(o)}
            data-answer={o === right ? "right" : "wrong"}
            className={`btn-3d flex aspect-square items-center justify-center bg-white text-[clamp(3rem,10vw,5.5rem)] leading-none ${
              wrong?.o === o ? "anim-shake" : ""
            } ${picked === o ? "anim-word ring-8 ring-green-400" : ""} ${picked && picked !== o ? "opacity-40" : ""}`}
          >
            {o}
          </button>
        ))}
      </div>
      <button onClick={onBack} className="btn-3d nikud bg-white px-5 py-2 text-lg font-bold" aria-label="לחזור לסיפור">
        → 📖
      </button>
    </div>
  );
}

/** The end: confetti, the book's sticker (⭐ if the question was right on the first try), the buddy dancing. */
function Done({ story, child, star, firstRead, onAgain }: { story: Story; child: Child; star: boolean; firstRead: boolean; onAgain: () => void }) {
  const next = nextStory(story);
  useEffect(() => {
    sparkleSound();
    const t = setTimeout(() => cheer("party"), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-6 pt-2">
      <Confetti count={firstRead ? 70 : 40} />
      <Guide compact lines={[line("story-done", child.gender)]} />
      <div className="flex items-end gap-6">
        <div className="anim-fly relative flex h-40 w-40 items-center justify-center rounded-full border-8 border-white bg-[var(--card)] text-[6rem] shadow-2xl">
          {story.cover}
          <span
            className={`absolute -top-1 -left-1 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white text-3xl font-extrabold text-white shadow ${
              star ? "bg-amber-400" : "bg-green-500"
            }`}
            aria-label={star ? "כוכב" : "קראת"}
          >
            {star ? "⭐" : "✓"}
          </span>
        </div>
        {child.buddy && (
          <span className="anim-dance-loop inline-block origin-bottom">
            <BuddyAvatar buddy={child.buddy} wearing={child.wearing} size={100} />
          </span>
        )}
      </div>
      <p className="nikud text-3xl font-extrabold">{story.title}</p>

      <div className="mt-4 flex w-full flex-col gap-3">
        {next && (
          <Link
            href={storyHref(next)}
            className="btn-3d nikud anim-glow flex items-center justify-center gap-3 bg-accent px-5 py-4 text-2xl font-extrabold text-white"
          >
            <span className="text-4xl" aria-hidden>
              {next.cover}
            </span>
            {next.title} ←
          </Link>
        )}
        <div className="flex gap-3">
          <button onClick={onAgain} className="btn-3d nikud flex-1 bg-white px-5 py-4 text-xl font-bold">
            🔁 עוֹד פַּעַם
          </button>
          <Link href={`/play/stories/${story.world}`} className="btn-3d nikud flex-1 bg-white px-5 py-4 text-center text-xl font-bold">
            📚 לַמַּדָּף
          </Link>
        </div>
      </div>
    </div>
  );
}
