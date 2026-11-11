# Security

Lockrate builds orders that move real money, so security reports are very welcome.

## Reporting

Please **don't open a public issue**. Use [GitHub's private vulnerability reporting](https://github.com/Sakibimam/LockRate/security/advisories/new) instead. You'll get a reply within a few days.

Especially interesting:

- any way to build an order above the size cap, above 1x, or on stale data
- any way for AI output to reach an order
- anything that leaks a wallet address or profile to a third party

## What Lockrate does and doesn't hold

- **No private keys.** Orders are built unsigned and signed in your own wallet (Keplr or Leap).
- **No funds.** Nothing is custodial.
- **No user accounts or database.** Your inputs stay in your browser's localStorage.
- **Server-side secrets:** only the optional `ANTHROPIC_API_KEY`, kept in environment variables and never sent to the browser.

## Live trading

The *Place a hedge* page is off unless `LOCKRATE_LIVE=1` is set. The public demo at lockrate.vercel.app runs with it off.
