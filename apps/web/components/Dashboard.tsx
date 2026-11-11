"use client";

import { useEffect, useMemo, useState } from "react";
import { run, type Limits, type Profile, type SeriesPoint } from "@lockrate/engine";
import { save } from "@/lib/store";
import { useMarket } from "@/lib/market";
import { StartStep } from "./StartStep";
import { FleetStep } from "./FleetStep";
import { ResultView } from "./ResultView";

export interface ProxyMap {
  [name: string]: { points: SeriesPoint[]; note: string; unit: string };
}

interface Props {
  profiles: Profile[];
  proxies: ProxyMap;
  index: SeriesPoint[];
  daily: Array<{ t: string; c: number }>;
  limits: Limits;
  dataGeneratedAt: string;
}

type Step = "start" | "fleet" | "result";

/** sensible starting point for someone entering their own numbers */
function blankProfile(role: Profile["role"]): { profile: Profile; proxy: string } {
  return role === "operator"
    ? {
        profile: { id: "custom", name: "My GPUs", role, gpus: [{ model: "H100", count: 16 }], avgRateUsd: 2.1, spotShare: 1, utilisation: 0.75 },
        proxy: "h100-spot-marketplace",
      }
    : {
        profile: { id: "custom", name: "My GPUs", role, gpus: [{ model: "H100", count: 16 }], avgRateUsd: 2.6, spotShare: 0.6, utilisation: 0.8 },
        proxy: "h100-h200-on-demand-buyer",
      };
}

export function Dashboard({ profiles, proxies, index, daily, limits }: Props) {
  const [step, setStep] = useState<Step>("start");
  const [profile, setProfile] = useState<Profile>(profiles[0] as Profile);
  const [own, setOwn] = useState<SeriesPoint[]>(proxies[profiles[0]?.proxy ?? ""]?.points ?? []);
  const [ownLabel, setOwnLabel] = useState<string>(profiles[0]?.proxy ?? "custom");
  const [scale, setScale] = useState(1);
  const market = useMarket();

  const lastClose = daily.at(-1)?.c ?? 100;
  const snapshot = useMemo(
    () => ({
      price: market?.lastPrice || lastClose,
      minQuantityTick: market?.minQuantityTick ?? 0.001,
      takerFee: market?.takerFee ?? 0.0005,
      hourlyFundingRate: market?.hourlyFundingRate ?? 0,
    }),
    [market, lastClose],
  );

  const result = useMemo(() => run({ profile, own, index, market: snapshot, limits, scale }), [profile, own, index, snapshot, limits, scale]);

  useEffect(() => {
    if (step === "result") save({ profile, own, result, marketPrice: snapshot.price, savedAt: Date.now() });
  }, [step, profile, own, result, snapshot.price]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  // shareable deep link: /?example=<profile id> opens that example's result
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("example");
    const p = id ? profiles.find((x) => x.id === id) : undefined;
    if (p) startWithExample(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pickHistory(key: string) {
    if (proxies[key]) {
      setOwn(proxies[key]!.points);
      setOwnLabel(key);
    }
  }

  function startWithRole(role: Profile["role"]) {
    const b = blankProfile(role);
    setProfile(b.profile);
    pickHistory(b.proxy);
    setStep("fleet");
  }

  function startWithExample(p: Profile) {
    setProfile(p);
    if (p.proxy) pickHistory(p.proxy);
    setStep("result");
  }

  if (step === "start") return <StartStep profiles={profiles} onRole={startWithRole} onExample={startWithExample} />;

  if (step === "fleet")
    return (
      <FleetStep
        profile={profile}
        onProfile={setProfile}
        proxies={proxies}
        ownLabel={ownLabel}
        onOwn={(pts, label) => {
          setOwn(pts);
          setOwnLabel(label);
        }}
        scale={scale}
        onScale={setScale}
        onBack={() => setStep("start")}
        onDone={() => setStep("result")}
      />
    );

  return (
    <ResultView
      profile={profile}
      result={result}
      limits={limits}
      market={market}
      ownLabel={ownLabel}
      ownMonths={own.length}
      onEdit={() => setStep("fleet")}
    />
  );
}
