import { ResultAsync } from "neverthrow";
import pRetry, { AbortError } from "p-retry";
import { z } from "zod";
import { APIStatusResult, globalApiStatus } from "@/apiStatus";
import {
	MarketDataClientError,
	RateLimitError,
	RequestError,
	ValidationError,
} from "@/error";
import { saveBlobToFile } from "@/fileUtils";
import {
	CHECK_RATE_LIMITS,
	Endpoints,
	isRetriableStatusCode,
	Service,
} from "@/internalSettings";
import { DefaultLogger, type Logger, LogLevel } from "@/logger";
import { FundsResource } from "@/resources/funds/index";
import { MarketsResource } from "@/resources/markets/index";
import { OptionsResource } from "@/resources/options/index";
import { StocksResource } from "@/resources/stocks/index";
import { loadSettings, type MarketDataSettings } from "@/settings";
import type {
	IMarketDataClient,
	MarketDataConfig,
	MarketDataParams,
	MarketDataResult,
	UserRateLimits,
} from "@/types";
import { attachMarketDataMethods } from "@/utils";

import pkg from "../package.json";

export class MarketDataClient implements IMarketDataClient {
	public readonly funds: FundsResource;
	public readonly headers: Record<string, string>;
	public readonly logger: Logger;
	public readonly markets: MarketsResource;
	public readonly options: OptionsResource;
	public rateLimits?: UserRateLimits;
	public readonly settings: MarketDataSettings;
	public readonly stocks: StocksResource;

	public get apiVersion(): string {
		return this.settings.marketdataApiVersion;
	}

	public get baseUrl(): string {
		return this.settings.marketdataBaseUrl;
	}

	public get token(): string | undefined {
		return this.settings.marketdataToken;
	}

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

