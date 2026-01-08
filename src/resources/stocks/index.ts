import { BaseResource } from "@/resources/base";
import { candles } from "./candles";
import { prices } from "./prices";

export class StocksResource extends BaseResource {
	public prices = prices.bind(this);
	public candles = candles.bind(this);
}
