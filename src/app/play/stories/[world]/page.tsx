import { notFound } from "next/navigation";
import { Suspense } from "react";
import { isStoryWorld, STORY_WORLDS } from "@/content/stories";
import { WorldShelfPage } from "./WorldShelfPage";

export function generateStaticParams() {
  return STORY_WORLDS.map((world) => ({ world }));
}

export default function StoryWorldPage({ params }: PageProps<"/play/stories/[world]">) {
  return (
    <Suspense fallback={null}>
      <Shelf params={params} />
    </Suspense>
  );
}

async function Shelf({ params }: { params: PageProps<"/play/stories/[world]">["params"] }) {
  const { world } = await params;
  if (!isStoryWorld(world)) notFound();
  return <WorldShelfPage world={world} />;
}
