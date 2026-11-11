# Two-minute demo

Open **https://lockrate.vercel.app**, or run `pnpm dev` and open http://localhost:3000.

1. **The pill in the header** shows the live SICI GPU index from Injective mainnet. The dot is green when the data is fresh.

2. **Start screen.** One question: *I rent out GPUs* or *I pay for GPUs*. Or tap an example.

3. **Tap "64 H100 host".** Green: *You should hedge.* Three numbers: $70.6k at risk a month, −$706 for every 1% drop, and a *Strong* index match. The plan card says to sell 463.6 SICI, capped at $50k, with no leverage. The replay is 61% calmer.

4. **Back, then "Neocloud on contracts".** Red: *Don't hedge.* Its contract prices rose while the index fell, so the match is *Opposite*. The plan card says *Nothing to do*. **This is the slide that matters.**

5. **"4090 + A100 provider".** Amber: *A small hedge could help.* Part of the fleet isn't in the index, so the hedge only takes about 12% of the swings out.

6. **"AI team buying GPUs".** The same engine, the other way round. This business pays more when prices rise, so it **buys** 284.9 SICI.

7. **Edit**, then drag *Paid at market price.* The dollars and hedge size move, but the index match doesn't. How much risk you have and whether the index tracks it are separate questions.

8. **More options → Your past prices → Paste my own.** Paste a few months like `2026-03, 2.15` and the answer recomputes on your data.

9. **How we worked this out** opens the maths: the match bar, beta, the per-GPU table, replay statistics and the safety limits.

10. **Explain this to me** gets a plain-English summary from AI. It only works if an API key is set.

11. **Statement** shows what the index did since launch and what the hedge would have returned after costs.

12. **Connect wallet**, then **Hedge.** Trading is off on the public site. With `LOCKRATE_LIVE=1`: confirm the two boxes, check the order, read the checks, and approve in Keplr. *Close an open hedge* reads the position back and builds a reduce-only close.
