import { saveBlobToFile } from "@/fileUtils";
import { Endpoints } from "@/internalSettings";
import { isNoData } from "@/resources/base";
import {
	type HeadersResponse,
	HeadersSchema,
} from "@/resources/utilities/outputs";
import { MarketDataPromise } from "@/utils";
import type { UtilitiesResource } from "./index";

const EMPTY_HEADERS: HeadersResponse = {};

export function headers(
	this: UtilitiesResource,
): MarketDataPromise<HeadersResponse> {
	this.logger.debug("Fetching /headers/...");
	// Bypass BaseResource._makeRequest — its processParams step injects
	// `format=json` etc., and /headers/ rejects any query string with 404.
	const result = this.client._makeRequest<HeadersResponse>(
		Endpoints.HEADERS,
		undefined,
		{
			includeApiVersion: false,
			schema: HeadersSchema,
			skipRateLimitCheck: true,
		},
	);
	return MarketDataPromise.fromResult(result, saveBlobToFile, {
		isNoData,
		emptyValue: EMPTY_HEADERS,
	});
}
