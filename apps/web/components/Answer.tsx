import type { Exposure, FitResult, HedgePlan, Profile } from "@lockrate/engine";
import { num, pct, usd } from "@/lib/format";
import { matchWord } from "@/lib/words";

const HEADLINE = {
  hedge: { stamp: "Hedge", title: "Yes, a hedge would protect you." },
  partial: { stamp: "Small hedge", title: "A small hedge could help a little." },
  skip: { stamp: "Don't hedge", title: "No. A hedge wouldn't protect you." },
} as const;

function why(fit: FitResult, seller: boolean): string {
  const you = seller ? "your rental prices" : "the prices you pay";
  if (fit.verdict === "hedge") return `The GPU price index has moved closely with ${you}, so a position on it can cancel out most of your price swings.`;
  if (fit.verdict === "partial") return `The GPU price index only partly follows ${you}. We suggest a smaller hedge, and some of your risk stays with you.`;
  if (fit.beta < 0) return `The GPU price index has moved the opposite way to ${you}. A hedge would have lost money exactly when you did.`;
  return `The GPU price index doesn't follow ${you} closely enough. A hedge would be a second bet, not protection.`;
}

export function Answer({ fit, exposure, plan, profile }: { fit: FitResult; exposure: Exposure; plan: HedgePlan; profile: Profile }) {
  const seller = profile.role === "operator";
  const h = HEADLINE[fit.verdict];
  const moveWord = seller ? "fall" : "rise";
  const lossWord = seller ? "earn" : "pay";
  const lossDir = seller ? "less" : "more";

  return (
    <section className={`answer answer-${fit.verdict}`} aria-live="polite">
      <p className="tone display text-base font-bold">{h.stamp}</p>
      <h1 className="mt-1 text-3xl font-bold sm:text-[2.5rem]">{h.title}</h1>
      <p className="mt-3 max-w-2xl text-[17px]">{why(fit, seller)}</p>

      <dl className="facts mt-6">
        <div>
          <dt>{seller ? "Monthly income" : "Monthly GPU bill"} that moves with market prices</dt>
          <dd>{usd(exposure.spotNotionalUsd)}</dd>
        </div>
        <div>
          <dt>
            If prices {moveWord} 1%, you {lossWord} this much {lossDir} each month
          </dt>
          <dd>{usd(exposure.dollarsPerPct)}</dd>
        </div>
        <div>
          <dt>How closely the index follows your prices</dt>
          <dd>{matchWord(fit)}</dd>
        </div>
        {plan.quantity > 0 && (
          <div>
            <dt>Suggested hedge size</dt>
            <dd>
              {usd(plan.notionalUsd)} <span className="muted font-normal">({pct(plan.coverage, 0)} covered)</span>
            </dd>
          </div>
        )}
      </dl>

      {fit.lowConfidence && (
        <p className="t-warn mt-4 text-sm">
          Based on only {num(fit.n, 0)} months of prices, so treat this as a first look.
        </p>
      )}
    </section>
  );
}
