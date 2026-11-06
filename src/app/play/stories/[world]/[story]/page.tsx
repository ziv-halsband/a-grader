import { notFound } from "next/navigation";
import { Suspense } from "react";
import { STORIES, STORY_BY_ID } from "@/content/stories";
import { StoryReader } from "./StoryReader";

export function generateStaticParams() {
  return STORIES.map((s) => ({ world: s.world, story: s.id }));
}

export default function StoryPage({ params }: PageProps<"/play/stories/[world]/[story]">) {
  return (
    <Suspense fallback={null}>
      <Reader params={params} />
    </Suspense>
  );
}

async function Reader({ params }: { params: PageProps<"/play/stories/[world]/[story]">["params"] }) {
  const { world, story } = await params;
  if (STORY_BY_ID[story]?.world !== world) notFound();
  return <StoryReader storyId={story} />;
}
