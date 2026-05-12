import { saveBlobToFile } from "@/fileUtils";
import { Endpoints, Service } from "@/internalSettings";
import { type UserResponse, UserSchema } from "@/resources/utilities/outputs";
import { MarketDataPromise } from "@/utils";
import type { UtilitiesResource } from "./index";

export function user(this: UtilitiesResource): MarketDataPromise<UserResponse> {
	this.logger.debug("Fetching /user/...");
	const result = this._makeRequest<UserResponse>(Endpoints.USER, undefined, {
		includeApiVersion: false,
		schema: UserSchema,
		service: Service.USER,
		skipRateLimitCheck: true,
	});
	return MarketDataPromise.fromResult(result, saveBlobToFile);
}
