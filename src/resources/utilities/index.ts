import { BaseResource } from "@/resources/base";
import { headers } from "./headers";
import { status } from "./status";
import { user } from "./user";

export class UtilitiesResource extends BaseResource {
	public headers = headers.bind(this);
	public status = status.bind(this);
	public user = user.bind(this);
}
