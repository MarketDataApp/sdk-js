import { BaseResource } from "@/resources/base";
import { candles } from "./candles";
import { earnings } from "./earnings";
import { news } from "./news";
import { prices } from "./prices";
import { quotes } from "./quotes";

export class StocksResource extends BaseResource {
	public candles = candles.bind(this);
	public earnings = earnings.bind(this);
	public news = news.bind(this);
	public prices = prices.bind(this);
	public quotes = quotes.bind(this);
}
