"use client";

import type { Profile, RunResult, SeriesPoint } from "@lockrate/engine";

const KEY = "lockrate.v1";

export interface Saved {
  profile: Profile;
  own: SeriesPoint[];
  result: RunResult;
  marketPrice: number;
  savedAt: number;
}

export function save(s: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* private mode etc */
  }
}

export function load(): Saved | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}
