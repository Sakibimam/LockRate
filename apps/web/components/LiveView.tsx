"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { limitsFromEnv } from "@lockrate/engine";
import type { SiciApi } from "@/app/api/sici/route";
import { load, type Saved } from "@/lib/store";
import { num, usd } from "@/lib/format";

type Preview = import("@lockrate/injective").OrderPreview;
type Position = import("@lockrate/injective").OpenPosition;

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
  const [position, setPosition] = useState<Position | null | undefined>(undefined);
  const [closePreview, setClosePreview] = useState<Preview | null>(null);
  const [closeMsg, setCloseMsg] = useState<unknown>(null);
  const [closeHash, setCloseHash] = useState<string | null>(null);

  useEffect(() => {
    setSaved(load());
    fetch("/api/sici")
      .then((r) => r.json())
      .then(setMarket)
      .catch(() => setMarket(null));
  }, []);

  if (!enabled) {
    return (
      <div className="max-w-xl">
        <h1 className="text-3xl font-bold">Placing hedges is switched off</h1>
        <p className="mt-3 text-[17px]">
          This copy of Lockrate runs in practice mode, so you can explore plans without trading. Whoever runs it can switch
          trading on.
        </p>
        <p className="muted mt-3 text-sm">
          To switch it on, set <code>LOCKRATE_LIVE=1</code> and restart. When it's on, this page turns your plan into an order,
          shows every check, and hands it to your wallet to approve. Lockrate never holds keys or funds.
        </p>
        <Link className="btn mt-5" href="/">
          Back to my risk check
        </Link>
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

  async function loadPosition() {
    if (!address) return;
    setErr(null);
    setBusy("reading position");
    try {
      const inj = await import("@lockrate/injective");
      const client = new inj.SiciClient();
      const sub = inj.getDefaultSubaccountId(address);
      setPosition(await client.position(sub));
      setClosePreview(null);
      setCloseMsg(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "could not read position");
    } finally {
      setBusy(null);
    }
  }

  async function buildClose() {
    if (!position || !address) return;
    setErr(null);
    setBusy("building close");
    try {
      const inj = await import("@lockrate/injective");
      const client = new inj.SiciClient();
      const built = inj.buildClosePerpOrder({ position, market: await client.market(), injectiveAddress: address });
      setClosePreview(built.preview);
      setCloseMsg(built.msg);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "could not build close");
    } finally {
      setBusy(null);
    }
  }

  async function signClose() {
    if (!closeMsg || !address) return;
    setErr(null);
    setBusy("waiting for wallet");
    try {
      const w = await import("@/lib/wallet");
      setCloseHash(await w.broadcast(closeMsg as never, address));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "broadcast failed");
    } finally {
      setBusy(null);
    }
  }

  const marketNote = !market
    ? "Checking the market…"
    : market.source !== "live"
      ? "Market unreachable. Try again shortly."
      : market.fresh
        ? `Market price ${num(market.lastPrice)}`
        : "Market prices are out of date, so orders are paused.";

  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <h1 className="text-3xl font-bold sm:text-[2.5rem]">Place a hedge</h1>
        <p className="mt-3 text-[17px]">
          One order on Injective {process.env.NEXT_PUBLIC_INJECTIVE_NETWORK}, with no leverage, approved in your own wallet. If
          any check fails, nothing is built.
        </p>
      </div>

      <Step n={1} title="Your plan">
        {!saved || !plan ? (
          <p>
            No plan yet.{" "}
            <Link className="link" href="/">
              Check your risk first
            </Link>
            .
          </p>
        ) : plan.quantity === 0 ? (
          <p>Your risk check said not to hedge, so there's nothing to place.</p>
        ) : (
          <p>
            {plan.side === "short" ? "Sell" : "Buy"} <strong className="num">{num(plan.quantity, 3)}</strong> SICI, worth{" "}
            {usd(plan.notionalUsd)}. You put up {usd(plan.marginUsd)} in USDC.
          </p>
        )}
        <p className={`mt-1 text-sm ${market && market.source === "live" && market.fresh ? "muted" : "t-warn"}`}>{marketNote}</p>
      </Step>

      <Step n={2} title="Connect your wallet">
        {address ? (
          <p className="break-all text-sm">
            Connected <span className="muted">{address}</span>
          </p>
        ) : (
          <button className="btn btn-primary" onClick={doConnect} disabled={busy !== null}>
            {busy === "connecting" ? "Connecting…" : "Connect Keplr or Leap"}
          </button>
        )}
        <div className="mt-4 space-y-3">
          <label className="flex items-start gap-3">
            <input type="checkbox" checked={notUs} onChange={(e) => setNotUs(e.target.checked)} />
            <span>I am not a US person, and I'm allowed to trade this market where I live.</span>
          </label>
          <label className="flex items-start gap-3">
            <input type="checkbox" checked={readSim} onChange={(e) => setReadSim(e.target.checked)} />
            <span>I've looked at the replay of this plan on the risk check page.</span>
          </label>
        </div>
      </Step>

      <Step n={3} title="Check the order">
        <button className="btn btn-primary" onClick={doBuild} disabled={!canBuild || busy !== null}>
          {busy === "building" ? "Checking…" : "Check the order"}
        </button>
        {preview && (
          <div className="mt-4 text-sm">
            <p>
              {preview.side === "short" ? "Sell" : "Buy"} {num(preview.quantity, 3)} SICI, worst price {num(preview.worstPrice)},
              worth {usd(preview.notionalUsd, 2)}. Margin {usd(preview.marginUsd, 2)}.
            </p>
            <ul className="mt-2 space-y-1">
              {preview.checks.map((c, i) => (
                <li key={i} className="t-ok">
                  ✓ <span style={{ color: "var(--fg)" }}>{c.charAt(0).toUpperCase() + c.slice(1)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Step>

      <Step n={4} title="Approve in your wallet">
        <button className="btn btn-primary" onClick={doSign} disabled={!preview || busy !== null}>
          {busy === "waiting for wallet" ? "Waiting for your wallet…" : "Approve and send"}
        </button>
        {txHash && (
          <p className="mt-3 text-sm">
            Sent.{" "}
            <a className="link break-all" href={`https://explorer.injective.network/transaction/${txHash}`} target="_blank" rel="noreferrer">
              View the transaction
            </a>
          </p>
        )}
        {err && <p className="t-bad mt-3 text-sm">{err.charAt(0).toUpperCase() + err.slice(1)}</p>}
      </Step>

      <details className="border-t pt-6" style={{ borderColor: "var(--line)" }}>
        <summary className="text-lg">Close an open hedge</summary>
        <div className="mt-4 space-y-3 text-sm">
          <button className="btn" onClick={loadPosition} disabled={!address || busy !== null}>
            {busy === "reading position" ? "Looking…" : "Find my open hedge"}
          </button>
          {!address && <p className="muted">Connect your wallet first.</p>}
          {position === null && <p className="muted">You have no open SICI position.</p>}
          {position && (
            <p>
              {position.direction === "short" ? "Sold" : "Bought"} {num(position.quantity, 3)} SICI at {num(position.entryPrice)}.
              Market now {num(position.markPrice)}. Margin {usd(position.margin, 2)}.
            </p>
          )}
          {position && (
            <div className="flex flex-wrap gap-3">
              <button className="btn" onClick={buildClose} disabled={busy !== null}>
                Check the close order
              </button>
              {closePreview && (
                <button className="btn btn-primary" onClick={signClose} disabled={busy !== null}>
                  Approve and close
                </button>
              )}
            </div>
          )}
          {closePreview && (
            <ul className="space-y-1">
              {closePreview.checks.map((c, i) => (
                <li key={i} className="t-ok">
                  ✓ <span style={{ color: "var(--fg)" }}>{c.charAt(0).toUpperCase() + c.slice(1)}</span>
                </li>
              ))}
            </ul>
          )}
          {closeHash && (
            <p>
              Closed.{" "}
              <a className="link" href={`https://explorer.injective.network/transaction/${closeHash}`} target="_blank" rel="noreferrer">
                View the transaction
              </a>
            </p>
          )}
        </div>
      </details>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="grid grid-cols-[36px_1fr] gap-x-4">
      <span
        className="display flex h-9 w-9 items-center justify-center rounded-full text-base font-bold"
        style={{ background: "var(--surface)", boxShadow: "0 0 0 1px var(--line)" }}
        aria-hidden
      >
        {n}
      </span>
      <div className="min-w-0">
        <h2 className="pt-1 text-xl font-bold">{title}</h2>
        <div className="mt-3">{children}</div>
      </div>
    </section>
  );
}
