# Two minute demo

Run `pnpm dev`, open http://localhost:3000.

1. **Strip at the top.** Live SICI print from Injective mainnet, 24h change, index value, funding, and whether the data is fresh enough to plan on.

2. **Marketplace host, 64 H100s, 100% spot.** Default profile. Point at the exposure card: about $70k a month floats with spot, $706 per 1% move. Fit score 0.98 against the H100 marketplace proxy, beta 1.06. Verdict: hedge. Plan: short ~464 SICI at 1x, which is the $50k default cap, not the full book. Simulation: monthly volatility down about 60%, and the worst months mostly gone.

3. **Switch to Neocloud, 80% contracted.** Verdict flips to don't hedge. Fit score is -0.58: reserved contract prices rose while the basket fell. Plan card shows no position. This is the slide that matters.

4. **Decentralised provider, 4090 + A100.** Fit 0.55, partial. A third of the fleet is not in the index at all. Half-size hedge, and the simulation only takes about 12% of the volatility out. The leftover is the basis, on screen.

5. **AI team buyer.** Same engine, long side. Fit 0.93, long ~285 SICI.

6. **Drag the spot share slider on any profile.** Exposure and plan size move, fit score does not. Price risk and basis risk are separate numbers.

7. **Paste a few monthly prices into the CSV box.** The score recomputes on your data.

8. **Explain this.** Model writes the summary from the computed numbers. Skip if no API key.

9. **Report tab.** Statement since launch: what the index did, what your rate did, what the hedge would have returned after fees and funding.

10. **Live tab.** Off by default. With `LOCKRATE_LIVE=1` and Keplr: connect, tick the two boxes, build the order, read the checks, sign. Then read the position back and build the reduce-only close.
