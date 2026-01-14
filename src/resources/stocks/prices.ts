import { Endpoints, Service } from "@/internalSettings";
import {
	type StockPriceHumanResponse,
	StockPriceHumanSchema,
	type StockPriceResponse,
	StockPriceSchema,
} from "@/resources/stocks/outputs";

import type { StocksPricesParams } from "@/resources/stocks/types";
import { StocksPricesParamsSchema } from "@/resources/stocks/types";
import type { MarketDataParams, TypedResult } from "@/types";

import { normalizeArgs } from "@/utils";
import type { StocksResource } from "./index";

export function prices<
	P extends Omit<StocksPricesParams, "symbols"> & MarketDataParams,
>(
	this: StocksResource,
	symbols: string | string[],
	params?: P,
): TypedResult<
	StockPriceResponse,
	StockPriceHumanResponse,
	P & { symbols: string | string[] }
>;

export function prices<P extends StocksPricesParams & MarketDataParams>(
	this: StocksResource,
	params: P,
): TypedResult<StockPriceResponse, StockPriceHumanResponse, P>;

export function prices(
	this: StocksResource,
	arg1: string | string[] | (StocksPricesParams & MarketDataParams),
	arg2: MarketDataParams = {},
): TypedResult<
	StockPriceResponse,
	StockPriceHumanResponse,
	StocksPricesParams & MarketDataParams
> {
	const params = normalizeArgs(arg1, arg2, "symbols") as StocksPricesParams &
		MarketDataParams;

	return this._fetch(Endpoints.STOCKS_PRICES, params, {
		inputSchema: StocksPricesParamsSchema,
		regularSchema: StockPriceSchema,
		humanSchema: StockPriceHumanSchema,
		service: Service.PRICES,
	}) as TypedResult<
		StockPriceResponse,
		StockPriceHumanResponse,
		StocksPricesParams & MarketDataParams
	>;
}
