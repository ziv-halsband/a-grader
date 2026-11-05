"use client";

import { actions, type Result } from "@/lib/store";

/** Records a letter answered inside a game (detective, pajamas, letter hunt), as kind "game". */
export function recordGameAnswer(childId: string, letterId: string, result: Result, misses: number) {
  actions.recordLetter(childId, letterId, result, misses, "game");
}
