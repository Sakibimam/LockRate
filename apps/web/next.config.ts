import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@lockrate/engine", "@lockrate/injective", "@lockrate/explain"],
  env: {
    NEXT_PUBLIC_LOCKRATE_LIVE: process.env.LOCKRATE_LIVE ?? "0",
    NEXT_PUBLIC_INJECTIVE_NETWORK: process.env.INJECTIVE_NETWORK ?? "mainnet",
  },
};

export default config;
