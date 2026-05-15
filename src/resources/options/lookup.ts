import { saveBlobToFile } from "@/fileUtils";
import { Endpoints, Service } from "@/internalSettings";
import { isNoData } from "@/resources/base";
import {
	type OptionsLookupHumanResponse,
	OptionsLookupHumanSchema,
	type OptionsLookupResponse,
	OptionsLookupSchema,
} from "@/resources/options/outputs";
import type { OptionsLookupParams } from "@/resources/options/types";
import type { MarketDataParams, TypedPromise } from "@/types";
import { MarketDataPromise, normalizeArgs } from "@/utils";
import type { OptionsResource } from "./index";

export function lookup<
	P extends Omit<OptionsLookupParams, "lookup"> & MarketDataParams,
>(
	this: OptionsResource,
	lookupStr: string,
	params?: P,
): TypedPromise<
	OptionsLookupResponse | null,
	OptionsLookupHumanResponse | null,
	P & { lookup: string }
>;

export function lookup<P extends OptionsLookupParams & MarketDataParams>(
	this: OptionsResource,
	params: P,
): TypedPromise<
	OptionsLookupResponse | null,
	OptionsLookupHumanResponse | null,
	P
>;

export function lookup(
	this: OptionsResource,
	arg1: string | (OptionsLookupParams & MarketDataParams),
	arg2: MarketDataParams = {},
): TypedPromise<
	OptionsLookupResponse | null,
	OptionsLookupHumanResponse | null,
	OptionsLookupParams & MarketDataParams
> {
	const params = normalizeArgs(arg1, arg2, "lookup") as OptionsLookupParams &
		MarketDataParams;

	const encodedLookup = encodeURIComponent(params.lookup);

	this.logger.debug("Fetching options lookup...");

	return MarketDataPromise.fromResult(
		this._makeRequest<
			OptionsLookupResponse | OptionsLookupHumanResponse | null
		>(`${Endpoints.OPTIONS_LOOKUP}${encodedLookup}/`, params, {
			schema: this._getSchema(
				params,
				OptionsLookupSchema,
				OptionsLookupHumanSchema,
			),
			service: Service.OPTIONS_LOOKUP,
		}),
		saveBlobToFile,
		{ isNoData, emptyValue: null },
	) as TypedPromise<
		OptionsLookupResponse | null,
		OptionsLookupHumanResponse | null,
		OptionsLookupParams & MarketDataParams
	>;
}
