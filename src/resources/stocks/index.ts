import { BaseResource } from "@/resources/base";
import { candles } from "./candles";
import { earnings } from "./earnings";
import { prices } from "./prices";

export class StocksResource extends BaseResource {
	public candles = candles.bind(this);
	public earnings = earnings.bind(this);
	public prices = prices.bind(this);
}
