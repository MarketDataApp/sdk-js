import { errAsync } from "neverthrow";
import type { BaseResource } from "@/resources/base";
import type {
	OptionsExpirations,
	OptionsExpirationsHumanReadable,
} from "@/resources/options/outputs";
import {
	type OptionsExpirationsParams,
	OptionsExpirationsParamsSchema,
} from "@/resources/options/types";
import { type MarketDataResult, UserUniversalAPIParamsSchema } from "@/types";
import { cleanAndValidateParams } from "@/utils";

export function expirations(
	this: BaseResource,
	symbol: string,
	params: OptionsExpirationsParams = {},
): MarketDataResult<OptionsExpirations | OptionsExpirationsHumanReadable> {
	const result = cleanAndValidateParams(
		{ ...params, symbol },
		OptionsExpirationsParamsSchema,
		UserUniversalAPIParamsSchema,
	);

	if (result.isErr()) {
		return errAsync(result.error);
	}

	return this.client._makeRequest(
		`options/expirations/${symbol}/`,
		result.value,
	);
}
