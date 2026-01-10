import { BaseResource } from "@/resources/base";
import { candles } from "./candles";

export class FundsResource extends BaseResource {
	public candles = candles.bind(this);
}
