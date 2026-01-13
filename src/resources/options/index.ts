import { BaseResource } from "@/resources/base";
import { chain } from "./chain";
import { expirations } from "./expirations";
import { lookup } from "./lookup";

export class OptionsResource extends BaseResource {
	public chain = chain.bind(this);
	public expirations = expirations.bind(this);
	public lookup = lookup.bind(this);
}
