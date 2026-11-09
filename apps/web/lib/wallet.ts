"use client";

import { Network, getNetworkEndpoints } from "@injectivelabs/networks";
import { ChainId } from "@injectivelabs/ts-types";
import { Wallet } from "@injectivelabs/wallet-base";
import { BaseWalletStrategy, MsgBroadcaster } from "@injectivelabs/wallet-core";
import { CosmosWalletStrategy } from "@injectivelabs/wallet-cosmos";
import type { Msgs } from "@injectivelabs/sdk-ts";

const isTestnet = process.env.NEXT_PUBLIC_INJECTIVE_NETWORK === "testnet";
export const network = isTestnet ? Network.Testnet : Network.Mainnet;
export const chainId = isTestnet ? ChainId.Testnet : ChainId.Mainnet;

let strategy: BaseWalletStrategy | null = null;

export function walletStrategy(): BaseWalletStrategy {
  if (!strategy) {
    const endpoints = getNetworkEndpoints(network);
    // wallet-core only: the full wallet-strategy package pulls in walletconnect,
    // reown and half of the evm wallet world, none of which we need for keplr/leap.
    strategy = new BaseWalletStrategy({
      chainId,
      strategies: {
        [Wallet.Keplr]: new CosmosWalletStrategy({ chainId, wallet: Wallet.Keplr, endpoints }),
        [Wallet.Leap]: new CosmosWalletStrategy({ chainId, wallet: Wallet.Leap, endpoints }),
      },
    });
  }
  return strategy;
}

export async function connect(wallet: Wallet = Wallet.Keplr): Promise<string> {
  const s = walletStrategy();
  await s.setWallet(wallet);
  await s.enable();
  const [address] = await s.getAddresses();
  if (!address) throw new Error("wallet returned no address");
  return address;
}

export async function disconnect() {
  if (strategy) await strategy.disconnect();
}

export async function broadcast(msgs: Msgs | Msgs[], injectiveAddress: string): Promise<string> {
  const s = walletStrategy();
  const broadcaster = new MsgBroadcaster({
    network,
    walletStrategy: s,
    endpoints: getNetworkEndpoints(network),
    simulateTx: true,
  });
  const res = await broadcaster.broadcast({ msgs, injectiveAddress });
  return res.txHash;
}

export function explorerTx(hash: string): string {
  return isTestnet ? `https://testnet.explorer.injective.network/transaction/${hash}` : `https://explorer.injective.network/transaction/${hash}`;
}
