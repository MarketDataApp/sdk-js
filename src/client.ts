import pRetry, { AbortError } from "p-retry";
import type { z } from "zod";
import { APIStatusResult, globalApiStatus } from "@/apiStatus";
import { RateLimitError, RequestError } from "@/error";
import { isRetriableStatusCode } from "@/internalSettings";
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

import { formatValue } from "@/utils";

import pkg from "../package.json";

export class MarketDataClient implements IMarketDataClient {
	public readonly settings: MarketDataSettings;
	public readonly logger: Logger;
	public rateLimits?: UserRateLimits;
	public readonly stocks: StocksResource;
	public readonly markets: MarketsResource;
	public readonly headers: Record<string, string>;

	private _rateLimitSetup?: Promise<void>;

	constructor(config: MarketDataConfig = {}) {
		this.settings = loadSettings({
			marketdataToken: config.token,
			marketdataBaseUrl: config.baseUrl,
			marketdataApiVersion: config.apiVersion,
			marketdataMaxRetries: config.maxRetries,
			marketdataRetryInitialWait: config.retryInitialWait,
			marketdataRetryFactor: config.retryFactor,
			marketdataRetryMaxWait: config.retryMaxWait,
		});
		this.logger =
			config.logger ||
			new DefaultLogger(config.debug ? LogLevel.DEBUG : LogLevel.INFO);

		this.headers = {
			Accept: "application/json",
			"User-Agent": `marketdata-js-${pkg.version}`,
		};

		if (this.token) {
			this.headers.Authorization = `Bearer ${this.token}`;
		} else {
			this.logger.warn("No token provided, starting in demo mode");
		}

		this.stocks = new StocksResource(this);
		this.markets = new MarketsResource(this);
	}

	public get apiVersion(): string {
		return this.settings.marketdataApiVersion;
	}

	public get baseUrl(): string {
		return this.settings.marketdataBaseUrl;
	}

	public dispose(): void {
		this.rateLimits = undefined;
		this._rateLimitSetup = undefined;
	}

	public get token(): string | undefined {
		return this.settings.marketdataToken;
	}

	public async _makeRequest<T>(
		path: string,
		params: MarketDataParams = {},
		options: {
			headers?: Record<string, string>;
			schema?: z.ZodType<T>;
			service?: string;
			includeApiVersion?: boolean;
			skipRateLimitCheck?: boolean;
			skipRetry?: boolean;
			signal?: AbortSignal;
		} = {},
	): Promise<T> {
		const includeApiVersion = options.includeApiVersion ?? true;
		const url = this._buildUrl(path, params, includeApiVersion);
		const headers = { ...this.headers, ...options.headers };

		this.logger.debug(`Making request to: ${url.toString()}`);

		return this._executeWithRetry<T>(
			url,
			headers,
			options.schema,
			options.service,
			{
				skipRateLimitCheck: options.skipRateLimitCheck,
				skipRetry: options.skipRetry,
				signal: options.signal,
			},
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

		for (const [key, value] of Object.entries(params)) {
			const formatted = formatValue(value);
			if (formatted !== undefined) {
				searchParams.append(key, formatted);
			}
		}

		url.search = searchParams.toString();
		return url;
	}

	private _checkRateLimits(): void {
		if (this.rateLimits && this.rateLimits.requestsRemaining <= 0) {
			throw new RateLimitError("Rate limit exceeded");
		}
	}

	private async _checkServiceStatus(
		service: string,
		error: Error,
	): Promise<void> {
		const status = await globalApiStatus.getApiStatus(this, service);
		if (status === APIStatusResult.OFFLINE) {
			this.logger.error(`Service ${service} is OFFLINE. Aborting retries.`);
			throw new AbortError(error);
		}
	}

	private async _executeWithRetry<T>(
		url: URL,
		headers: Record<string, string>,
		schema?: z.ZodType<T>,
		service?: string,
		options: {
			skipRateLimitCheck?: boolean;
			skipRetry?: boolean;
			signal?: AbortSignal;
		} = {},
	): Promise<T> {
		return await pRetry(
			async () => {
				if (this.token && !this.rateLimits && !options.skipRateLimitCheck) {
					await this._setupRateLimits();
				}

				if (!options.skipRateLimitCheck) {
					this._checkRateLimits();
				}

				const response = await fetch(url.toString(), {
					headers,
					method: "GET",
					signal: options.signal,
				});

				this._updateRateLimits(response.headers);

				if (!response.ok) {
					await this._handleResponseError(response, service);
				}

				const json = await response.json();
				this.logger.debug(
					`Response JSON: ${JSON.stringify(json).substring(0, 200)}`,
				);
				return schema ? schema.parse(json) : (json as T);
			},
			{
				retries: options.skipRetry ? 0 : this.settings.marketdataMaxRetries,
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

	private async _handleResponseError(
		response: Response,
		service?: string,
	): Promise<never> {
		const text = await response.text();
		let errmsg = text;

		try {
			const data = JSON.parse(text);
			errmsg = data.errmsg || text;
		} catch (error) {
			this.logger.debug(
				`Failed to parse error response: ${error instanceof Error ? error.message : String(error)}`,
			);
		}

		if (response.status === 429) {
			throw new RateLimitError(`Rate limit exceeded: ${errmsg}`);
		}

		const requestError = new RequestError(
			`Request failed (${response.status}): ${errmsg}`,
		);

		if (isRetriableStatusCode(response.status) && service) {
			await this._checkServiceStatus(service, requestError);
			throw requestError;
		}

		throw new AbortError(requestError);
	}

	private async _setupRateLimits(): Promise<void> {
		if (this._rateLimitSetup) return this._rateLimitSetup;

		this._rateLimitSetup = (async () => {
			try {
				await this._makeRequest("user/", undefined, {
					includeApiVersion: false,
					skipRateLimitCheck: true,
				});
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				this.logger.error(`Failed to setup rate limits: ${errorMessage}`);
			} finally {
				this._rateLimitSetup = undefined;
			}
		})();

		return this._rateLimitSetup;
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
