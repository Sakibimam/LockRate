import { loadDaily } from "@/lib/data";
import { ReportView } from "@/components/ReportView";

export const dynamic = "force-dynamic";

export default function ReportPage() {
  const daily = loadDaily();
  const first = daily.days[0];
  const last = daily.days.at(-1);
  return (
    <ReportView
      indexStart={first?.c ?? 0}
      indexEnd={last?.c ?? 0}
      from={first?.t ?? ""}
      to={last?.t ?? ""}
      daily={daily.days.map((d) => ({ t: d.t, c: d.c }))}
    />
  );
}
