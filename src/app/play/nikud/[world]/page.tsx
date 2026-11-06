import { notFound } from "next/navigation";
import { Suspense } from "react";
import { NikudWorldMap } from "@/components/nikud/NikudWorldMap";
import { NIKUD_WORLD_BY_ID, NIKUD_WORLDS } from "@/content/nikud";

export function generateStaticParams() {
  return NIKUD_WORLDS.map((w) => ({ world: w.id }));
}

export default function NikudWorldPage({ params }: PageProps<"/play/nikud/[world]">) {
  return (
    <Suspense fallback={null}>
      <World params={params} />
    </Suspense>
  );
}

async function World({ params }: { params: PageProps<"/play/nikud/[world]">["params"] }) {
  const { world } = await params;
  if (!NIKUD_WORLD_BY_ID[world]) notFound();
  return <NikudWorldMap worldId={world} />;
}
