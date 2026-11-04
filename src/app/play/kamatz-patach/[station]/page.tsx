import { notFound } from "next/navigation";
import { Suspense } from "react";
import { KAMATZ_STATIONS } from "@/content/kamatz";
import { KamatzPlayer } from "./KamatzPlayer";

export function generateStaticParams() {
  return KAMATZ_STATIONS.map((s) => ({ station: s.id }));
}

export default function KamatzStationPage({ params }: PageProps<"/play/kamatz-patach/[station]">) {
  return (
    <Suspense fallback={null}>
      <Station params={params} />
    </Suspense>
  );
}

async function Station({ params }: { params: PageProps<"/play/kamatz-patach/[station]">["params"] }) {
  const { station } = await params;
  if (!KAMATZ_STATIONS.some((s) => s.id === station)) notFound();
  return <KamatzPlayer stationId={station} />;
}
