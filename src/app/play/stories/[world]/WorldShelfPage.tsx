"use client";

import Link from "next/link";
import { Guide } from "@/components/Guide";
import { firstBookHand, WorldShelf } from "@/components/StoryShelf";
import { WorldShell } from "@/components/WorldShell";
import { storiesOf, type StoryWorld } from "@/content/stories";
import { useRequiredChild } from "@/lib/useChild";

/** One nikud world's bookshelf: its 6 decodable stories (the nikud worlds link here). */
export function WorldShelfPage({ world }: { world: StoryWorld }) {
  const child = useRequiredChild();
  if (!child) return <WorldShell>{null}</WorldShell>;
  return (
    <WorldShell child={child} back={{ href: "/play/nikud", label: "לעולם הניקוד" }}>
      <div className="mt-3">
        <Guide compact once lines={["stories-shelf"]} />
      </div>
      <div className="mx-auto mt-6 w-full max-w-3xl px-4">
        <WorldShelf child={child} world={world} handOn={firstBookHand(child, storiesOf(world))} />
      </div>
      <div className="mt-6 flex justify-center pb-32">
        <Link href="/play/stories" className="btn-3d nikud bg-white px-5 py-3 text-xl font-bold">
          📚 כָּל הַסִּפּוּרִים
        </Link>
      </div>
    </WorldShell>
  );
}
