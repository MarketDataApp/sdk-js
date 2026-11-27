import { saveBlobToFile } from "@/fileUtils";
import { Endpoints, Service } from "@/internalSettings";
import {
	type DeleteTokenResponse,
	DeleteTokenSchema,
} from "@/resources/utilities/outputs";
import { MarketDataPromise } from "@/utils";
import type { UtilitiesResource } from "./index";

/**
 * Revokes the caller's own API token. `DELETE /v1/user/token/` takes no
 * parameters; it always acts on the token the client authenticates with.
 * A 404 here means the token was already gone, not "no data" — like the
 * `/user/` startup probe, it opts into `throwOn404` so it surfaces as a
 * `NotFoundError` instead of resolving as if the revocation had happened.
 */
export function deleteToken(
	this: UtilitiesResource,
): MarketDataPromise<DeleteTokenResponse> {
	this.logger.debug("Deleting user token...");
	const result = this.client._makeRequest<DeleteTokenResponse>(
		Endpoints.USER_TOKEN,
		undefined,
		{
			method: "DELETE",
			schema: DeleteTokenSchema,
			service: Service.USER_TOKEN,
			throwOn404: true,
		},
	);
	return MarketDataPromise.fromResult(result, saveBlobToFile);
}
