"use client";

import { useSyncExternalStore } from "react";

// the connected wallet address. public information, kept so the header and the
// hedge page agree on who is signed in.
const KEY = "lockrate.wallet";
const listeners = new Set<() => void>();

function read(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setAccount(address: string | null) {
  try {
    if (address) localStorage.setItem(KEY, address);
    else localStorage.removeItem(KEY);
  } catch {
    /* private mode */
  }
  listeners.forEach((l) => l());
}

export function useAccount(): string | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => null,
  );
}

export async function connectWallet(kind: "keplr" | "leap" = "keplr"): Promise<string> {
  const w = await import("./wallet");
  const { Wallet } = await import("@injectivelabs/wallet-base");
  const address = await w.connect(kind === "leap" ? Wallet.Leap : Wallet.Keplr);
  setAccount(address);
  return address;
}

export async function disconnectWallet() {
  try {
    const w = await import("./wallet");
    await w.disconnect();
  } catch {
    /* already gone */
  }
  setAccount(null);
}

export const shortAddress = (a: string) => `${a.slice(0, 7)}…${a.slice(-4)}`;
