import { Endpoints, Service } from "@/internalSettings";
import {
	type OptionsExpirationsHumanResponse,
	OptionsExpirationsHumanSchema,
	type OptionsExpirationsResponse,
	OptionsExpirationsSchema,
} from "@/resources/options/outputs";
import type { OptionsExpirationsParams } from "@/resources/options/types";

import type { MarketDataParams, TypedResult } from "@/types";
import { normalizeArgs } from "@/utils";
import type { OptionsResource } from "./index";

export function expirations<
	P extends Omit<OptionsExpirationsParams, "symbol"> & MarketDataParams,
>(
	this: OptionsResource,
	symbol: string,
	params?: P,
): TypedResult<
	OptionsExpirationsResponse,
	OptionsExpirationsHumanResponse,
	P & { symbol: string }
>;

export function expirations<
	P extends OptionsExpirationsParams & MarketDataParams,
>(
	this: OptionsResource,
	params: P,
): TypedResult<OptionsExpirationsResponse, OptionsExpirationsHumanResponse, P>;

export function expirations(
	this: OptionsResource,
	arg1: string | (OptionsExpirationsParams & MarketDataParams),
	arg2: MarketDataParams = {},
): TypedResult<
	OptionsExpirationsResponse,
	OptionsExpirationsHumanResponse,
	OptionsExpirationsParams & MarketDataParams
> {
	const params = normalizeArgs(
		arg1,
		arg2,
		"symbol",
	) as OptionsExpirationsParams & MarketDataParams;

	this.logger.debug("Fetching options expirations...");

	return this._makeRequest<
		OptionsExpirationsResponse | OptionsExpirationsHumanResponse
	>(`${Endpoints.OPTIONS_EXPIRATIONS}${params.symbol}/`, params, {
		schema: this._getSchema(
			params,
			OptionsExpirationsSchema,
			OptionsExpirationsHumanSchema,
		),
		service: Service.OPTIONS_EXPIRATIONS,
	}) as TypedResult<
		OptionsExpirationsResponse,
		OptionsExpirationsHumanResponse,
		OptionsExpirationsParams & MarketDataParams
	>;
}
