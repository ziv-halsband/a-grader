"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useActiveChild } from "./store";

/** The active child; sends the visitor to the start screen when there is none. */
export function useRequiredChild() {
  const router = useRouter();
  const { state, child } = useActiveChild();
  useEffect(() => {
    if (state && !child) router.replace("/");
  }, [state, child, router]);
  return child;
}
