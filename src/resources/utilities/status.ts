import { saveBlobToFile } from "@/fileUtils";
import { Endpoints, Service } from "@/internalSettings";
import {
	type ApiStatusResponse,
	ApiStatusSchema,
} from "@/resources/utilities/outputs";
import { MarketDataPromise } from "@/utils";
import type { UtilitiesResource } from "./index";

export function status(
	this: UtilitiesResource,
): MarketDataPromise<ApiStatusResponse> {
	this.logger.debug("Fetching /status/...");
	const result = this._makeRequest<ApiStatusResponse>(
		Endpoints.API_STATUS,
		undefined,
		{
			includeApiVersion: false,
			schema: ApiStatusSchema,
			service: Service.STATUS,
			skipRateLimitCheck: true,
		},
	);
	return MarketDataPromise.fromResult(result, saveBlobToFile);
}
