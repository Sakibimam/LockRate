import Link from "next/link";
import type { FitResult, HedgePlan, Limits } from "@lockrate/engine";
import { num, usd } from "@/lib/format";

export function PlanCard({ plan, fit, limits, stale }: { plan: HedgePlan; fit: FitResult; limits: Limits; stale: boolean }) {
  if (plan.quantity === 0) {
    return (
      <section>
        <h2 className="text-2xl font-bold">What to do</h2>
        <p className="mt-2 max-w-2xl">
          {fit.verdict === "skip"
            ? "Nothing for now. Check again once you have a few more months of prices, or if your mix of cards changes."
            : "The suggested size rounds down to zero. Try a larger fleet or hedge size."}
        </p>
      </section>
    );
  }

  const verb = plan.side === "short" ? "Sell" : "Buy";
  const funding = -plan.fundingUsdPerMonth;
  return (
    <section>
      <h2 className="text-2xl font-bold">What to do</h2>
      <p className="mt-2 max-w-2xl text-[17px]">
        {verb} <strong className="num">{num(plan.quantity, 3)}</strong> SICI contracts on Injective with no leverage. You put
        up <strong className="num">{usd(plan.marginUsd)}</strong> in USDC, and you can close it any time.
      </p>
      <ul className="muted mt-3 max-w-2xl space-y-1 text-sm">
        <li>Trading fees to open and close: about {usd(plan.feesUsd, 2)}.</li>
        <li>
          Holding cost: about {usd(Math.abs(funding), 2)} a month {funding >= 0 ? "paid to you" : "paid by you"} at today's rate.
        </li>
        {plan.capped && <li>Capped at your {usd(limits.maxNotionalUsd)} limit.</li>}
      </ul>
      {stale && (
        <p className="t-warn mt-3 text-sm">
          Market prices haven't updated in over {limits.staleDataMinutes / 60} hours. Placing a hedge is off until they do.
        </p>
      )}
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href="/live" className="btn btn-primary" aria-disabled={stale}>
          Preview this hedge
        </Link>
        <Link href="/report" className="btn">
          See a monthly statement
        </Link>
      </div>
      <p className="muted mt-3 text-sm">Nothing is sent until you approve it in your own wallet.</p>
    </section>
  );
}
