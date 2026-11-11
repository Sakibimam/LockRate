"use client";

import { useEffect, useMemo, useState } from "react";
import { run, type Limits, type Profile, type SeriesPoint } from "@lockrate/engine";
import type { SiciApi } from "@/app/api/sici/route";
import { save } from "@/lib/store";
import { ProfileForm } from "./ProfileForm";
import { MarketLine } from "./MarketLine";
import { Answer } from "./Answer";
import { PlanCard } from "./PlanCard";
import { SimChart } from "./SimChart";
import { Details } from "./Details";
import { ExplainBox } from "./ExplainBox";

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

export function Dashboard({ profiles, proxies, index, daily, limits }: Props) {
  const [profile, setProfile] = useState<Profile>(profiles[0] as Profile);
  const [own, setOwn] = useState<SeriesPoint[]>(proxies[profiles[0]?.proxy ?? ""]?.points ?? []);
  const [ownLabel, setOwnLabel] = useState<string>(profiles[0]?.proxy ?? "custom");
  const [scale, setScale] = useState(1);
  const [market, setMarket] = useState<SiciApi | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/sici")
      .then((r) => r.json())
      .then((m: SiciApi) => alive && setMarket(m))
      .catch(() => alive && setMarket(null));
    return () => {
      alive = false;
    };
  }, []);

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
    save({ profile, own, result, marketPrice: snapshot.price, savedAt: Date.now() });
  }, [profile, own, result, snapshot.price]);

  function pickProfile(p: Profile) {
    setProfile(p);
    if (p.proxy && proxies[p.proxy]) {
      setOwn(proxies[p.proxy]!.points);
      setOwnLabel(p.proxy);
    }
  }

  const stale = market ? !market.fresh : true;

  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
      <div className="min-w-0 lg:sticky lg:top-6">
        <ProfileForm
          profiles={profiles}
          profile={profile}
          onProfile={setProfile}
          onPick={pickProfile}
          proxies={proxies}
          ownLabel={ownLabel}
          onOwn={(pts, label) => {
            setOwn(pts);
            setOwnLabel(label);
          }}
          scale={scale}
          onScale={setScale}
        />
      </div>

      <div className="min-w-0 space-y-12">
        <div className="space-y-4">
          <MarketLine market={market} fallbackPrice={lastClose} />
          <Answer fit={result.fit} exposure={result.exposure} plan={result.plan} profile={profile} />
        </div>
        <PlanCard plan={result.plan} fit={result.fit} limits={limits} stale={stale} />
        <SimChart sim={result.sim} hedged={result.plan.quantity > 0} />
        <ExplainBox profile={profile} result={result} />
        <Details
          fit={result.fit}
          exposure={result.exposure}
          plan={result.plan}
          sim={result.sim}
          limits={limits}
          ownLabel={ownLabel}
          ownMonths={own.length}
        />
      </div>
    </div>
  );
}
