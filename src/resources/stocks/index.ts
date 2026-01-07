import type { MarketDataClientErrorResult } from "@/error";
import { BaseResource } from "@/resources/base";
import type { StockPriceResponse } from "@/resources/stocks/outputs";
import {
	type StocksPricesParams,
	StocksPricesParamsSchema,
} from "@/resources/stocks/types";
import { getDataRecords, type stockRequestResult } from "@/utils";

export class StocksResource extends BaseResource {
	public async prices(
		params: StocksPricesParams,
	): Promise<
		stockRequestResult<StockPriceResponse> | MarketDataClientErrorResult
	> {
		return this._run(async () => {
			const validated = this.validateParams(StocksPricesParamsSchema, params);
			const response = await this._makeRequest<StockPriceResponse>(
				"stocks/prices/",
				validated,
			);
			return getDataRecords(response);
		});
	}
}
