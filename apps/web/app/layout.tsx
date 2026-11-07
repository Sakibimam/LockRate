import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lockrate",
  description: "GPU price exposure, SICI hedge fit, and paper hedges on Injective",
};

const live = process.env.NEXT_PUBLIC_LOCKRATE_LIVE === "1";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b" style={{ borderColor: "var(--line)" }}>
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-6">
              <Link href="/" className="font-semibold tracking-tight">
                Lockrate
              </Link>
              <nav className="flex gap-4 text-sm">
                <Link href="/">Analyse</Link>
                <Link href="/report">Report</Link>
                <Link href="/live">Live</Link>
              </nav>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="rounded-full border px-2 py-0.5" style={{ borderColor: "var(--line)" }}>
                {live ? "live enabled" : "paper mode"}
              </span>
              <a className="muted" href="https://github.com/Sakibimam/LockRate" target="_blank" rel="noreferrer">
                source
              </a>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 py-8 text-xs muted">
          Lockrate measures exposure and builds hedges you sign yourself. It is not financial advice. SICI markets are
          young and thin. Options are testnet-only. Check what applies where you are.
        </footer>
      </body>
    </html>
  );
}
