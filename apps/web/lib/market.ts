"use client";

import { useEffect, useState } from "react";
import type { SiciApi } from "@/app/api/sici/route";

let pending: Promise<SiciApi | null> | null = null;

function fetchMarket(): Promise<SiciApi | null> {
  if (!pending) {
    pending = fetch("/api/sici")
      .then((r) => r.json() as Promise<SiciApi>)
      .catch(() => null);
  }
  return pending;
}

/** live SICI market, fetched once per page load and shared by every component */
export function useMarket(): SiciApi | null | undefined {
  const [m, setM] = useState<SiciApi | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    fetchMarket().then((x) => alive && setM(x));
    return () => {
      alive = false;
    };
  }, []);
  return m;
}
