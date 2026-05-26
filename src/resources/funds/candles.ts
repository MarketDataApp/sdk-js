import { Endpoints, Service } from "@/internalSettings";
import {
	type FundsCandleHumanResponse,
	FundsCandleHumanSchema,
	type FundsCandleResponse,
	FundsCandleSchema,
} from "@/resources/funds/outputs";
import {
	FundsCandlesInternalParamsSchema,
	type FundsCandlesParams,
} from "@/resources/funds/types";
import type { MarketDataParams, TypedPromise } from "@/types";
import { normalizeArgs } from "@/utils";
import type { FundsResource } from "./index";

export function candles<
	P extends Omit<FundsCandlesParams, "symbol"> & MarketDataParams,
>(
	this: FundsResource,
	symbol: string,
	params?: P,
): TypedPromise<
	FundsCandleResponse,
	FundsCandleHumanResponse,
	P & { symbol: string }
>;
export function candles<P extends FundsCandlesParams & MarketDataParams>(
	this: FundsResource,
	params: P,
): TypedPromise<FundsCandleResponse, FundsCandleHumanResponse, P>;
export function candles(
	this: FundsResource,
	arg1: string | (FundsCandlesParams & MarketDataParams),
	arg2: MarketDataParams = {},
): TypedPromise<
	FundsCandleResponse,
	FundsCandleHumanResponse,
	FundsCandlesParams & MarketDataParams
> {
	const params = normalizeArgs(arg1, arg2, "symbol") as FundsCandlesParams &
		MarketDataParams;

	const { symbol, resolution, ...queryParams } = params;

	this.logger.debug("Fetching fund candles...");

	return this._fetch(
		`${Endpoints.FUNDS_CANDLES}${resolution || "D"}/${symbol}/`,
		queryParams as MarketDataParams,
		{
			inputSchema: FundsCandlesInternalParamsSchema,
			regularSchema: FundsCandleSchema,
			humanSchema: FundsCandleHumanSchema,
			service: Service.FUNDS_CANDLES,
		},
	);
}
