import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LETTERS } from "@/content/letters";
import { WritePage } from "./WritePage";

export function generateStaticParams() {
  return LETTERS.map((l) => ({ letter: l.id }));
}

export default function WriteLetterPage({ params }: PageProps<"/play/letters/write/[letter]">) {
  return (
    <Suspense fallback={null}>
      <Letter params={params} />
    </Suspense>
  );
}

async function Letter({ params }: { params: PageProps<"/play/letters/write/[letter]">["params"] }) {
  const { letter } = await params;
  if (!LETTERS.some((l) => l.id === letter)) notFound();
  return <WritePage letterId={letter} />;
}
