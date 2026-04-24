import { saveBlobToFile } from "@/fileUtils";
import { Endpoints } from "@/internalSettings";
import {
	type HeadersResponse,
	HeadersSchema,
} from "@/resources/utilities/outputs";
import { MarketDataPromise } from "@/utils";
import type { UtilitiesResource } from "./index";

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
	return MarketDataPromise.fromResult(result, saveBlobToFile);
}
