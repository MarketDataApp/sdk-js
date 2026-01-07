import { BaseResource } from "@/resources/base";
import {
	type StockPriceHumanResponse,
	StockPriceHumanSchema,
	type StockPriceResponse,
	StockPriceSchema,
} from "@/resources/stocks/outputs";
import {
	type StocksPricesParams,
	StocksPricesParamsSchema,
} from "@/resources/stocks/types";
import type { MarketDataParams, TypedResult } from "@/types";
export class StocksResource extends BaseResource {
	public async prices<P extends StocksPricesParams & MarketDataParams>(
		params: P,
	): TypedResult<StockPriceResponse, StockPriceHumanResponse, P> {
		return this._fetch("stocks/prices/", params, {
			inputSchema: StocksPricesParamsSchema,
			regularSchema: StockPriceSchema,
			humanSchema: StockPriceHumanSchema,
			service: "stocks/prices/",
		}) as TypedResult<StockPriceResponse, StockPriceHumanResponse, P>;
	}
}
