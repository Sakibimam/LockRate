# Two-minute demo

Open **https://lockrate.vercel.app**, or run `pnpm dev` and open http://localhost:3000.

1. **The line at the top of the answer** is the live SICI price from Injective mainnet, its change today, and how fresh it is. If the market hasn't traded in 3 hours, placing a hedge is switched off.

2. **Pick "Marketplace host, 64 H100s, 100% spot".** The answer turns green: *Yes, a hedge would protect you.* About $70k a month moves with the market, and a 1% drop costs $706 a month. The price match is *Strong*. *What to do* says to sell about 464 SICI with no leverage. That's the $50k cap, not the whole business. The replay shows month-to-month swings about 61% smaller.

3. **Switch to "Neocloud, 512 H100s, 80% on 1y contracts".** The answer turns red: *No. A hedge wouldn't protect you.* Its contract prices rose while the index fell, so the price match is *Opposite*. *What to do* says nothing for now. **This is the slide that matters.**

4. **"Decentralised provider, 4090 + A100 mix".** Amber: *a small hedge could help a little.* A fifth of the fleet's hours are on cards that aren't in the index. The half-size hedge only removes about 12% of the swings, and the leftover risk is on screen.

5. **"AI team, on-demand inference buyer".** The same engine, pointed the other way. This business *pays* more when prices rise, so the plan is to **buy** about 285 SICI.

6. **Drag "Income at market prices" on any example.** The dollars and the hedge size move, but the price match doesn't. How much risk you have and whether the index tracks it are separate questions.

7. **More settings → Your past prices → "My own, pasted in".** Paste a few months like `2026-03, 2.15`. The answer recomputes on your own data.

8. **Explain this in plain words.** The AI writes a summary of the numbers above. It works only if an API key is set, and everything else works without one.

9. **How this was worked out** opens the maths: price match bar, beta, per-card table, replay statistics, limits.

10. **Monthly statement** shows what the index did since launch, what your price did, and what the hedge would have returned after costs.

11. **Place a hedge** is switched off on the public site. With `LOCKRATE_LIVE=1` and Keplr: connect, tick the two boxes, check the order, read the checks, approve. Then use *Close an open hedge* to read the position back and build a reduce-only close.
