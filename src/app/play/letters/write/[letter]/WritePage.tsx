"use client";

import { useRouter } from "next/navigation";
import { LetterWriter } from "@/components/LetterWriter";
import { WorldShell } from "@/components/WorldShell";
import { actions } from "@/lib/store";
import { useRequiredChild } from "@/lib/useChild";

/** Writing one letter from the notebook; "onward" goes back to the notebook. */
export function WritePage({ letterId }: { letterId: string }) {
  const child = useRequiredChild();
  const router = useRouter();
  if (!child) return <WorldShell>{null}</WorldShell>;
  return (
    <WorldShell child={child} back={{ href: "/play/letters/write", label: "למחברת" }}>
      <LetterWriter
        key={letterId}
        letterId={letterId}
        gender={child.gender}
        onDone={(helped) => {
          actions.recordItem(child.id, `write:${letterId}`, helped ? "withHelp" : "firstTry", 0);
          router.push("/play/letters/write");
        }}
      />
    </WorldShell>
  );
}
