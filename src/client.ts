import pRetry, { AbortError } from "p-retry";
import type { z } from "zod";
import { APIStatusResult, globalApiStatus } from "@/apiStatus";
import { RateLimitError, RequestError } from "@/error";
import { DefaultLogger, type Logger, LogLevel } from "@/logger";
import { MarketsResource } from "@/resources/markets/index";
import { StocksResource } from "@/resources/stocks/index";
import { loadSettings, type MarketDataSettings } from "@/settings";
import type {
	IMarketDataClient,
	MarketDataConfig,
	MarketDataParams,
	UserRateLimits,
} from "@/types";

import pkg from "../package.json";

export class MarketDataClient implements IMarketDataClient {
	public settings: MarketDataSettings;
	public logger: Logger;
	public rateLimits?: UserRateLimits;
	public stocks: StocksResource;
	public markets: MarketsResource;

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
		this.logger =
			config.logger ||
			new DefaultLogger(config.debug ? LogLevel.DEBUG : LogLevel.INFO);

		this.headers = {
			Accept: "application/json",
			"User-Agent": `marketdata-js-${pkg.version}`,
		};

		if (this.token) {
			this.headers.Authorization = `Bearer ${this.token}`;
			this._setupRateLimits();
		}

		this.stocks = new StocksResource(this);
		this.markets = new MarketsResource(this);
	}

	private async _setupRateLimits(): Promise<void> {
		try {
			await this._makeRequest("user/", {}, { includeApiVersion: false });
		} catch (error) {
			this.logger.error(`Failed to setup rate limits: ${error}`);
		}
	}

	public async _makeRequest<T>(
		path: string,
		params: MarketDataParams = {},
		options: {
			headers?: Record<string, string>;
			schema?: z.ZodType<T>;
			service?: string;
			includeApiVersion?: boolean;
		} = {},
	): Promise<T> {
		const includeApiVersion = options.includeApiVersion ?? true;
		const url = this._buildUrl(path, params, includeApiVersion);
		const headers = { ...this.headers, ...options.headers };

		return this._executeWithRetry<T>(
			url,
			headers,
			options.schema,
			options.service,
		);
	}

	private _buildUrl(
		path: string,
		params: MarketDataParams,
		includeApiVersion = true,
	): URL {
		const urlPath = includeApiVersion ? `${this.apiVersion}/${path}` : path;
		const url = new URL(urlPath, this.baseUrl);
		const searchParams = new URLSearchParams();

		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				if (Array.isArray(value)) {
					searchParams.append(
						key,
						value
							.map((v) =>
								v instanceof Date ? v.toISOString().split("T")[0] : String(v),
							)
							.join(","),
					);
				} else if (value instanceof Date) {
					searchParams.append(key, value.toISOString().split("T")[0]);
				} else {
					searchParams.append(key, String(value));
				}
			}
		});

		url.search = searchParams.toString();
		return url;
	}

	private async _executeWithRetry<T>(
		url: URL,
		headers: Record<string, string>,
		schema?: z.ZodType<T>,
		service?: string,
	): Promise<T> {
		return await pRetry(
			async () => {
				this._checkRateLimits();

				const response = await fetch(url.toString(), {
					headers,
					method: "GET",
				});

				this._updateRateLimits(response.headers);

				if (!response.ok) {
					const text = await response.text();
					let errmsg = text;
					try {
						const data = JSON.parse(text);
						errmsg = data.errmsg || text;
					} catch {}

					if (response.status === 429) {
						throw new RateLimitError(`Rate limit exceeded: ${errmsg}`);
					}

					const requestError = new RequestError(
						`Request failed (${response.status}): ${errmsg}`,
					);

					if (response.status >= 500 && service) {
						const status = await globalApiStatus.getApiStatus(this, service);
						if (status === APIStatusResult.OFFLINE) {
							this.logger.error(
								`Service ${service} is OFFLINE. Aborting retries.`,
							);
							throw new AbortError(requestError);
						}
					}

					throw requestError;
				}

				const json = await response.json();
				return schema ? schema.parse(json) : (json as T);
			},
			{
				retries: this.settings.marketdataMaxRetries,
				minTimeout: this.settings.marketdataRetryInitialWait * 1000,
				maxTimeout: this.settings.marketdataRetryMaxWait * 1000,
				factor: this.settings.marketdataRetryFactor,
				onFailedAttempt: (error) => {
					this.logger.warn(
						`Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`,
					);
				},
			},
		);
	}

	private _checkRateLimits(): void {
		if (this.rateLimits && this.rateLimits.requestsRemaining <= 0) {
			throw new RateLimitError("Rate limit exceeded");
		}
	}

	private _updateRateLimits(headers: Headers): void {
		if (headers.has("x-api-ratelimit-remaining")) {
			this.rateLimits = {
				requestsLimit: Number(headers.get("x-api-ratelimit-limit")) || 0,
				requestsRemaining:
					Number(headers.get("x-api-ratelimit-remaining")) || 0,
				requestsReset: Number(headers.get("x-api-ratelimit-reset")) || 0,
				requestsConsumed: Number(headers.get("x-api-ratelimit-consumed")) || 0,
			};
		}
	}
}
