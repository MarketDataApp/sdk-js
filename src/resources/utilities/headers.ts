import { saveBlobToFile } from "@/fileUtils";
import { Endpoints } from "@/internalSettings";
import { isNoData } from "@/resources/base";
import {
	type HeadersResponse,
	HeadersSchema,
} from "@/resources/utilities/outputs";
import { MarketDataPromise } from "@/utils";
import type { UtilitiesResource } from "./index";

export function headers(
	this: UtilitiesResource,
): MarketDataPromise<HeadersResponse | null> {
	this.logger.debug("Fetching /headers/...");
	const result = this._makeRequest<HeadersResponse | null>(
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
		emptyValue: null,
	});
}
