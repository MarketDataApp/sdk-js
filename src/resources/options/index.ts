import { BaseResource } from "@/resources/base";
import { chain } from "./chain";

export class OptionsResource extends BaseResource {
	public chain = chain.bind(this);
}
