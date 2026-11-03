import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LETTER_STATIONS } from "@/content/letters";
import { StationPlayer } from "./StationPlayer";

export function generateStaticParams() {
  return LETTER_STATIONS.map((s) => ({ station: s.id }));
}

export default function StationPage({ params }: PageProps<"/play/letters/[station]">) {
  return (
    <Suspense fallback={null}>
      <Station params={params} />
    </Suspense>
  );
}

async function Station({ params }: { params: PageProps<"/play/letters/[station]">["params"] }) {
  const { station } = await params;
  if (!LETTER_STATIONS.some((s) => s.id === station)) notFound();
  return <StationPlayer stationId={station} />;
}
