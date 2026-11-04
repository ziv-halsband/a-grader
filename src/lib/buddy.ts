"use client";

// A tiny channel so any game can make the buddy react, without passing callbacks around.

export type BuddyMood = "happy" | "oops" | "party" | "giggle";

const listeners = new Set<(m: BuddyMood) => void>();

export function cheer(mood: BuddyMood) {
  listeners.forEach((l) => l(mood));
}

export function onBuddy(l: (m: BuddyMood) => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
