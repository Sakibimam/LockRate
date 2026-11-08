import { limitsFromEnv } from "@lockrate/engine";
import { Dashboard } from "@/components/Dashboard";
import { indexMonthly, loadDaily, loadProfiles, loadProxies } from "@/lib/data";

export const dynamic = "force-dynamic";

export default function Page() {
  const daily = loadDaily();
  const proxies = loadProxies();
  const profiles = loadProfiles();
  const index = indexMonthly(daily, proxies);
  const limits = limitsFromEnv(process.env);
  const proxySeries = Object.fromEntries(
    Object.entries(proxies)
      .filter(([k]) => k !== "sici-monthly-backfill")
      .map(([k, v]) => [k, { points: v.points, note: v.note, unit: v.unit }]),
  );

  return (
    <Dashboard
      profiles={profiles}
      proxies={proxySeries}
      index={index}
      daily={daily.days.map((d) => ({ t: d.t, c: d.c }))}
      limits={limits}
      dataGeneratedAt={daily.generatedAt}
    />
  );
}
