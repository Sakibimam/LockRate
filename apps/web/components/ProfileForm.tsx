"use client";

import { useState } from "react";
import { GPU_LABELS, type GpuLine, type GpuModel, type Profile, type SeriesPoint } from "@lockrate/engine";
import { parseSeriesCsv } from "@/lib/csv";
import type { ProxyMap } from "./Dashboard";

const MODELS = Object.keys(GPU_LABELS) as GpuModel[];

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

  const set = (patch: Partial<Profile>) => onProfile({ ...profile, ...patch });
  const setLine = (i: number, patch: Partial<GpuLine>) =>
    set({ gpus: profile.gpus.map((l, j) => (j === i ? { ...l, ...patch } : l)) });

  return (
    <div className="card space-y-4 text-sm">
      <div>
        <label className="muted block text-xs">sample profile</label>
        <select
          className="mt-1 w-full"
          value={profile.id}
          onChange={(e) => {
            const p = profiles.find((x) => x.id === e.target.value);
            if (p) onPick(p);
          }}
        >
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {profile.notes && <p className="muted mt-1 text-xs">{profile.notes}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="muted block text-xs">you are</label>
          <select className="mt-1 w-full" value={profile.role} onChange={(e) => set({ role: e.target.value as Profile["role"] })}>
            <option value="operator">selling GPU hours</option>
            <option value="buyer">buying GPU hours</option>
          </select>
        </div>
        <div>
          <label className="muted block text-xs">blended $/GPU-hour</label>
          <input
            className="mt-1 w-full num"
            type="number"
            step="0.01"
            min="0"
            value={profile.avgRateUsd}
            onChange={(e) => set({ avgRateUsd: Number(e.target.value) })}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="muted text-xs">fleet</label>
          <button
            className="muted text-xs underline"
            onClick={() => set({ gpus: [...profile.gpus, { model: "H100", count: 8 }] })}
          >
            add line
          </button>
        </div>
        <div className="mt-1 space-y-1">
          {profile.gpus.map((l, i) => (
            <div key={i} className="grid grid-cols-[1fr_70px_80px_24px] items-center gap-1">
              <select value={l.model} onChange={(e) => setLine(i, { model: e.target.value as GpuModel })}>
                {MODELS.map((m) => (
                  <option key={m} value={m}>
                    {GPU_LABELS[m]}
                  </option>
                ))}
              </select>
              <input className="num" type="number" min="0" value={l.count} onChange={(e) => setLine(i, { count: Number(e.target.value) })} title="count" />
              <input
                className="num"
                type="number"
                step="0.01"
                min="0"
                placeholder={String(profile.avgRateUsd)}
                value={l.rateUsd ?? ""}
                onChange={(e) => setLine(i, { rateUsd: e.target.value === "" ? undefined : Number(e.target.value) })}
                title="$/hr for this line, blank = blended"
              />
              <button className="muted" onClick={() => set({ gpus: profile.gpus.filter((_, j) => j !== i) })} title="remove">
                ×
              </button>
            </div>
          ))}
        </div>
        <p className="muted mt-1 text-[11px]">count · $/hr (blank uses blended)</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="muted block text-xs">spot share {Math.round(profile.spotShare * 100)}%</label>
          <input
            className="mt-2 w-full"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={profile.spotShare}
            onChange={(e) => set({ spotShare: Number(e.target.value) })}
          />
          <p className="muted text-[11px]">share of revenue or spend that floats hourly</p>
        </div>
        <div>
          <label className="muted block text-xs">utilisation {Math.round(profile.utilisation * 100)}%</label>
          <input
            className="mt-2 w-full"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={profile.utilisation}
            onChange={(e) => set({ utilisation: Number(e.target.value) })}
          />
          <p className="muted text-[11px]">of 730 h/month per GPU</p>
        </div>
      </div>

      <div>
        <label className="muted block text-xs">your price history</label>
        <select
          className="mt-1 w-full"
          value={ownLabel in proxies ? ownLabel : "custom"}
          onChange={(e) => {
            const k = e.target.value;
            if (k !== "custom" && proxies[k]) onOwn(proxies[k]!.points, k);
          }}
        >
          {Object.keys(proxies).map((k) => (
            <option key={k} value={k}>
              proxy: {k}
            </option>
          ))}
          <option value="custom">pasted CSV</option>
        </select>
        {ownLabel in proxies && <p className="muted mt-1 text-[11px]">{proxies[ownLabel]?.note}</p>}
        <textarea
          className="mt-2 w-full font-mono text-xs"
          rows={3}
          placeholder={"month,price\n2026-03,2.15\n2026-04,2.08"}
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
        />
        <div className="mt-1 flex items-center gap-2">
          <button
            className="ghost text-xs"
            onClick={() => {
              const { points, skipped } = parseSeriesCsv(csv);
              if (points.length < 3) {
                setCsvNote("need at least 3 monthly rows");
                return;
              }
              onOwn(points, "custom");
              setCsvNote(`${points.length} months loaded${skipped ? `, ${skipped} rows skipped` : ""}`);
            }}
          >
            use pasted history
          </button>
          {csvNote && <span className="muted text-xs">{csvNote}</span>}
        </div>
      </div>

      <div>
        <label className="muted block text-xs">hedge scale {Math.round(scale * 100)}% of what the verdict allows</label>
        <input className="mt-2 w-full" type="range" min="0" max="1" step="0.05" value={scale} onChange={(e) => onScale(Number(e.target.value))} />
      </div>

    </div>
  );
}
