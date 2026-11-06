"use client";

import { Guide } from "@/components/Guide";
import { firstBookHand, WorldShelf } from "@/components/StoryShelf";
import { WorldShell } from "@/components/WorldShell";
import { STORIES, STORY_WORLDS } from "@/content/stories";
import { useRequiredChild } from "@/lib/useChild";

/** 📚 The big map's "stories" station: every nikud world's shelf, in teaching order. */
export default function StoriesPage() {
  const child = useRequiredChild();
  if (!child) return <WorldShell>{null}</WorldShell>;
  const hand = firstBookHand(child, STORIES);
  return (
    <WorldShell child={child} back={{ href: "/play", label: "למפה הגדולה" }}>
      <h1 className="nikud mt-4 text-center text-3xl font-extrabold">📚 סִפּוּרִים</h1>
      <div className="mt-3">
        <Guide compact once lines={["stories-shelf"]} />
      </div>
      <div className="mx-auto mt-6 flex w-full max-w-4xl flex-col gap-8 px-4 pb-32">
        {STORY_WORLDS.map((w) => (
          <WorldShelf key={w} child={child} world={w} small handOn={hand} />
        ))}
      </div>
    </WorldShell>
  );
}
