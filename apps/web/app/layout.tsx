import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/Header";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Lockrate · Protect your GPU income from price swings",
  description: "Find out in 30 seconds if a hedge would protect your GPU income or GPU bill.",
};

export const viewport: Viewport = { themeColor: "#ffffff", colorScheme: "light" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans">
        <TooltipProvider delayDuration={150}>
          <Header />
          <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">{children}</main>
          <footer className="border-t border-zinc-100">
            <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p>Practice mode. Not financial advice. Lockrate never holds your keys or funds.</p>
              <a className="hover:text-zinc-900" href="https://github.com/Sakibimam/LockRate" target="_blank" rel="noreferrer">
                GitHub
              </a>
            </div>
          </footer>
        </TooltipProvider>
      </body>
    </html>
  );
}
