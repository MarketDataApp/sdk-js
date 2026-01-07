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
import type { MarketDataParams, TypedResult } from "@/types";
export class MarketsResource extends BaseResource {
	public async status<P extends MarketStatusParams & MarketDataParams>(
		params: P = {} as P,
	): TypedResult<MarketStatusResponse, MarketStatusHumanResponse, P> {
		return this._fetch("markets/status/", params, {
			inputSchema: MarketStatusParamsSchema,
			regularSchema: MarketStatusSchema,
			humanSchema: MarketStatusHumanSchema,
			service: "markets/status/",
		}) as TypedResult<MarketStatusResponse, MarketStatusHumanResponse, P>;
	}
}
