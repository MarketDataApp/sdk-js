import type { MarketDataClientErrorResult } from "../../error";
import { BaseResource } from "../base";
import type { StockPriceResponse } from "./outputs";
import { type StocksPricesParams, StocksPricesParamsSchema } from "./types";

export class StocksResource extends BaseResource {
	public async prices(
		params: StocksPricesParams,
	): Promise<StockPriceResponse | MarketDataClientErrorResult> {
		return this._run(async () => {
			const validated = this.validateParams(StocksPricesParamsSchema, params);
			return await this._makeRequest<StockPriceResponse>(
				"stocks/prices/",
				validated,
			);
		});
	}
}
