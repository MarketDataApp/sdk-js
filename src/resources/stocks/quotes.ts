import { Endpoints, Service } from "@/internalSettings";
import {
	type StockQuoteHumanResponse,
	StockQuoteHumanSchema,
	type StockQuoteResponse,
	StockQuoteSchema,
} from "@/resources/stocks/outputs";

import type { StocksQuotesParams } from "@/resources/stocks/types";
import { StocksQuotesParamsSchema } from "@/resources/stocks/types";
import type { MarketDataParams, TypedResult } from "@/types";

import { normalizeArgs } from "@/utils";
import type { StocksResource } from "./index";

export function quotes<
	P extends Omit<StocksQuotesParams, "symbols"> & MarketDataParams,
>(
	this: StocksResource,
	symbols: string | string[],
	params?: P,
): TypedResult<
	StockQuoteResponse,
	StockQuoteHumanResponse,
	P & { symbols: string | string[] }
>;

export function quotes<P extends StocksQuotesParams & MarketDataParams>(
	this: StocksResource,
	params: P,
): TypedResult<StockQuoteResponse, StockQuoteHumanResponse, P>;

export function quotes(
	this: StocksResource,
	arg1: string | string[] | (StocksQuotesParams & MarketDataParams),
	arg2: MarketDataParams = {},
): TypedResult<
	StockQuoteResponse,
	StockQuoteHumanResponse,
	StocksQuotesParams & MarketDataParams
> {
	const params = normalizeArgs(arg1, arg2, "symbols") as StocksQuotesParams &
		MarketDataParams;

	const { symbols, ...queryParams } = params;

	return this._fetch(
		Endpoints.STOCKS_BULK_QUOTES,
		{ ...queryParams, symbols } as MarketDataParams,
		{
			inputSchema: StocksQuotesParamsSchema,
			regularSchema: StockQuoteSchema,
			humanSchema: StockQuoteHumanSchema,
			service: Service.STOCKS_QUOTES,
		},
	) as TypedResult<
		StockQuoteResponse,
		StockQuoteHumanResponse,
		StocksQuotesParams & MarketDataParams
	>;
}
