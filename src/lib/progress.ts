import { NIKUD_TOPICS } from "@/content/curriculum";
import { NIKUD_WORLDS } from "@/content/nikud";
import { LETTER_STATIONS } from "@/content/letters";
import type { Child } from "./store";

/** Which topics this child finished (every station done). Used by the big map and the nikud map. */
export function topicsDone(child: Child): Record<string, boolean> {
  const allDone = (prefix: string, ids: { id: string }[]) => ids.every((s) => child.done.includes(`${prefix}/${s.id}`));
  const done: Record<string, boolean> = {
    letters: allDone("letters", LETTER_STATIONS),
  };
  for (const w of NIKUD_WORLDS) done[w.id] = allDone(w.id, w.stations);
  done.nikud = NIKUD_TOPICS.every((t) => done[t.id]);
  return done;
}

/**
 * Practice mode (founder, 5 Nov): while we build and test, everything that is built is open:
 * every world, every station, and every step inside a station, in any order.
 * Set to false to bring back the learning order for children (each station opens after the previous one).
 */
export const PRACTICE_MODE = true;

/** Worlds and stations open regardless of order (practice mode, or the parents' "all worlds" switch). */
export function openAll(child: Child): boolean {
  return PRACTICE_MODE || !!child.unlockAll;
}
