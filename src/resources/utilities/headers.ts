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
	const result = this._makeRequest<HeadersResponse>(
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
