import Link from "next/link";
import type { FitResult, HedgePlan, Limits } from "@lockrate/engine";
import { num, pct, signed, usd } from "@/lib/format";

export function PlanCard({ plan, fit, limits, stale }: { plan: HedgePlan; fit: FitResult; limits: Limits; stale: boolean }) {
  const none = plan.quantity === 0;
  return (
    <div className="card text-sm">
      <div className="flex items-center justify-between">
        <div className="muted text-xs">plan · SICI perp · {plan.leverage}x · USDC margin</div>
        <div className="muted text-xs">
          caps: {usd(limits.maxNotionalUsd)} notional, {limits.maxLeverage}x, {limits.staleDataMinutes} min data
        </div>
      </div>
      {none ? (
        <div className="mt-2">
          <div className="text-lg font-medium">no position</div>
          <p className="muted text-xs">{fit.verdict === "skip" ? "verdict is skip, so nothing is sized." : "size rounds to zero."}</p>
        </div>
      ) : (
        <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2 md:grid-cols-4">
          <div>
            <div className="muted text-xs">side</div>
            <div className="text-lg font-medium capitalize">{plan.side}</div>
          </div>
          <div>
            <div className="muted text-xs">quantity</div>
            <div className="text-lg font-medium num">{num(plan.quantity, 3)}</div>
          </div>
          <div>
            <div className="muted text-xs">notional</div>
            <div className="text-lg font-medium num">{usd(plan.notionalUsd)}</div>
          </div>
          <div>
            <div className="muted text-xs">margin at {plan.leverage}x</div>
            <div className="text-lg font-medium num">{usd(plan.marginUsd)}</div>
          </div>
          <div>
            <div className="muted text-xs">coverage</div>
            <div className="num">{pct(plan.coverage, 0)} of spot book × beta</div>
          </div>
          <div>
            <div className="muted text-xs">entry</div>
            <div className="num">{num(plan.entryPrice)}</div>
          </div>
          <div>
            <div className="muted text-xs">fees in + out</div>
            <div className="num">{usd(plan.feesUsd, 2)}</div>
          </div>
          <div>
            <div className="muted text-xs">funding / month</div>
            <div className="num">{signed(-plan.fundingUsdPerMonth, 2)}</div>
          </div>
        </div>
      )}
      {(plan.limitsApplied.length > 0 || plan.warnings.length > 0) && (
        <ul className="mt-3 space-y-1 text-xs">
          {plan.limitsApplied.map((l, i) => (
            <li key={`l${i}`} className="t-warn">
              limit: {l}
            </li>
          ))}
          {plan.warnings.map((w, i) => (
            <li key={`w${i}`} className="muted">
              {w}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex items-center gap-3">
        <Link href="/live" className={`primary inline-block rounded px-3 py-1.5 text-xs ${none || stale ? "pointer-events-none opacity-40" : ""}`} style={{ background: "var(--fg)", color: "var(--bg)" }}>
          preview order
        </Link>
        <Link href="/report" className="ghost text-xs">
          monthly statement
        </Link>
        <span className="muted text-xs">nothing is sent anywhere until you sign it</span>
      </div>
    </div>
  );
}
