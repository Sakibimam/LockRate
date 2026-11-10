import {
  MsgCreateDerivativeLimitOrderV2,
  MsgCreateDerivativeMarketOrderV2,
  getDefaultSubaccountId,
} from "@injectivelabs/sdk-ts";

// protobuf enum values (BUY = 1, SELL = 2). the sdk only re-exports the type, not the enum object.
type ChainOrderType = MsgCreateDerivativeMarketOrderV2.Params["orderType"];
const ORDER_BUY = 1 as ChainOrderType;
const ORDER_SELL = 2 as ChainOrderType;
import type { HedgePlan, Limits } from "@lockrate/engine";
import { DEFAULT_LIMITS } from "@lockrate/engine";
import type { SiciMarketInfo } from "./sici";

export interface OrderRequest {
  plan: HedgePlan;
  market: SiciMarketInfo;
  injectiveAddress: string;
  /** limit orders only. in index points */
  limitPrice?: number;
  /** slippage tolerance for market orders, fraction. default 1% */
  slippage?: number;
  limits?: Limits;
  feeRecipient?: string;
}

export interface OrderPreview {
  kind: "market" | "limit";
  side: "long" | "short";
  quantity: number;
  worstPrice: number;
  notionalUsd: number;
  marginUsd: number;
  leverage: number;
  marketId: string;
  subaccountId: string;
  checks: string[];
}

export class OrderRefused extends Error {
  constructor(public reason: string) {
    super(reason);
    this.name = "OrderRefused";
  }
}

function roundDown(x: number, step: number): number {
  return step > 0 ? Math.floor(x / step + 1e-9) * step : x;
}
function roundUp(x: number, step: number): number {
  return step > 0 ? Math.ceil(x / step - 1e-9) * step : x;
}

/**
 * turns a hedge plan into an unsigned injective message. the limits are
 * re-checked here even though the planner already applied them, because this
 * is the last line before a wallet sees it.
 */
export function buildPerpOrder(req: OrderRequest): { msg: MsgCreateDerivativeMarketOrderV2 | MsgCreateDerivativeLimitOrderV2; preview: OrderPreview } {
  const limits = req.limits ?? DEFAULT_LIMITS;
  const { plan, market } = req;
  const checks: string[] = [];

  if (plan.instrument !== "perp") throw new OrderRefused("only perp orders can be built right now");
  if (plan.quantity <= 0) throw new OrderRefused("plan quantity is zero");
  if (plan.leverage > limits.maxLeverage) throw new OrderRefused(`leverage ${plan.leverage}x above limit ${limits.maxLeverage}x`);
  if (market.status !== "active") throw new OrderRefused(`market is ${market.status}`);

  const quantity = roundDown(plan.quantity, market.minQuantityTick);
  if (quantity <= 0) throw new OrderRefused("quantity rounds to zero at the market tick");
  checks.push(`quantity ${quantity} (tick ${market.minQuantityTick})`);

  const isLong = plan.side === "long";
  const slippage = req.slippage ?? 0.01;
  const kind: "market" | "limit" = req.limitPrice ? "limit" : "market";
  const rawWorst = req.limitPrice ?? plan.entryPrice * (isLong ? 1 + slippage : 1 - slippage);
  const worstPrice = isLong ? roundUp(rawWorst, market.minPriceTick) : roundDown(rawWorst, market.minPriceTick);
  checks.push(`${kind} order, worst price ${worstPrice}`);

  const notional = quantity * worstPrice;
  if (notional > limits.maxNotionalUsd) {
    throw new OrderRefused(`notional $${notional.toFixed(0)} above cap $${limits.maxNotionalUsd}`);
  }
  checks.push(`notional $${notional.toFixed(2)} under cap $${limits.maxNotionalUsd}`);

  // 1x: margin equals notional. the chain requires margin >= notional * initialMarginRatio,
  // so this is always comfortably above the minimum.
  const margin = notional / plan.leverage;
  checks.push(`margin $${margin.toFixed(2)} at ${plan.leverage}x`);

  const subaccountId = getDefaultSubaccountId(req.injectiveAddress);
  const feeRecipient = req.feeRecipient ?? req.injectiveAddress;

  const params = {
    marketId: market.marketId,
    subaccountId,
    injectiveAddress: req.injectiveAddress,
    orderType: isLong ? ORDER_BUY : ORDER_SELL,
    feeRecipient,
    price: worstPrice.toString(),
    quantity: quantity.toString(),
    margin: margin.toString(),
  };

  const msg =
    kind === "market"
      ? MsgCreateDerivativeMarketOrderV2.fromJSON(params)
      : MsgCreateDerivativeLimitOrderV2.fromJSON(params);

  return {
    msg,
    preview: {
      kind,
      side: plan.side,
      quantity,
      worstPrice,
      notionalUsd: Number(notional.toFixed(2)),
      marginUsd: Number(margin.toFixed(2)),
      leverage: plan.leverage,
      marketId: market.marketId,
      subaccountId,
      checks,
    },
  };
}

export interface CloseRequest {
  position: { direction: "long" | "short"; quantity: number; markPrice: number };
  market: SiciMarketInfo;
  injectiveAddress: string;
  slippage?: number;
  feeRecipient?: string;
}

/**
 * reduce-only market order on the opposite side, margin 0. this is how you flatten
 * a perp on injective without opening anything new.
 */
export function buildClosePerpOrder(req: CloseRequest): { msg: MsgCreateDerivativeMarketOrderV2; preview: OrderPreview } {
  const { position, market } = req;
  if (position.quantity <= 0) throw new OrderRefused("no position to close");
  if (market.status !== "active") throw new OrderRefused(`market is ${market.status}`);
  const closeLong = position.direction === "long";
  const slippage = req.slippage ?? 0.01;
  const rawWorst = position.markPrice * (closeLong ? 1 - slippage : 1 + slippage);
  const worstPrice = closeLong ? roundDown(rawWorst, market.minPriceTick) : roundUp(rawWorst, market.minPriceTick);
  const quantity = roundDown(position.quantity, market.minQuantityTick);
  const subaccountId = getDefaultSubaccountId(req.injectiveAddress);
  const msg = MsgCreateDerivativeMarketOrderV2.fromJSON({
    marketId: market.marketId,
    subaccountId,
    injectiveAddress: req.injectiveAddress,
    orderType: closeLong ? ORDER_SELL : ORDER_BUY,
    feeRecipient: req.feeRecipient ?? req.injectiveAddress,
    price: worstPrice.toString(),
    quantity: quantity.toString(),
    margin: "0",
  });
  return {
    msg,
    preview: {
      kind: "market",
      side: closeLong ? "short" : "long",
      quantity,
      worstPrice,
      notionalUsd: Number((quantity * worstPrice).toFixed(2)),
      marginUsd: 0,
      leverage: 0,
      marketId: market.marketId,
      subaccountId,
      checks: [`reduce-only, closes ${position.direction} ${position.quantity}`, `worst price ${worstPrice}`, "margin 0, nothing new is opened"],
    },
  };
}
