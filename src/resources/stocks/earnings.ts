import { Endpoints, Service } from "@/internalSettings";
import {
	type StockEarningsHumanResponse,
	StockEarningsHumanSchema,
	type StockEarningsResponse,
	StockEarningsSchema,
} from "@/resources/stocks/outputs";
import {
	type StocksEarningsParams,
	StocksEarningsParamsSchema,
} from "@/resources/stocks/types";
import type { MarketDataParams, TypedPromise } from "@/types";
import { normalizeArgs } from "@/utils";
import type { StocksResource } from "./index";

export function earnings<
	P extends Omit<StocksEarningsParams, "symbol"> & MarketDataParams,
>(
	this: StocksResource,
	symbol: string,
	params?: P,
): TypedPromise<
	StockEarningsResponse,
	StockEarningsHumanResponse,
	P & { symbol: string }
>;

export function earnings<P extends StocksEarningsParams & MarketDataParams>(
	this: StocksResource,
	params: P,
): TypedPromise<StockEarningsResponse, StockEarningsHumanResponse, P>;

export function earnings(
	this: StocksResource,
	arg1: string | (StocksEarningsParams & MarketDataParams),
	arg2: MarketDataParams = {},
): TypedPromise<
	StockEarningsResponse,
	StockEarningsHumanResponse,
	StocksEarningsParams & MarketDataParams
> {
	const params = normalizeArgs(arg1, arg2, "symbol") as StocksEarningsParams &
		MarketDataParams;

	this.logger.debug("Fetching stock earnings...");

	return this._fetch(`${Endpoints.STOCKS_EARNINGS}${params.symbol}/`, params, {
		inputSchema: StocksEarningsParamsSchema,
		regularSchema: StockEarningsSchema,
		humanSchema: StockEarningsHumanSchema,
		service: Service.EARNINGS,
	}) as TypedPromise<
		StockEarningsResponse,
		StockEarningsHumanResponse,
		StocksEarningsParams & MarketDataParams
	>;
}
