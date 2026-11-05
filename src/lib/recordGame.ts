"use client";

import { actions, type Result } from "@/lib/store";

/**
 * Records a letter answered inside a game (detective, pajamas, letter hunt).
 * Passes kind "game" so a mastery view can tell games from the quiz once `recordLetter` takes it;
 * with today's 4-argument `recordLetter` the extra argument is simply ignored.
 */
export function recordGameAnswer(childId: string, letterId: string, result: Result, misses: number) {
  const record = actions.recordLetter as (c: string, l: string, r: Result, m: number, kind?: "game") => void;
  record.call(actions, childId, letterId, result, misses, "game");
}
