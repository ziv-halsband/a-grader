import { notFound } from "next/navigation";
import { Suspense } from "react";
import { NikudPlayer } from "@/components/nikud/NikudPlayer";
import { NIKUD_WORLDS, nikudStation } from "@/content/nikud";

export function generateStaticParams() {
  return NIKUD_WORLDS.flatMap((w) => w.stations.map((s) => ({ world: w.id, station: s.id })));
}

export default function NikudStationPage({ params }: PageProps<"/play/nikud/[world]/[station]">) {
  return (
    <Suspense fallback={null}>
      <Station params={params} />
    </Suspense>
  );
}

async function Station({ params }: { params: PageProps<"/play/nikud/[world]/[station]">["params"] }) {
  const { world, station } = await params;
  if (!nikudStation(world, station)) notFound();
  return <NikudPlayer worldId={world} stationId={station} />;
}
