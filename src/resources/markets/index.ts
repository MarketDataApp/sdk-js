import type { MarketDataClientErrorResult } from "@/error";
import { BaseResource } from "@/resources/base";
import {
	type MarketStatusHumanResponse,
	MarketStatusHumanSchema,
	type MarketStatusResponse,
	MarketStatusSchema,
} from "@/resources/markets/outputs";
import {
	type MarketStatusParams,
	MarketStatusParamsSchema,
} from "@/resources/markets/types";
import { getDataRecords, type stockRequestResult } from "@/utils";

export class MarketsResource extends BaseResource {
	public async status(
		params: MarketStatusParams = {},
	): Promise<
		| stockRequestResult<MarketStatusResponse | MarketStatusHumanResponse>
		| MarketDataClientErrorResult
	> {
		return this._run(async () => {
			const validated = this.validateParams(MarketStatusParamsSchema, params);
			const useHuman =
				(params as any).useHumanReadable ??
				this.client.settings.marketdataUseHumanReadable;
			const schema = useHuman ? MarketStatusHumanSchema : MarketStatusSchema;

			const response = await this._makeRequest<
				MarketStatusResponse | MarketStatusHumanResponse
			>("markets/status/", validated, { schema, service: "markets/status/" });
			return getDataRecords(response, ["s"]);
		});
	}
}
