import { BaseResource } from "@/resources/base";
import { headers } from "./headers";
import { status } from "./status";

export class UtilitiesResource extends BaseResource {
	public headers = headers.bind(this);
	public status = status.bind(this);
}
