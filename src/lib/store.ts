"use client";

// Local-first state: child profiles, progress and stickers live in this browser's localStorage.
// Shaped so it can later move to Supabase (one row per child, one row per attempt summary).

import { useSyncExternalStore } from "react";
import type { Gender, World } from "@/content/worlds";

export type LetterStat = {
  /** Answered right on the first try (no hint). */
  firstTry: number;
  /** Answered right only after a hint or a demo. */
  withHelp: number;
  /** Wrong taps. */
  misses: number;
  /** Was the most recent answer a first-try success? */
  lastFirstTry: boolean;
  /** When it was last practiced (ms). Missing in older saves. */
  at?: number;
};

export type Child = {
  id: string;
  nickname: string;
  gender: Gender;
  worldId: World["id"];
  createdAt: string;
  letters: Record<string, LetterStat>;
  /** Same stats for everything after letters, keyed by kind: "syl:bet", "read:dag". Missing in older saves. */
  items?: Record<string, LetterStat>;
  /** The buddy the child picked (content/buddies.ts), its wardrobe and what it wears now. */
  buddy?: string;
  wardrobe?: string[];
  wearing?: string[];
  /** The buddy picked first (an earned hero can become `buddy` later). Missing in older saves: then it is `buddy`. */
  starter?: string;
  /** Saw the short tour (the buddy, the surprises, the heroes): once per child. */
  tourSeen?: boolean;
  /** Parent switch: open every world now (e.g. a child who already knows the letters). */
  unlockAll?: boolean;
  /** Station ids completed (e.g. "letters/s1"). */
  done: string[];
  /** Sticker emojis collected, in order. */
  stickers: string[];
  lastPlayedAt?: string;
};

export type AppState = { version: 1; children: Child[]; activeChildId: string | null };

const KEY = "grade-a-prepare:v1";
const EMPTY: AppState = { version: 1, children: [], activeChildId: null };

let cache: AppState | null = null;
const listeners = new Set<() => void>();

function read(): AppState {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as AppState) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: AppState) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage blocked (private mode): keep playing in memory.
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

/** null while rendering on the server / before hydration. */
export function useAppState(): AppState | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

export function useActiveChild(): { state: AppState | null; child: Child | null } {
  const state = useAppState();
  const child = state?.children.find((c) => c.id === state.activeChildId) ?? null;
  return { state, child };
}

function updateChild(id: string, fn: (c: Child) => Child) {
  const s = read();
  write({ ...s, children: s.children.map((c) => (c.id === id ? fn(c) : c)) });
}

export type Result = "firstTry" | "withHelp";

function bump(prev: LetterStat | undefined, result: Result, misses: number): LetterStat {
  const p = prev ?? { firstTry: 0, withHelp: 0, misses: 0, lastFirstTry: false };
  return {
    firstTry: p.firstTry + (result === "firstTry" ? 1 : 0),
    withHelp: p.withHelp + (result === "withHelp" ? 1 : 0),
    misses: p.misses + misses,
    lastFirstTry: result === "firstTry",
    at: Date.now(),
  };
}

export const actions = {
  addChild(input: Pick<Child, "nickname" | "gender" | "worldId">) {
    const s = read();
    const child: Child = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      letters: {},
      done: [],
      stickers: [],
    };
    write({ ...s, children: [...s.children, child], activeChildId: child.id });
    return child;
  },
  setActive(id: string | null) {
    write({ ...read(), activeChildId: id });
  },
  updateChild(
    id: string,
    patch: Partial<Pick<Child, "nickname" | "gender" | "worldId" | "unlockAll" | "buddy" | "wearing" | "starter" | "tourSeen">>,
  ) {
    updateChild(id, (c) => ({ ...c, ...patch }));
  },
  /** Makes another friend the child owns (the first pick or an earned hero) the active buddy. */
  switchBuddy(id: string, buddy: string) {
    updateChild(id, (c) => ({ ...c, starter: c.starter ?? c.buddy, buddy }));
  },
  removeChild(id: string) {
    const s = read();
    const children = s.children.filter((c) => c.id !== id);
    write({ ...s, children, activeChildId: s.activeChildId === id ? null : s.activeChildId });
  },
  resetProgress(id: string) {
    // Heroes are earned by stations, so they go too: back to the buddy picked first.
    updateChild(id, (c) => ({
      ...c,
      letters: {},
      items: {},
      done: [],
      stickers: [],
      wardrobe: [],
      wearing: [],
      buddy: c.starter ?? c.buddy,
    }));
  },
  recordLetter(childId: string, letterId: string, result: Result, misses: number) {
    updateChild(childId, (c) => ({
      ...c,
      lastPlayedAt: new Date().toISOString(),
      letters: { ...c.letters, [letterId]: bump(c.letters[letterId], result, misses) },
    }));
  },
  /** Syllables, words…: key is "<kind>:<id>". */
  recordItem(childId: string, key: string, result: Result, misses: number) {
    updateChild(childId, (c) => ({
      ...c,
      lastPlayedAt: new Date().toISOString(),
      items: { ...c.items, [key]: bump(c.items?.[key], result, misses) },
    }));
  },
  /**
   * Marks a station done. The first time, the child gets the sticker and the accessory (which the buddy
   * also puts on). Replays give nothing new.
   */
  completeStation(childId: string, stationKey: string, sticker: string, accessory: string) {
    const c = read().children.find((x) => x.id === childId);
    if (!c || c.done.includes(stationKey)) return;
    updateChild(childId, (x) => {
      const wardrobe = x.wardrobe ?? [];
      const has = wardrobe.includes(accessory);
      return {
        ...x,
        done: [...x.done, stationKey],
        stickers: [...x.stickers, sticker],
        wardrobe: has ? wardrobe : [...wardrobe, accessory],
        wearing: has ? x.wearing : [accessory],
        lastPlayedAt: new Date().toISOString(),
      };
    });
  },
};

export type Mastery = "new" | "practicing" | "knows";

/** Deliberately simple and explainable to a parent; mom will define the real rule per topic. */
export function letterMastery(stat: LetterStat | undefined): Mastery {
  if (!stat || stat.firstTry + stat.withHelp === 0) return "new";
  if (stat.firstTry >= 2 && stat.lastFirstTry) return "knows";
  return "practicing";
}
