"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LoaderCircle, LogOut, ShieldCheck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { connectWallet, disconnectWallet, shortAddress, useAccount } from "@/lib/account";
import { useMarket } from "@/lib/market";
import { num } from "@/lib/format";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Check risk" },
  { href: "/live", label: "Hedge" },
  { href: "/report", label: "Statement" },
];

export function Header() {
  const path = usePathname();
  const account = useAccount();
  const market = useMarket();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onConnect() {
    setBusy(true);
    setErr(null);
    try {
      await connectWallet("keplr");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      setErr(/not installed|undefined|keplr/i.test(msg) ? "Install Keplr to connect" : "Couldn't connect");
    } finally {
      setBusy(false);
    }
  }

  const change = market?.change24hPct ?? 0;

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-zinc-900">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white">
            <ShieldCheck className="h-4 w-4" />
          </span>
          Lockrate
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                path === l.href ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:text-zinc-900",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {market && market.lastPrice > 0 && (
            <div className="hidden items-center gap-2 rounded-full border border-zinc-200 px-3 py-1 text-xs md:flex" title="SICI GPU price index, live from Injective">
              <span className={cn("h-1.5 w-1.5 rounded-full", market.source === "live" && market.fresh ? "bg-emerald-500" : "bg-amber-500")} />
              <span className="text-zinc-500">GPU index</span>
              <span className="tabular font-semibold text-zinc-900">{num(market.lastPrice)}</span>
              {Math.abs(change) >= 0.01 && (
                <span className={cn("tabular", change > 0 ? "text-emerald-600" : "text-rose-600")}>
                  {change > 0 ? "+" : ""}
                  {num(change)}%
                </span>
              )}
            </div>
          )}

          {account ? (
            <Button variant="outline" size="sm" onClick={() => disconnectWallet()} title="Disconnect">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="tabular">{shortAddress(account)}</span>
              <LogOut className="text-zinc-400" />
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              {err && <span className="hidden text-xs text-rose-600 sm:inline">{err}</span>}
              <Button size="sm" onClick={onConnect} disabled={busy}>
                {busy ? <LoaderCircle className="animate-spin" /> : <Wallet />}
                Connect wallet
              </Button>
            </div>
          )}
        </div>
      </div>

      <nav className="flex gap-1 border-t border-zinc-100 px-3 py-1.5 sm:hidden">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "flex-1 rounded-md py-1.5 text-center text-sm font-medium",
              path === l.href ? "bg-zinc-100 text-zinc-900" : "text-zinc-500",
            )}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
