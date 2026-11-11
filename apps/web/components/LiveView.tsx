"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, ExternalLink, LoaderCircle, Lock, Wallet } from "lucide-react";
import { limitsFromEnv } from "@lockrate/engine";
import { load, type Saved } from "@/lib/store";
import { connectWallet, shortAddress, useAccount } from "@/lib/account";
import { useMarket } from "@/lib/market";
import { num, usd } from "@/lib/format";
import { capitalise } from "@/lib/words";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type Preview = import("@lockrate/injective").OrderPreview;
type Position = import("@lockrate/injective").OpenPosition;

const explorer = (h: string) => `https://explorer.injective.network/transaction/${h}`;

export function LiveView({ enabled }: { enabled: boolean }) {
  const [saved, setSaved] = useState<Saved | null>(null);
  const market = useMarket();
  const address = useAccount();
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
  }, []);

  if (!enabled) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100">
          <Lock className="h-6 w-6 text-zinc-500" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-900">Trading is off on this site</h1>
        <p className="mt-2 text-zinc-500">This is the practice version. You can check your risk and see the plan, but nothing is traded.</p>
        <Button asChild className="mt-6">
          <Link href="/">Check my risk</Link>
        </Button>
        <p className="mt-6 text-xs text-zinc-400">
          Running your own copy? Set <code className="rounded bg-zinc-100 px-1">LOCKRATE_LIVE=1</code> to switch trading on.
        </p>
      </div>
    );
  }

  const plan = saved?.result.plan;
  const marketOk = Boolean(market && market.source === "live" && market.fresh);
  const canBuild = Boolean(saved && plan && plan.quantity > 0 && marketOk && address && notUs && readSim);

  async function run(label: string, fn: () => Promise<void>) {
    setErr(null);
    setBusy(label);
    try {
      await fn();
    } catch (e) {
      setErr(capitalise(e instanceof Error ? e.message : "Something went wrong"));
    } finally {
      setBusy(null);
    }
  }

  const doConnect = () => run("connect", async () => void (await connectWallet("keplr")));

  const doBuild = () =>
    run("build", async () => {
      if (!plan || !market || !address) return;
      const inj = await import("@lockrate/injective");
      const info = await new inj.SiciClient().market();
      const built = inj.buildPerpOrder({ plan: { ...plan, entryPrice: market.lastPrice }, market: info, injectiveAddress: address, limits: limitsFromEnv({}) });
      setPreview(built.preview);
      setMsg(built.msg);
    });

  const doSign = () =>
    run("sign", async () => {
      if (!msg || !address) return;
      const w = await import("@/lib/wallet");
      setTxHash(await w.broadcast(msg as never, address));
    });

  const loadPosition = () =>
    run("position", async () => {
      if (!address) return;
      const inj = await import("@lockrate/injective");
      setPosition(await new inj.SiciClient().position(inj.getDefaultSubaccountId(address)));
      setClosePreview(null);
      setCloseMsg(null);
    });

  const buildClose = () =>
    run("buildClose", async () => {
      if (!position || !address) return;
      const inj = await import("@lockrate/injective");
      const built = inj.buildClosePerpOrder({ position, market: await new inj.SiciClient().market(), injectiveAddress: address });
      setClosePreview(built.preview);
      setCloseMsg(built.msg);
    });

  const signClose = () =>
    run("signClose", async () => {
      if (!closeMsg || !address) return;
      const w = await import("@/lib/wallet");
      setCloseHash(await w.broadcast(closeMsg as never, address));
    });

  const steps = [
    { done: Boolean(plan && plan.quantity > 0) },
    { done: Boolean(address && notUs && readSim) },
    { done: Boolean(preview) },
    { done: Boolean(txHash) },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Set up your hedge</h1>
      <p className="mt-1 text-zinc-500">Four steps. You approve the final trade in your wallet.</p>

      <div className="mt-8 space-y-4">
        <Step n={1} title="Your plan" done={steps[0]!.done}>
          {!saved || !plan ? (
            <p className="text-sm text-zinc-500">
              No plan yet.{" "}
              <Link className="font-medium text-blue-600 hover:underline" href="/">
                Check your risk first
              </Link>
            </p>
          ) : plan.quantity === 0 ? (
            <p className="text-sm text-zinc-500">Your check said not to hedge, so there's nothing to set up.</p>
          ) : (
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="tabular text-lg font-semibold text-zinc-900">
                {plan.side === "short" ? "Sell" : "Buy"} {num(plan.quantity, 1)} SICI
              </p>
              <p className="tabular text-sm text-zinc-500">
                {usd(plan.notionalUsd)} · deposit {usd(plan.marginUsd)} USDC
              </p>
            </div>
          )}
          {!marketOk && market !== undefined && <p className="mt-2 text-sm text-amber-700">Market data is out of date, so trading is paused.</p>}
        </Step>

        <Step n={2} title="Connect and confirm" done={steps[1]!.done}>
          {address ? (
            <Badge tone="good" className="tabular">
              <Check className="h-3 w-3" /> {shortAddress(address)}
            </Badge>
          ) : (
            <Button onClick={doConnect} disabled={busy !== null}>
              {busy === "connect" ? <LoaderCircle className="animate-spin" /> : <Wallet />}
              Connect Keplr
            </Button>
          )}
          <div className="mt-4 space-y-3 text-sm text-zinc-700">
            <Check2 checked={notUs} onChange={setNotUs}>
              I'm not a US person, and I'm allowed to trade this where I live
            </Check2>
            <Check2 checked={readSim} onChange={setReadSim}>
              I've looked at the replay of this plan
            </Check2>
          </div>
        </Step>

        <Step n={3} title="Check the order" done={steps[2]!.done}>
          <Button variant="outline" onClick={doBuild} disabled={!canBuild || busy !== null}>
            {busy === "build" && <LoaderCircle className="animate-spin" />}
            Check the order
          </Button>
          {preview && (
            <ul className="mt-4 space-y-1.5 text-sm">
              {preview.checks.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-zinc-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  {capitalise(c)}
                </li>
              ))}
            </ul>
          )}
        </Step>

        <Step n={4} title="Approve in your wallet" done={steps[3]!.done}>
          <Button onClick={doSign} disabled={!preview || busy !== null}>
            {busy === "sign" && <LoaderCircle className="animate-spin" />}
            Approve and send
          </Button>
          {txHash && (
            <a className="mt-3 flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline" href={explorer(txHash)} target="_blank" rel="noreferrer">
              Sent. View transaction <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </Step>

        {err && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{err}</p>}

        <Card>
          <CardContent className="py-1">
            <Accordion type="single" collapsible>
              <AccordionItem value="close">
                <AccordionTrigger>Close an open hedge</AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <Button variant="outline" size="sm" onClick={loadPosition} disabled={!address || busy !== null}>
                    {busy === "position" && <LoaderCircle className="animate-spin" />}
                    Find my open hedge
                  </Button>
                  {!address && <p className="text-xs text-zinc-500">Connect your wallet first.</p>}
                  {position === null && <p className="text-sm text-zinc-500">No open position.</p>}
                  {position && (
                    <>
                      <p className="tabular text-sm text-zinc-700">
                        {position.direction === "short" ? "Sold" : "Bought"} {num(position.quantity, 3)} at {num(position.entryPrice)}. Now {num(position.markPrice)}.
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={buildClose} disabled={busy !== null}>
                          Check close order
                        </Button>
                        {closePreview && (
                          <Button size="sm" onClick={signClose} disabled={busy !== null}>
                            Approve and close
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                  {closeHash && (
                    <a className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline" href={explorer(closeHash)} target="_blank" rel="noreferrer">
                      Closed. View transaction <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Step({ n, title, done, children }: { n: number; title: string; done: boolean; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex gap-4 p-5">
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
            done ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-600",
          )}
        >
          {done ? <Check className="h-4 w-4" /> : n}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="pt-0.5 text-[15px] font-semibold text-zinc-900">{title}</h2>
          <div className="mt-3">{children}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function Check2({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input type="checkbox" className="mt-0.5 h-4 w-4 accent-zinc-900" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  );
}
