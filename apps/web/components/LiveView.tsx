"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { limitsFromEnv } from "@lockrate/engine";
import type { SiciApi } from "@/app/api/sici/route";
import { load, type Saved } from "@/lib/store";
import { num, usd } from "@/lib/format";

type Preview = import("@lockrate/injective").OrderPreview;

export function LiveView({ enabled }: { enabled: boolean }) {
  const [saved, setSaved] = useState<Saved | null>(null);
  const [market, setMarket] = useState<SiciApi | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [notUs, setNotUs] = useState(false);
  const [readSim, setReadSim] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [msg, setMsg] = useState<unknown>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    setSaved(load());
    fetch("/api/sici")
      .then((r) => r.json())
      .then(setMarket)
      .catch(() => setMarket(null));
  }, []);

  if (!enabled) {
    return (
      <div className="card space-y-2 text-sm">
        <div className="text-lg font-medium">Live mode is off</div>
        <p>
          Set <code>LOCKRATE_LIVE=1</code> in <code>.env.local</code> and restart to show this page. Paper mode is the default on purpose.
        </p>
        <p className="muted text-xs">
          Live mode builds a SICI perp order from the plan on the Analyse page, previews every check, and hands the unsigned message to your wallet. Lockrate never holds keys or funds.
        </p>
      </div>
    );
  }

  const plan = saved?.result.plan;
  const canBuild = Boolean(saved && plan && plan.quantity > 0 && market && market.fresh && market.source === "live" && address && notUs && readSim);

  async function doConnect() {
    setErr(null);
    setBusy("connecting");
    try {
      const w = await import("@/lib/wallet");
      setAddress(await w.connect());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "could not connect");
    } finally {
      setBusy(null);
    }
  }

  async function doBuild() {
    if (!saved || !plan || !market || !address) return;
    setErr(null);
    setBusy("building");
    try {
      const inj = await import("@lockrate/injective");
      const client = new inj.SiciClient();
      const info = await client.market();
      const built = inj.buildPerpOrder({
        plan: { ...plan, entryPrice: market.lastPrice },
        market: info,
        injectiveAddress: address,
        limits: limitsFromEnv({}),
      });
      setPreview(built.preview);
      setMsg(built.msg);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "could not build order");
    } finally {
      setBusy(null);
    }
  }

  async function doSign() {
    if (!msg || !address) return;
    setErr(null);
    setBusy("waiting for wallet");
    try {
      const w = await import("@/lib/wallet");
      const hash = await w.broadcast(msg as never, address);
      setTxHash(hash);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "broadcast failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4 text-sm">
      <div className="card">
        <div className="text-lg font-medium">Live · SICI perp on Injective {process.env.NEXT_PUBLIC_INJECTIVE_NETWORK}</div>
        <p className="muted mt-1 text-xs">
          one order, at 1x, inside the caps, signed in your wallet. if any check fails nothing is built.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card space-y-2">
          <div className="muted text-xs">1 · plan from the analyse page</div>
          {!saved || !plan ? (
            <p>
              no plan saved. <Link className="underline" href="/">go back and run one</Link>.
            </p>
          ) : plan.quantity === 0 ? (
            <p>the current verdict is {saved.result.fit.verdict}, so there is nothing to place.</p>
          ) : (
            <div>
              <span className="capitalize">{plan.side}</span> {num(plan.quantity, 3)} SICI · {usd(plan.notionalUsd)} notional · margin {usd(plan.marginUsd)} · {saved.profile.name}
            </div>
          )}
          <div className="muted text-xs">
            market: {market ? (market.source === "live" ? `${market.fresh ? "fresh" : "stale"}, last ${num(market.lastPrice)}` : "indexer unreachable") : "loading"}
          </div>
        </div>

        <div className="card space-y-2">
          <div className="muted text-xs">2 · wallet</div>
          {address ? (
            <div className="break-all font-mono text-xs">{address}</div>
          ) : (
            <button className="primary text-xs" onClick={doConnect} disabled={busy !== null}>
              {busy === "connecting" ? "connecting..." : "connect Keplr"}
            </button>
          )}
          <label className="flex items-start gap-2 text-xs">
            <input type="checkbox" checked={notUs} onChange={(e) => setNotUs(e.target.checked)} />
            <span>I am not a US person and I am allowed to trade this market where I live.</span>
          </label>
          <label className="flex items-start gap-2 text-xs">
            <input type="checkbox" checked={readSim} onChange={(e) => setReadSim(e.target.checked)} />
            <span>I have looked at the paper simulation for this plan.</span>
          </label>
        </div>
      </div>

      <div className="card space-y-3">
        <div className="muted text-xs">3 · build and check</div>
        <button className="primary text-xs" onClick={doBuild} disabled={!canBuild || busy !== null}>
          {busy === "building" ? "building..." : "build order"}
        </button>
        {preview && (
          <div className="space-y-1 text-xs">
            <div>
              {preview.kind} {preview.side} {num(preview.quantity, 3)} @ worst {num(preview.worstPrice)} · notional {usd(preview.notionalUsd, 2)} · margin {usd(preview.marginUsd, 2)} · {preview.leverage}x
            </div>
            <ul className="muted">
              {preview.checks.map((c, i) => (
                <li key={i}>✓ {c}</li>
              ))}
            </ul>
            <div className="muted break-all font-mono">subaccount {preview.subaccountId}</div>
          </div>
        )}
      </div>

      <div className="card space-y-2">
        <div className="muted text-xs">4 · sign</div>
        <button className="primary text-xs" onClick={doSign} disabled={!preview || busy !== null}>
          {busy === "waiting for wallet" ? "waiting for wallet..." : "sign in wallet"}
        </button>
        {txHash && (
          <div className="text-xs">
            sent.{" "}
            <a className="underline" href={`https://explorer.injective.network/transaction/${txHash}`} target="_blank" rel="noreferrer">
              {txHash}
            </a>
          </div>
        )}
        {err && <div className="t-bad text-xs">{err}</div>}
      </div>
    </div>
  );
}
