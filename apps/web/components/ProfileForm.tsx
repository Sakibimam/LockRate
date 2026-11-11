"use client";

import { useState } from "react";
import { GPU_LABELS, type GpuLine, type GpuModel, type Profile, type SeriesPoint } from "@lockrate/engine";
import { parseSeriesCsv } from "@/lib/csv";
import { prettyProxy } from "@/lib/words";
import type { ProxyMap } from "./Dashboard";
import { RateCardPaste } from "./RateCardPaste";

const MODELS = Object.keys(GPU_LABELS) as GpuModel[];
const shortLabel = (m: GpuModel) => (m === "OTHER" ? "Other card" : GPU_LABELS[m].replace(/ SXM.*$/, ""));

interface Props {
  profiles: Profile[];
  profile: Profile;
  onProfile: (p: Profile) => void;
  onPick: (p: Profile) => void;
  proxies: ProxyMap;
  ownLabel: string;
  onOwn: (pts: SeriesPoint[], label: string) => void;
  scale: number;
  onScale: (x: number) => void;
}

export function ProfileForm({ profiles, profile, onProfile, onPick, proxies, ownLabel, onOwn, scale, onScale }: Props) {
  const [csv, setCsv] = useState("");
  const [csvNote, setCsvNote] = useState<string | null>(null);
  const [historyMode, setHistoryMode] = useState<string>(ownLabel in proxies ? ownLabel : "custom");

  const set = (patch: Partial<Profile>) => onProfile({ ...profile, ...patch });
  const setLine = (i: number, patch: Partial<GpuLine>) =>
    set({ gpus: profile.gpus.map((l, j) => (j === i ? { ...l, ...patch } : l)) });
  const seller = profile.role === "operator";

  return (
    <div className="panel space-y-6">
      <h2 className="text-xl font-bold">Your GPUs</h2>

      <div>
        <label className="field-label" htmlFor="example">
          Start from an example
        </label>
        <select
          id="example"
          value={profile.id}
          onChange={(e) => {
            const p = profiles.find((x) => x.id === e.target.value);
            if (p) {
              onPick(p);
              if (p.proxy) setHistoryMode(p.proxy);
            }
          }}
        >
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {profile.notes && <p className="hint">{profile.notes.charAt(0).toUpperCase() + profile.notes.slice(1)}</p>}
      </div>

      <div>
        <span className="field-label">What do you do?</span>
        <div className="seg" role="group" aria-label="What do you do?">
          <button type="button" aria-pressed={seller} onClick={() => set({ role: "operator" })}>
            Rent out GPUs
          </button>
          <button type="button" aria-pressed={!seller} onClick={() => set({ role: "buyer" })}>
            Rent GPUs
          </button>
        </div>
      </div>

      <div>
        <span className="field-label">Which cards, and how many?</span>
        <div className="grid grid-cols-[minmax(0,1fr)_64px_76px_24px] gap-2 text-xs muted">
          <span>Card</span>
          <span>Count</span>
          <span>$ per hour</span>
          <span />
        </div>
        <div className="mt-1 space-y-2">
          {profile.gpus.map((l, i) => (
            <div key={i} className="grid grid-cols-[minmax(0,1fr)_64px_76px_24px] items-center gap-2">
              <select aria-label="Card" value={l.model} onChange={(e) => setLine(i, { model: e.target.value as GpuModel })}>
                {MODELS.map((m) => (
                  <option key={m} value={m}>
                    {shortLabel(m)}
                  </option>
                ))}
              </select>
              <input aria-label="Count" className="num" type="number" min="0" value={l.count} onChange={(e) => setLine(i, { count: Number(e.target.value) })} />
              <input
                aria-label="Dollars per hour"
                className="num"
                type="number"
                step="0.01"
                min="0"
                placeholder={String(profile.avgRateUsd)}
                value={l.rateUsd ?? ""}
                onChange={(e) => setLine(i, { rateUsd: e.target.value === "" ? undefined : Number(e.target.value) })}
              />
              <button
                type="button"
                className="muted text-lg leading-none"
                aria-label="Remove this card"
                onClick={() => set({ gpus: profile.gpus.filter((_, j) => j !== i) })}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="link mt-3 text-sm" onClick={() => set({ gpus: [...profile.gpus, { model: "H100", count: 8 }] })}>
          Add a card
        </button>
      </div>

      <div>
        <label className="field-label" htmlFor="rate">
          Average price per GPU-hour
        </label>
        <input
          id="rate"
          className="num"
          type="number"
          step="0.01"
          min="0"
          value={profile.avgRateUsd}
          onChange={(e) => set({ avgRateUsd: Number(e.target.value) })}
        />
        <p className="hint">Used for any card above without its own price.</p>
      </div>

      <div>
        <label className="field-label" htmlFor="spot">
          {seller ? "Income" : "Spend"} at market prices: <span className="num">{Math.round(profile.spotShare * 100)}%</span>
        </label>
        <input
          id="spot"
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={profile.spotShare}
          onChange={(e) => set({ spotShare: Number(e.target.value) })}
        />
        <p className="hint">The part that is not locked into a fixed-price contract.</p>
      </div>

      <details className="border-t pt-5" style={{ borderColor: "var(--line)" }}>
        <summary>More settings</summary>
        <div className="mt-5 space-y-6">
          <div>
            <label className="field-label" htmlFor="util">
              Hours in use: <span className="num">{Math.round(profile.utilisation * 100)}%</span>
            </label>
            <input
              id="util"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={profile.utilisation}
              onChange={(e) => set({ utilisation: Number(e.target.value) })}
            />
            <p className="hint">Share of the month each GPU is {seller ? "rented out" : "running"}.</p>
          </div>

          <div>
            <label className="field-label" htmlFor="hist">
              Your past prices
            </label>
            <select
              id="hist"
              value={historyMode}
              onChange={(e) => {
                const k = e.target.value;
                setHistoryMode(k);
                if (k !== "custom" && proxies[k]) onOwn(proxies[k]!.points, k);
              }}
            >
              {Object.keys(proxies).map((k) => (
                <option key={k} value={k}>
                  {prettyProxy(k)}
                </option>
              ))}
              <option value="custom">My own, pasted in</option>
            </select>
            <p className="hint">We compare these against the GPU price index to see if a hedge would track you.</p>
            {historyMode === "custom" && (
              <div className="mt-3">
                <textarea
                  aria-label="Monthly prices, one per line"
                  className="num text-sm"
                  rows={4}
                  placeholder={"2026-03, 2.15\n2026-04, 2.08\n2026-05, 1.97"}
                  value={csv}
                  onChange={(e) => setCsv(e.target.value)}
                />
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      const { points, skipped } = parseSeriesCsv(csv);
                      if (points.length < 3) {
                        setCsvNote("Add at least 3 months, one per line: month, price.");
                        return;
                      }
                      onOwn(points, "custom");
                      setCsvNote(`Using ${points.length} months${skipped ? `. Skipped ${skipped} lines we couldn't read.` : "."}`);
                    }}
                  >
                    Use these prices
                  </button>
                  {csvNote && <span className="hint mt-0">{csvNote}</span>}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="field-label" htmlFor="scale">
              Hedge size: <span className="num">{Math.round(scale * 100)}%</span> of what we suggest
            </label>
            <input id="scale" type="range" min="0" max="1" step="0.05" value={scale} onChange={(e) => onScale(Number(e.target.value))} />
          </div>

          <RateCardPaste onDraft={(p) => onProfile({ ...profile, ...p })} />
        </div>
      </details>
    </div>
  );
}
