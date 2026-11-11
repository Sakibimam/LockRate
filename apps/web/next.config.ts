import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@lockrate/engine", "@lockrate/injective", "@lockrate/explain"],
  env: {
    NEXT_PUBLIC_LOCKRATE_LIVE: process.env.LOCKRATE_LIVE ?? "0",
    NEXT_PUBLIC_INJECTIVE_NETWORK: process.env.INJECTIVE_NETWORK ?? "mainnet",
  },
  // lib/data.ts reads data/ off disk at request time. the bundler cannot see
  // that, so on vercel the folder has to be pulled into every function by hand.
  outputFileTracingIncludes: {
    "/**": ["../../data/**/*.json"],
  },
};

export default config;
