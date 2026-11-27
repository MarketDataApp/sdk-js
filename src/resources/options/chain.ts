import { Endpoints, Service } from "@/internalSettings";
import {
	type OptionsChainHumanResponse,
	OptionsChainHumanSchema,
	type OptionsChainResponse,
	OptionsChainSchema,
} from "@/resources/options/outputs";

import {
	type OptionsChainParams,
	OptionsChainParamsSchema,
} from "@/resources/options/types";
import type { MarketDataParams, TypedPromise } from "@/types";
import { normalizeArgs } from "@/utils";
import type { OptionsResource } from "./index";

/**
 * `dte` accepts a number or a string: a single value, a comma-separated
 * list (`"15,30,45"`), a closed range (`"0-45"`), or a comparison operator
 * (`">=30"`, `"<45"`). See docs/options/chain.md for the full contract.
 */
export function chain<
	P extends Omit<OptionsChainParams, "symbol"> & MarketDataParams,
>(
	this: OptionsResource,
	symbol: string,
	params?: P,
): TypedPromise<
	OptionsChainResponse,
	OptionsChainHumanResponse,
	P & { symbol: string }
>;
export function chain<P extends OptionsChainParams & MarketDataParams>(
	this: OptionsResource,
	params: P,
): TypedPromise<OptionsChainResponse, OptionsChainHumanResponse, P>;
export function chain(
	this: OptionsResource,
	arg1: string | (OptionsChainParams & MarketDataParams),
	arg2: MarketDataParams = {},
): TypedPromise<
	OptionsChainResponse,
	OptionsChainHumanResponse,
	OptionsChainParams & MarketDataParams
> {
	const params = normalizeArgs(arg1, arg2, "symbol") as OptionsChainParams &
		MarketDataParams;

	const { symbol, ...queryParams } = params;

	this.logger.debug("Fetching options chain...");

	return this._fetch(
		`${Endpoints.OPTIONS_CHAIN}${symbol}/`,
		queryParams as MarketDataParams,
		{
			inputSchema: OptionsChainParamsSchema,
			regularSchema: OptionsChainSchema,
			humanSchema: OptionsChainHumanSchema,
			service: Service.OPTIONS_CHAIN,
			excludeKeys: ["s"],
		},
	) as TypedPromise<
		OptionsChainResponse,
		OptionsChainHumanResponse,
		OptionsChainParams & MarketDataParams
	>;
}
