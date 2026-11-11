import type { Metadata } from "next";
import { Bricolage_Grotesque, Public_Sans } from "next/font/google";
import { Nav } from "@/components/Nav";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", weight: ["500", "700"] });
const publicSans = Public_Sans({ subsets: ["latin"], variable: "--font-public" });

export const metadata: Metadata = {
  title: "Lockrate",
  description: "Find out whether your GPU rental prices can be hedged, and by how much.",
};

const live = process.env.NEXT_PUBLIC_LOCKRATE_LIVE === "1";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${publicSans.variable}`}>
      <body className="min-h-screen">
        <header className="border-b" style={{ borderColor: "var(--line)" }}>
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4">
            <a href="/" className="display text-xl font-bold">
              Lockrate
            </a>
            <Nav />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 pb-10 text-sm muted">
          <p className="max-w-2xl">
            {live ? "Live trading is switched on." : "Practice mode. Nothing is traded."} Lockrate never holds your keys or
            funds, and this is not financial advice.{" "}
            <a className="underline" href="https://github.com/Sakibimam/LockRate" target="_blank" rel="noreferrer">
              Source code
            </a>
          </p>
        </footer>
      </body>
    </html>
  );
}
