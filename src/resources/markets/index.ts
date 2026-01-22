import { BaseResource } from "@/resources/base";
import { status } from "./status";

export class MarketsResource extends BaseResource {
	public status = status.bind(this);
}
