"use client";

// The child's name, recorded by a parent (a few seconds). Kept only in this browser, never uploaded,
// because the AI voice can't know every name and we don't send children's names to any service.

const key = (childId: string) => `grade-a-prepare:name:${childId}`;

export function readNameRecording(childId: string): string | undefined {
  try {
    return window.localStorage.getItem(key(childId)) ?? undefined;
  } catch {
    return undefined;
  }
}

export function saveNameRecording(childId: string, dataUrl: string | null) {
  try {
    if (dataUrl) window.localStorage.setItem(key(childId), dataUrl);
    else window.localStorage.removeItem(key(childId));
  } catch {
    // Storage full or blocked: the greeting just shows the name without saying it.
  }
}
