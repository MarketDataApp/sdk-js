import { saveBlobToFile } from "@/fileUtils";
import { Endpoints, Service } from "@/internalSettings";
import { isNoData } from "@/resources/base";
import {
	type ApiStatusResponse,
	ApiStatusSchema,
} from "@/resources/utilities/outputs";
import { MarketDataPromise } from "@/utils";
import type { UtilitiesResource } from "./index";

export function status(
	this: UtilitiesResource,
): MarketDataPromise<ApiStatusResponse | null> {
	this.logger.debug("Fetching /status/...");
	const result = this._makeRequest<ApiStatusResponse | null>(
		Endpoints.API_STATUS,
		undefined,
		{
			includeApiVersion: false,
			schema: ApiStatusSchema,
			service: Service.STATUS,
			skipRateLimitCheck: true,
		},
	);
	return MarketDataPromise.fromResult(result, saveBlobToFile, {
		isNoData,
		emptyValue: null,
	});
}
