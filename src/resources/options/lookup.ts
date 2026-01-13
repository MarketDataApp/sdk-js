import { errAsync } from "neverthrow";
import type { BaseResource } from "@/resources/base";
import type {
	OptionsLookup,
	OptionsLookupHumanReadable,
} from "@/resources/options/outputs";
import {
	type OptionsLookupParams,
	OptionsLookupParamsSchema,
} from "@/resources/options/types";
import { type MarketDataResult, UserUniversalAPIParamsSchema } from "@/types";
import { cleanAndValidateParams } from "@/utils";

export function lookup(
	this: BaseResource,
	lookupStr: string,
	params: OptionsLookupParams = { lookup: lookupStr },
): MarketDataResult<OptionsLookup | OptionsLookupHumanReadable> {
	const result = cleanAndValidateParams(
		{ ...params, lookup: lookupStr },
		OptionsLookupParamsSchema,
		UserUniversalAPIParamsSchema,
	);

	if (result.isErr()) {
		return errAsync(result.error);
	}

	const encodedLookup = encodeURIComponent(result.value.lookup);

	return this.client._makeRequest(
		`options/lookup/${encodedLookup}/`,
		result.value,
	);
}
