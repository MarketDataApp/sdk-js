import type { MarketDataClientErrorResult } from "@/error";
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
import { getDataRecords, type stockRequestResult } from "@/utils";

export class StocksResource extends BaseResource {
	public async prices(
		params: StocksPricesParams,
	): Promise<
		| stockRequestResult<StockPriceResponse | StockPriceHumanResponse>
		| MarketDataClientErrorResult
	> {
		return this._run(async () => {
			const validated = this.validateParams(StocksPricesParamsSchema, params);
			const useHuman =
				(params as any).useHumanReadable ??
				this.client.settings.marketdataUseHumanReadable;
			const schema = useHuman ? StockPriceHumanSchema : StockPriceSchema;

			const response = await this._makeRequest<
				StockPriceResponse | StockPriceHumanResponse
			>("stocks/prices/", validated, { schema, service: "stocks/prices/" });
			return getDataRecords(response, ["s"]);
		});
	}
}
