"use client";

import { Guide } from "@/components/Guide";
import { nextUnread, StageShelf } from "@/components/LibraryShelf";
import { WorldShell } from "@/components/WorldShell";
import { READING_STAGES } from "@/content/library";
import { line } from "@/content/voice";
import { useRequiredChild } from "@/lib/useChild";

/** 📗 אֲנִי קוֹרֵא: the library, one colored shelf per reading stage; the next book glows with a 👆. */
export default function LibraryPage() {
  const child = useRequiredChild();
  if (!child) return <WorldShell>{null}</WorldShell>;
  const next = nextUnread(child)?.id;
  return (
    <WorldShell child={child} back={{ href: "/play", label: "למפה הגדולה" }}>
      <h1 className="nikud mt-4 text-center text-4xl font-extrabold drop-shadow-sm" style={{ lineHeight: 1.6 }}>
        📗 אֲנִי קוֹרֵא
      </h1>
      <div className="mt-2">
        <Guide compact once lines={[line("library-intro", child.gender)]} />
      </div>
      <div className="mx-auto mt-6 flex w-full max-w-4xl flex-col gap-8 px-4 pb-32">
        {READING_STAGES.map((s) => (
          <StageShelf key={s.id} child={child} stage={s.id} next={next} />
        ))}
      </div>
    </WorldShell>
  );
}
