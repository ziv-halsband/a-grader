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
};

export type Child = {
  id: string;
  nickname: string;
  gender: Gender;
  worldId: World["id"];
  createdAt: string;
  letters: Record<string, LetterStat>;
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
  updateChild(id: string, patch: Partial<Pick<Child, "nickname" | "gender" | "worldId">>) {
    updateChild(id, (c) => ({ ...c, ...patch }));
  },
  removeChild(id: string) {
    const s = read();
    const children = s.children.filter((c) => c.id !== id);
    write({ ...s, children, activeChildId: s.activeChildId === id ? null : s.activeChildId });
  },
  resetProgress(id: string) {
    updateChild(id, (c) => ({ ...c, letters: {}, done: [], stickers: [] }));
  },
  recordLetter(childId: string, letterId: string, result: "firstTry" | "withHelp", misses: number) {
    updateChild(childId, (c) => {
      const prev = c.letters[letterId] ?? { firstTry: 0, withHelp: 0, misses: 0, lastFirstTry: false };
      return {
        ...c,
        lastPlayedAt: new Date().toISOString(),
        letters: {
          ...c.letters,
          [letterId]: {
            firstTry: prev.firstTry + (result === "firstTry" ? 1 : 0),
            withHelp: prev.withHelp + (result === "withHelp" ? 1 : 0),
            misses: prev.misses + misses,
            lastFirstTry: result === "firstTry",
          },
        },
      };
    });
  },
  /** Marks a station done; returns the sticker earned the first time, or null on replays. */
  completeStation(childId: string, stationKey: string, sticker: string): string | null {
    const c = read().children.find((x) => x.id === childId);
    if (!c) return null;
    const first = !c.done.includes(stationKey);
    updateChild(childId, (x) => ({
      ...x,
      done: first ? [...x.done, stationKey] : x.done,
      stickers: first ? [...x.stickers, sticker] : x.stickers,
      lastPlayedAt: new Date().toISOString(),
    }));
    return first ? sticker : null;
  },
};

export type Mastery = "new" | "practicing" | "knows";

/** Deliberately simple and explainable to a parent; mom will define the real rule per topic. */
export function letterMastery(stat: LetterStat | undefined): Mastery {
  if (!stat || stat.firstTry + stat.withHelp === 0) return "new";
  if (stat.firstTry >= 2 && stat.lastFirstTry) return "knows";
  return "practicing";
}