		this._initAuth();
		this.stocks = new StocksResource(this);
		this.markets = new MarketsResource(this);
		this.funds = new FundsResource(this);
		this.options = new OptionsResource(this);
	}

	public _makeRequest<T>(
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
	): MarketDataResult<T> {
		const includeApiVersion = options.includeApiVersion ?? true;
		const url = this._buildUrl(path, params, includeApiVersion);
		const headers = this._getHeaders(params, options);

		this.logger.debug(`Making request to: ${url.toString()}`);

		return this._executeWithRetry<T>(
			url,
			headers,
			params,
			options.schema,
			options.service,
			{
				skipRateLimitCheck: options.skipRateLimitCheck,
				skipRetry: options.skipRetry,
				signal: options.signal,
			},
		);
	}

	private _rateLimitSetup?: Promise<void>;

	private _buildUrl(
		path: string,
		params: MarketDataParams,
		includeApiVersion = true,
	): URL {
		const urlPath = includeApiVersion ? `${this.apiVersion}/${path}` : path;
		const url = new URL(urlPath, this.baseUrl);
		const searchParams = new URLSearchParams();

		for (const [key, value] of Object.entries(params)) {
			if (value !== undefined) {
				searchParams.append(key, String(value));
			}
		}

		url.search = searchParams.toString();
		return url;
	}

	private _checkRateLimits(): void {
		if (!CHECK_RATE_LIMITS) return;
		if (this.rateLimits && this.rateLimits.requestsRemaining <= 0) {
			throw new RateLimitError("Rate limit exceeded");
		}
	}

	private async _checkServiceStatus(
		service: string,
		error: MarketDataClientError,
	): Promise<void> {
		const status = await globalApiStatus.getApiStatus(this, service);
		if (status === APIStatusResult.OFFLINE) {
			this.logger.error(`Service ${service} is OFFLINE. Aborting retries.`);
			throw new AbortError(error);
		}
	}

	private _executeWithRetry<T>(
		url: URL,
		headers: Record<string, string>,
		params?: MarketDataParams,
		schema?: z.ZodType<T>,
		service?: string,
		options: {
			skipRateLimitCheck?: boolean;
			skipRetry?: boolean;
			signal?: AbortSignal;
		} = {},
	): MarketDataResult<T> {
		const result = ResultAsync.fromPromise(
			pRetry(
				() =>
					this._performFetch(url, headers, params, schema, service, options),
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
			),
			(e) => this._mapFetchError(e),
		);

		return attachMarketDataMethods(result, saveBlobToFile);
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
			const error = CHECK_RATE_LIMITS
				? new RateLimitError(`Rate limit exceeded: ${errmsg}`)
				: new RequestError(`Request failed (${response.status}): ${errmsg}`);
			throw new AbortError(error);
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

	private _initAuth(): void {
		if (this.token) {
			this.headers.Authorization = `Bearer ${this.token}`;
		} else {
			this.logger.warn("No token provided, starting in demo mode");
		}
	}

	private _mapFetchError(e: unknown): MarketDataClientError {
		if (e instanceof MarketDataClientError) return e;
		if (e instanceof Error && e.name === "AbortError") {
			const original = (e as AbortError).originalError;
			if (original instanceof MarketDataClientError) return original;
			if (original instanceof z.ZodError)
				return new ValidationError(original.message);
			return new RequestError(
				original instanceof Error ? original.message : String(original),
			);
		}
		if (e instanceof z.ZodError) {
			return new ValidationError(e.message);
		}
		return new RequestError(e instanceof Error ? e.message : String(e));
	}

	private async _performFetch<T>(
		url: URL,
		headers: Record<string, string>,
		params?: MarketDataParams,
		schema?: z.ZodType<T>,
		service?: string,
		options: {
			skipRateLimitCheck?: boolean;
			signal?: AbortSignal;
		} = {},
	): Promise<T> {
		try {
			if (
				CHECK_RATE_LIMITS &&
				this.token &&
				!this.rateLimits &&
				!options.skipRateLimitCheck
			) {
				await this._setupRateLimits();
			}

			if (this.token && !options.skipRateLimitCheck) {
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

			if (this._isCsvRequest(params, schema)) {
				return this._handleCsvResponse(response) as unknown as T;
			}

			const json = await response.json();
			this.logger.debug(
				`Response JSON: ${JSON.stringify(json).substring(0, 200)}`,
			);

			if (schema) {
				const result = schema.safeParse(json);
				if (!result.success) {
					throw result.error;
				}
				return result.data;
			}
			return json as T;
		} catch (error) {
			if (error instanceof AbortError) {
				throw error;
			}

			if (
				error instanceof RequestError &&
				!(error instanceof ValidationError) &&
				!(error instanceof RateLimitError)
			) {
				throw error;
			}

			throw new AbortError(
				error instanceof Error ? error : new Error(String(error)),
			);
		}
	}

	private async _setupRateLimits(): Promise<void> {
		if (this._rateLimitSetup) return this._rateLimitSetup;

		this._rateLimitSetup = (async () => {
			const result = await this._makeRequest(Endpoints.USER, undefined, {
				includeApiVersion: false,
				skipRateLimitCheck: true,
				service: Service.USER,
			});

			if (result.isErr()) {
				this.logger.error(
					`Failed to setup rate limits: ${result.error.message}`,
				);
			}
			this._rateLimitSetup = undefined;
		})();

		return this._rateLimitSetup;
	}

	private _updateRateLimits(headers: Headers): void {
		if (headers.has("x-api-ratelimit-remaining")) {
			this.rateLimits = {
				requestsConsumed: Number(headers.get("x-api-ratelimit-consumed")) || 0,
				requestsLimit: Number(headers.get("x-api-ratelimit-limit")) || 0,
				requestsRemaining:
					Number(headers.get("x-api-ratelimit-remaining")) || 0,
				requestsReset: Number(headers.get("x-api-ratelimit-reset")) || 0,
			};
		}
	}

	private async _handleCsvResponse(response: Response): Promise<Blob> {
		const contentType = response.headers.get("content-type");
		if (contentType?.includes("application/json")) {
			const json = await response.json();
			const errmsg = json.errmsg || JSON.stringify(json);
			throw new RequestError(`API returned error: ${errmsg}`);
		}
		return response.blob();
	}

	private _getHeaders(
		params?: MarketDataParams,
		options: {
			headers?: Record<string, string>;
			schema?: z.ZodType<unknown>;
		} = {},
	): Record<string, string> {
		return {
			...this.headers,
			Accept: this._isCsvRequest(params, options.schema)
				? "text/csv"
				: "application/json",
			...options.headers,
		};
	}

	private _isCsvRequest(
		params?: MarketDataParams,
		schema?: z.ZodType<unknown>,
	): boolean {
		if (params && (params.outputFormat === "csv" || params.format === "csv")) {
			return true;
		}
		return !params && this.settings.marketdataOutputFormat === "csv" && !schema;
	}
}
