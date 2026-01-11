import { errAsync, okAsync } from "neverthrow";
import { ValidationError } from "@/error";
import { Endpoints, Service } from "@/internalSettings";
import {
	type OptionsChainHumanResponse,
	OptionsChainHumanSchema,
	type OptionsChainResponse,
	OptionsChainSchema,
} from "@/resources/options/outputs";
import type { OptionsChainParams } from "@/resources/options/types";
import type { MarketDataParams, TypedResult } from "@/types";
import { getDataRecords, normalizeArgs } from "@/utils";
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

	const useHuman = params.human || params.useHumanReadable;

	return this._makeRequest<Record<string, unknown>>(
		`${Endpoints.OPTIONS_CHAIN}${params.symbol}/`,
		params,
		{
			service: Service.OPTIONS_CHAIN,
		},
	).andThen((data) => {
		const finalData = useHuman ? transformHumanKeys(data) : data;
		const schema = useHuman ? OptionsChainHumanSchema : OptionsChainSchema;
		const result = schema.safeParse(finalData);

		if (!result.success) {
			return errAsync(new ValidationError(JSON.stringify(result.error.issues)));
		}

		return okAsync(getDataRecords(result.data, ["s"]) as never);
	}) as TypedResult<
		OptionsChainResponse,
		OptionsChainHumanResponse,
		OptionsChainParams & MarketDataParams
	>;
}

function transformHumanKeys(
	data: Record<string, unknown>,
): Record<string, unknown> {
	const transformed: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(data)) {
		transformed[key.replace(/ /g, "_")] = value;
	}
	return transformed;
}
