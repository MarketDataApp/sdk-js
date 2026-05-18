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

// Cast through unknown: zod's catchall + statically-known keys synthesizes an
// intersection (`{s:string;updated:number} & {[x:string]:number[]}`) that no
// literal can satisfy; runtime shape is correct.
const EMPTY_STRIKES = {
	s: "no_data",
	updated: 0,
} as unknown as OptionsStrikesResponse;

// Human schema has no `s` field; just the Date scalar.
const EMPTY_STRIKES_HUMAN = {
	Date: 0,
} as unknown as OptionsStrikesHumanResponse;

export function strikes<
	P extends Omit<OptionsStrikesParams, "symbol"> & MarketDataParams,
>(
	this: OptionsResource,
	symbol: string,
	params?: P,
): TypedPromise<
	OptionsStrikesResponse,
	OptionsStrikesHumanResponse,
	P & { symbol: string }
>;
export function strikes<P extends OptionsStrikesParams & MarketDataParams>(
	this: OptionsResource,
	params: P,
): TypedPromise<OptionsStrikesResponse, OptionsStrikesHumanResponse, P>;
export function strikes(
	this: OptionsResource,
	arg1: string | (OptionsStrikesParams & MarketDataParams),
	arg2: MarketDataParams = {},
): TypedPromise<
	OptionsStrikesResponse,
	OptionsStrikesHumanResponse,
	OptionsStrikesParams & MarketDataParams
> {
	const params = normalizeArgs(arg1, arg2, "symbol") as OptionsStrikesParams &
		MarketDataParams;

	this.logger.debug("Fetching options strikes...");

	const useHuman =
		(params.useHumanReadable as boolean | string | undefined) ??
		(params.human as boolean | string | undefined) ??
		this.client.settings.marketdataUseHumanReadable;
	const isHuman = useHuman === true || useHuman === "true" || useHuman === "1";
	const emptyValue: OptionsStrikesResponse | OptionsStrikesHumanResponse =
		isHuman ? EMPTY_STRIKES_HUMAN : EMPTY_STRIKES;

	return MarketDataPromise.fromResult(
		this._makeRequest<OptionsStrikesResponse | OptionsStrikesHumanResponse>(
			`${Endpoints.OPTIONS_STRIKES}${params.symbol}/`,
			params,
			{
				schema: this._getSchema(
					params,
					OptionsStrikesSchema,
					OptionsStrikesHumanSchema,
				),
				service: Service.OPTIONS_STRIKES,
			},
		),
		saveBlobToFile,
		{ isNoData, emptyValue },
	) as TypedPromise<
		OptionsStrikesResponse,
		OptionsStrikesHumanResponse,
		OptionsStrikesParams & MarketDataParams
	>;
}
