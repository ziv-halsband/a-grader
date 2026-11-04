import { NIKUD_TOPICS } from "@/content/curriculum";
import { KAMATZ_STATIONS } from "@/content/kamatz";
import { LETTER_STATIONS } from "@/content/letters";
import type { Child } from "./store";

/** Which topics this child finished (every station done). Used by the big map and the nikud map. */
export function topicsDone(child: Child): Record<string, boolean> {
  const allDone = (prefix: string, ids: { id: string }[]) => ids.every((s) => child.done.includes(`${prefix}/${s.id}`));
  const done: Record<string, boolean> = {
    letters: allDone("letters", LETTER_STATIONS),
    "kamatz-patach": allDone("kamatz-patach", KAMATZ_STATIONS),
  };
  done.nikud = NIKUD_TOPICS.every((t) => done[t.id]);
  return done;
}
