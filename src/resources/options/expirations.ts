import { saveBlobToFile } from "@/fileUtils";
import { Endpoints, Service } from "@/internalSettings";
import { isNoData } from "@/resources/base";
import {
	type OptionsExpirationsHumanResponse,
	OptionsExpirationsHumanSchema,
	type OptionsExpirationsResponse,
	OptionsExpirationsSchema,
} from "@/resources/options/outputs";
import type { OptionsExpirationsParams } from "@/resources/options/types";
import type { MarketDataParams, TypedPromise } from "@/types";
import { encodePathSegment, MarketDataPromise, normalizeArgs } from "@/utils";
import type { OptionsResource } from "./index";

const EMPTY_EXPIRATIONS: OptionsExpirationsResponse = {
	s: "no_data",
	expirations: [],
	updated: 0,
};

const EMPTY_EXPIRATIONS_HUMAN: OptionsExpirationsHumanResponse = {
	s: "no_data",
	Expirations: [],
	Date: 0,
};

export function expirations<
	P extends Omit<OptionsExpirationsParams, "symbol"> & MarketDataParams,
>(
	this: OptionsResource,
	symbol: string,
	params?: P,
): TypedPromise<
	OptionsExpirationsResponse,
	OptionsExpirationsHumanResponse,
	P & { symbol: string }
>;

export function expirations<
	P extends OptionsExpirationsParams & MarketDataParams,
>(
	this: OptionsResource,
	params: P,
): TypedPromise<OptionsExpirationsResponse, OptionsExpirationsHumanResponse, P>;

export function expirations(
	this: OptionsResource,
	arg1: string | (OptionsExpirationsParams & MarketDataParams),
	arg2: MarketDataParams = {},
): TypedPromise<
	OptionsExpirationsResponse,
	OptionsExpirationsHumanResponse,
	OptionsExpirationsParams & MarketDataParams
> {
	const params = normalizeArgs(
		arg1,
		arg2,
		"symbol",
	) as OptionsExpirationsParams & MarketDataParams;

	const { symbol, ...queryParams } = params;

	this.logger.debug("Fetching options expirations...");

	const emptyValue:
		| OptionsExpirationsResponse
		| OptionsExpirationsHumanResponse = this._isHumanFormat(params)
		? EMPTY_EXPIRATIONS_HUMAN
		: EMPTY_EXPIRATIONS;

	return MarketDataPromise.fromResult(
		this._makeRequest<
			OptionsExpirationsResponse | OptionsExpirationsHumanResponse
		>(
			`${Endpoints.OPTIONS_EXPIRATIONS}${encodePathSegment(symbol)}/`,
			queryParams as MarketDataParams,
			{
				schema: this._getSchema(
					params,
					OptionsExpirationsSchema,
					OptionsExpirationsHumanSchema,
				),
				service: Service.OPTIONS_EXPIRATIONS,
			},
		),
		saveBlobToFile,
		{ isNoData, emptyValue },
	) as TypedPromise<
		OptionsExpirationsResponse,
		OptionsExpirationsHumanResponse,
		OptionsExpirationsParams & MarketDataParams
	>;
}
