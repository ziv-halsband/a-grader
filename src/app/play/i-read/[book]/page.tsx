import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BOOK_BY_ID, LIBRARY } from "@/content/library";
import { BookReader } from "./BookReader";

export function generateStaticParams() {
  return LIBRARY.map((b) => ({ book: b.id }));
}

export default function BookPage({ params }: PageProps<"/play/i-read/[book]">) {
  return (
    <Suspense fallback={null}>
      <Reader params={params} />
    </Suspense>
  );
}

async function Reader({ params }: { params: PageProps<"/play/i-read/[book]">["params"] }) {
  const { book } = await params;
  if (!BOOK_BY_ID[book]) notFound();
  return <BookReader bookId={book} />;
}
