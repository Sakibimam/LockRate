import { Network, getNetworkEndpoints, type NetworkEndpoints } from "@injectivelabs/networks";

export type NetworkName = "mainnet" | "testnet";

/** SICI/USDC PERP on mainnet. launched 2026-10-26 */
export const SICI_MAINNET_MARKET_ID = "0x6751442adea73a2b65adce484dd7bde25d204c9695fc9d5410933171f3417410";

export const SICI_ORACLE = {
  base: "SICI/USDC",
  quote: "InjectiveLabs",
  type: "provider",
  scaleFactor: 6,
} as const;

export interface InjectiveConfig {
  network: NetworkName;
  endpoints: NetworkEndpoints;
  marketId: string;
}

export function resolveNetwork(name?: string): Network {
  return name === "testnet" ? Network.Testnet : Network.Mainnet;
}

export function loadConfig(env: Record<string, string | undefined> = {}): InjectiveConfig {
  const network: NetworkName = env.INJECTIVE_NETWORK === "testnet" ? "testnet" : "mainnet";
  const marketId = env.SICI_MARKET_ID && env.SICI_MARKET_ID.startsWith("0x") ? env.SICI_MARKET_ID : SICI_MAINNET_MARKET_ID;
  return {
    network,
    endpoints: getNetworkEndpoints(resolveNetwork(network)),
    marketId,
  };
}
