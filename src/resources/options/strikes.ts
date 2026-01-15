import { Endpoints, Service } from "@/internalSettings";
import {
	type OptionsStrikesHumanResponse,
	OptionsStrikesHumanSchema,
	type OptionsStrikesResponse,
	OptionsStrikesSchema,
} from "@/resources/options/outputs";
import type { OptionsStrikesParams } from "@/resources/options/types";

import type { MarketDataParams, TypedResult } from "@/types";
import { normalizeArgs } from "@/utils";
import type { OptionsResource } from "./index";

export function strikes<
	P extends Omit<OptionsStrikesParams, "symbol"> & MarketDataParams,
>(
	this: OptionsResource,
	symbol: string,
	params?: P,
): TypedResult<
	OptionsStrikesResponse,
	OptionsStrikesHumanResponse,
	P & { symbol: string }
>;
export function strikes<P extends OptionsStrikesParams & MarketDataParams>(
	this: OptionsResource,
	params: P,
): TypedResult<OptionsStrikesResponse, OptionsStrikesHumanResponse, P>;
export function strikes(
	this: OptionsResource,
	arg1: string | (OptionsStrikesParams & MarketDataParams),
	arg2: MarketDataParams = {},
): TypedResult<
	OptionsStrikesResponse,
	OptionsStrikesHumanResponse,
	OptionsStrikesParams & MarketDataParams
> {
	const params = normalizeArgs(arg1, arg2, "symbol") as OptionsStrikesParams &
		MarketDataParams;

	return this._makeRequest<
		OptionsStrikesResponse | OptionsStrikesHumanResponse
	>(`${Endpoints.OPTIONS_STRIKES}${params.symbol}/`, params, {
		schema: this._getSchema(
			params,
			OptionsStrikesSchema,
			OptionsStrikesHumanSchema,
		),
		service: Service.OPTIONS_STRIKES,
	}) as TypedResult<
		OptionsStrikesResponse,
		OptionsStrikesHumanResponse,
		OptionsStrikesParams & MarketDataParams
	>;
}
