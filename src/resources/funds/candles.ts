import { Endpoints, Service } from "@/internalSettings";
import {
	type FundsCandleHumanResponse,
	FundsCandleHumanSchema,
	type FundsCandleResponse,
	FundsCandleSchema,
} from "@/resources/funds/outputs";
import {
	type FundsCandlesParams,
	FundsCandlesParamsSchema,
} from "@/resources/funds/types";
import type { MarketDataParams, TypedResult } from "@/types";
import { normalizeArgs } from "@/utils";
import type { FundsResource } from "./index";

export function candles<
	P extends Omit<FundsCandlesParams, "symbol"> & MarketDataParams,
>(
	this: FundsResource,
	symbol: string,
	params?: P,
): TypedResult<
	FundsCandleResponse,
	FundsCandleHumanResponse,
	P & { symbol: string }
>;
export function candles<P extends FundsCandlesParams & MarketDataParams>(
	this: FundsResource,
	params: P,
): TypedResult<FundsCandleResponse, FundsCandleHumanResponse, P>;
export function candles(
	this: FundsResource,
	arg1: string | (FundsCandlesParams & MarketDataParams),
	arg2: MarketDataParams = {},
): TypedResult<
	FundsCandleResponse,
	FundsCandleHumanResponse,
	FundsCandlesParams & MarketDataParams
> {
	const params = normalizeArgs(arg1, arg2, "symbol") as FundsCandlesParams &
		MarketDataParams;

	this.logger.debug("Fetching fund candles...");

	return this._fetch(
		`${Endpoints.FUNDS_CANDLES}${params.resolution || "D"}/${params.symbol}/`,
		params,
		{
			inputSchema: FundsCandlesParamsSchema,
			regularSchema: FundsCandleSchema,
			humanSchema: FundsCandleHumanSchema,
			service: Service.FUNDS_CANDLES,
		},
	);
}
