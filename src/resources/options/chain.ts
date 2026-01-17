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
import type { MarketDataParams, TypedResult } from "@/types";
import { normalizeArgs } from "@/utils";
import type { OptionsResource } from "./index";

export function chain<
	P extends Omit<OptionsChainParams, "symbol"> & MarketDataParams,
>(
	this: OptionsResource,
	symbol: string,
	params?: P,
): TypedResult<
	OptionsChainResponse,
	OptionsChainHumanResponse,
	P & { symbol: string }
>;
export function chain<P extends OptionsChainParams & MarketDataParams>(
	this: OptionsResource,
	params: P,
): TypedResult<OptionsChainResponse, OptionsChainHumanResponse, P>;
export function chain(
	this: OptionsResource,
	arg1: string | (OptionsChainParams & MarketDataParams),
	arg2: MarketDataParams = {},
): TypedResult<
	OptionsChainResponse,
	OptionsChainHumanResponse,
	OptionsChainParams & MarketDataParams
> {
	const params = normalizeArgs(arg1, arg2, "symbol") as OptionsChainParams &
		MarketDataParams;

	return this._fetch(`${Endpoints.OPTIONS_CHAIN}${params.symbol}/`, params, {
		inputSchema: OptionsChainParamsSchema,
		regularSchema: OptionsChainSchema,
		humanSchema: OptionsChainHumanSchema,
		service: Service.OPTIONS_CHAIN,
		excludeKeys: ["s"],
	}) as TypedResult<
		OptionsChainResponse,
		OptionsChainHumanResponse,
		OptionsChainParams & MarketDataParams
	>;
}
