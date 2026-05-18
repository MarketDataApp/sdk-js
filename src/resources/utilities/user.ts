import { saveBlobToFile } from "@/fileUtils";
import { Endpoints, Service } from "@/internalSettings";
import { type UserResponse, UserSchema } from "@/resources/utilities/outputs";
import { MarketDataPromise } from "@/utils";
import type { UtilitiesResource } from "./index";

// `/user/` identifies the bearer of the API token; a 404 here means the token
// authenticated but the account record is gone, which is an integrity error,
// not a "no data" condition. Opt into the throw path so it surfaces as
// NotFoundError instead of being swallowed to an empty response.
export function user(this: UtilitiesResource): MarketDataPromise<UserResponse> {
	this.logger.debug("Fetching /user/...");
	const result = this._makeRequest<UserResponse>(Endpoints.USER, undefined, {
		includeApiVersion: false,
		schema: UserSchema,
		service: Service.USER,
		skipRateLimitCheck: true,
		throwOn404: true,
	});
	return MarketDataPromise.fromResult(result, saveBlobToFile);
}
