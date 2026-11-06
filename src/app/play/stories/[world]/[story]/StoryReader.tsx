"use client";

import { useEffect, useState } from "react";
import { BookCover, BookDone, emojis, PageNav, PicAnswers } from "@/components/BookParts";
import { Guide } from "@/components/Guide";
import { ListenButton, useReadAlong, Words } from "@/components/ReadAlong";
import { STORY_COLORS, storyHref } from "@/components/StoryShelf";
import { WorldShell } from "@/components/WorldShell";
import { STORIES, STORY_BY_ID, storyAudioKey, type Story } from "@/content/stories";
import { line } from "@/content/voice";
import { popSound, stopAudio } from "@/lib/audio";
import { actions, type Child } from "@/lib/store";
import { pageAudio } from "@/lib/storyAudio";
import { useRequiredChild } from "@/lib/useChild";

/**
 * 📖 The read-along reader. Cover → one sentence per page (the picture above) → "what happened?" → a sticker.
 * The child reads first: tapping a word says just that word; 🔊 reads the page and lights each word as it's said.
 * Without a recording, the device's Hebrew voice reads (components/ReadAlong).
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
  const next = nextStory(story);

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

      {at === -1 && <BookCover title={story.title} cover={story.cover} colors={colors} hand={firstEver} onOpen={() => go(0)} />}

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
          <PageNav at={at} n={n} onGo={go} hand={firstEver && at === 0 && tappedWord} />
        </>
      )}

      {at === n && (
        <div className="anim-page-next flex w-full max-w-3xl flex-col items-center gap-6 rounded-[2.5rem] border-4 border-white bg-[var(--card)] px-4 pt-6 pb-8 shadow-2xl">
          <span className="text-6xl" aria-hidden>
            🤔
          </span>
          <Sentence audioKey={storyAudioKey(story.id, "q")} text={story.question.text} autoPlay small />
          <PicAnswers
            options={story.question.options}
            child={child}
            onRight={(firstTry) => {
              setStar(firstTry);
              actions.finishStory(child.id, story.id, firstTry);
              setTimeout(() => go(n + 1), 900);
            }}
          />
          <button onClick={() => go(n - 1)} className="btn-3d nikud bg-white px-5 py-2 text-lg font-bold" aria-label="לחזור לסיפור">
            → 📖
          </button>
        </div>
      )}

      {at === n + 1 && (
        <BookDone
          title={story.title}
          cover={story.cover}
          child={child}
          star={star}
          firstRead={firstRead}
          doneLine="story-done"
          next={next && { href: storyHref(next), title: next.title, cover: next.cover }}
          shelfHref={`/play/stories/${story.world}`}
          onAgain={() => go(-1)}
        />
      )}
    </div>
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
 * One sentence, every word a button. Tap → that word; 🔊 → the whole sentence, word by word.
 * `autoPlay` reads it once on arrival (the question), only when it has a real recording.
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
  const { lit, talking, readAll, tapWord } = useReadAlong([{ key: audioKey, text }]);
  const recorded = !!pageAudio(audioKey, text);

  useEffect(() => {
    if (!autoPlay || !recorded) return;
    const t = setTimeout(() => readAll(), 500);
    return () => clearTimeout(t);
    // Once, on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, recorded]);

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <p className={`nikud font-extrabold ${small ? "text-4xl sm:text-5xl" : "text-5xl sm:text-6xl"}`} style={{ lineHeight: 1.7 }}>
        <Words
          text={text}
          seg={0}
          lit={lit}
          hand={hand}
          onTap={(s, i) => {
            onTap?.();
            tapWord(s, i);
          }}
          className="gap-y-1"
        />
      </p>
      <ListenButton talking={talking} onClick={() => readAll()} />
    </div>
  );
}
