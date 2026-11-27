import { BaseResource } from "@/resources/base";
import { deleteToken } from "./deleteToken";
import { headers } from "./headers";
import { status } from "./status";

export class UtilitiesResource extends BaseResource {
	public deleteToken = deleteToken.bind(this);
	public headers = headers.bind(this);
	public status = status.bind(this);
}
