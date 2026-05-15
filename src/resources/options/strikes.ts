import { saveBlobToFile } from "@/fileUtils";
import { Endpoints, Service } from "@/internalSettings";
import { isNoData } from "@/resources/base";
import {
	type OptionsStrikesHumanResponse,
	OptionsStrikesHumanSchema,
	type OptionsStrikesResponse,
	OptionsStrikesSchema,
} from "@/resources/options/outputs";
import type { OptionsStrikesParams } from "@/resources/options/types";
import type { MarketDataParams, TypedPromise } from "@/types";
import { MarketDataPromise, normalizeArgs } from "@/utils";
import type { OptionsResource } from "./index";

export function strikes<
	P extends Omit<OptionsStrikesParams, "symbol"> & MarketDataParams,
>(
	this: OptionsResource,
	symbol: string,
	params?: P,
): TypedPromise<
	OptionsStrikesResponse | null,
	OptionsStrikesHumanResponse | null,
	P & { symbol: string }
>;
export function strikes<P extends OptionsStrikesParams & MarketDataParams>(
	this: OptionsResource,
	params: P,
): TypedPromise<
	OptionsStrikesResponse | null,
	OptionsStrikesHumanResponse | null,
	P
>;
export function strikes(
	this: OptionsResource,
	arg1: string | (OptionsStrikesParams & MarketDataParams),
	arg2: MarketDataParams = {},
): TypedPromise<
	OptionsStrikesResponse | null,
	OptionsStrikesHumanResponse | null,
	OptionsStrikesParams & MarketDataParams
> {
	const params = normalizeArgs(arg1, arg2, "symbol") as OptionsStrikesParams &
		MarketDataParams;

	this.logger.debug("Fetching options strikes...");

	return MarketDataPromise.fromResult(
		this._makeRequest<
			OptionsStrikesResponse | OptionsStrikesHumanResponse | null
		>(`${Endpoints.OPTIONS_STRIKES}${params.symbol}/`, params, {
			schema: this._getSchema(
				params,
				OptionsStrikesSchema,
				OptionsStrikesHumanSchema,
			),
			service: Service.OPTIONS_STRIKES,
		}),
		saveBlobToFile,
		{ isNoData, emptyValue: null },
	) as TypedPromise<
		OptionsStrikesResponse | null,
		OptionsStrikesHumanResponse | null,
		OptionsStrikesParams & MarketDataParams
	>;
}
