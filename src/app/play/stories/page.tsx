"use client";

import { Guide } from "@/components/Guide";
import { allShelvesHand, WorldShelf } from "@/components/StoryShelf";
import { WorldShell } from "@/components/WorldShell";
import { STORY_WORLDS } from "@/content/stories";
import { useRequiredChild } from "@/lib/useChild";

/**
 * 📚 Every short-story shelf: each nikud world in teaching order, then 🌈 כָּל הַנִּקּוּד.
 * (Not on the big map anymore: each nikud world links to its own shelf, and the nikud map to the last one.)
 */
export default function StoriesPage() {
  const child = useRequiredChild();
  if (!child) return <WorldShell>{null}</WorldShell>;
  const hand = allShelvesHand(child);
  return (
    <WorldShell child={child} back={{ href: "/play/nikud", label: "לעולם הניקוד" }}>
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
