import { Endpoints, Service } from "@/internalSettings";
import {
	type StockNewsHumanResponse,
	StockNewsHumanSchema,
	type StockNewsResponse,
	StockNewsSchema,
} from "@/resources/stocks/outputs";

import type { StocksNewsParams } from "@/resources/stocks/types";
import { StocksNewsInternalParamsSchema } from "@/resources/stocks/types";
import type { MarketDataParams, TypedPromise } from "@/types";

import { normalizeArgs } from "@/utils";
import type { StocksResource } from "./index";

export function news<
	P extends Omit<StocksNewsParams, "symbol"> & MarketDataParams,
>(
	this: StocksResource,
	symbol: string,
	params?: P,
): TypedPromise<
	StockNewsResponse,
	StockNewsHumanResponse,
	P & { symbol: string }
>;

export function news<P extends StocksNewsParams & MarketDataParams>(
	this: StocksResource,
	params: P,
): TypedPromise<StockNewsResponse, StockNewsHumanResponse, P>;

export function news(
	this: StocksResource,
	arg1: string | (StocksNewsParams & MarketDataParams),
	arg2: MarketDataParams = {},
): TypedPromise<
	StockNewsResponse,
	StockNewsHumanResponse,
	StocksNewsParams & MarketDataParams
> {
	const params = normalizeArgs(arg1, arg2, "symbol") as StocksNewsParams &
		MarketDataParams;

	const { symbol, ...queryParams } = params;

	this.logger.debug("Fetching stock news...");

	return this._fetch(
		`${Endpoints.STOCKS_NEWS}${symbol}/`,
		queryParams as MarketDataParams,
		{
			inputSchema: StocksNewsInternalParamsSchema,
			regularSchema: StockNewsSchema,
			humanSchema: StockNewsHumanSchema,
			service: Service.NEWS,
		},
	) as TypedPromise<
		StockNewsResponse,
		StockNewsHumanResponse,
		StocksNewsParams & MarketDataParams
	>;
}
