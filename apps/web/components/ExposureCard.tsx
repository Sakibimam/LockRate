import { GPU_LABELS, type Exposure, type Profile } from "@lockrate/engine";
import { num, pct, usd } from "@/lib/format";

export function ExposureCard({ exposure, profile }: { exposure: Exposure; profile: Profile }) {
  const verb = profile.role === "operator" ? "revenue" : "spend";
  return (
    <div className="card text-sm">
      <div className="muted text-xs">exposure</div>
      <div className="mt-1 text-2xl font-semibold num">{usd(exposure.spotNotionalUsd)}</div>
      <div className="muted text-xs">
        of {usd(exposure.totalNotionalUsd)} monthly {verb} floats with spot
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="muted">per 1% move</div>
          <div className="num">{usd(exposure.dollarsPerPct)}/month</div>
        </div>
        <div>
          <div className="muted">GPU-hours</div>
          <div className="num">{num(exposure.gpuHours, 0)}/month</div>
        </div>
        <div>
          <div className="muted">in SICI basket</div>
          <div className="num">{pct(exposure.basketOverlap, 0)} of hours</div>
        </div>
        <div>
          <div className="muted">direction</div>
          <div>{exposure.direction === -1 ? "hurt when prices fall" : "hurt when prices rise"}</div>
        </div>
      </div>
      <table className="mt-3 w-full text-xs">
        <tbody>
          {exposure.byModel.map((m, i) => (
            <tr key={i} className={m.inBasket ? "" : "muted"}>
              <td className="py-0.5">{GPU_LABELS[m.model]}</td>
              <td className="num text-right">{num(m.gpuHours, 0)} h</td>
              <td className="num text-right">{usd(m.notionalUsd)}</td>
              <td className="text-right">{m.inBasket ? "" : "not in index"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
