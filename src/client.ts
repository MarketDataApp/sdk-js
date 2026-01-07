import { StocksResource } from "@/resources/stocks/index";
import { loadSettings, type MarketDataSettings } from "@/settings";
import type { MarketDataConfig } from "@/types";

export class MarketDataClient {
	public settings: MarketDataSettings;

	public get token(): string | undefined {
		return this.settings.marketdataToken;
	}
	public get baseUrl(): string {
		return this.settings.marketdataBaseUrl;
	}
	public get apiVersion(): string {
		return this.settings.marketdataApiVersion;
	}

	public headers: Record<string, string>;
	public stocks: StocksResource;

	constructor(config: MarketDataConfig = {}) {
		const overrides: Partial<MarketDataSettings> = {
			marketdataToken: config.token,
			marketdataBaseUrl: config.baseUrl,
			marketdataApiVersion: config.apiVersion,
			marketdataMaxRetries: config.maxRetries,
			marketdataRetryInitialWait: config.retryInitialWait,
			marketdataRetryFactor: config.retryFactor,
			marketdataRetryMaxWait: config.retryMaxWait,
		};

		Object.keys(overrides).forEach((key) => {
			if (overrides[key as keyof MarketDataSettings] === undefined) {
				delete overrides[key as keyof MarketDataSettings];
			}
		});

		this.settings = loadSettings(overrides);

		this.headers = {
			Accept: "application/json",
			"User-Agent": "marketdata-js-0.0.1",
		};

		if (this.token) {
			this.headers.Authorization = `Bearer ${this.token}`;
		}

		this.stocks = new StocksResource(this);
	}
}
