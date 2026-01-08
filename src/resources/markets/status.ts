import { Endpoints, Service } from "@/internalSettings";
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
import type { MarketsResource } from "./index";

export function status<P extends MarketStatusParams & MarketDataParams>(
	this: MarketsResource,
	params: P = {} as P,
): TypedResult<MarketStatusResponse, MarketStatusHumanResponse, P> {
	return this._fetch(Endpoints.MARKETS_STATUS, params, {
		inputSchema: MarketStatusParamsSchema,
		regularSchema: MarketStatusSchema,
		humanSchema: MarketStatusHumanSchema,
		service: Service.STATUS,
	});
}
