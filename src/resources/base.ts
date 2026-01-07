import pRetry from "p-retry";
import type { z } from "zod";
import {
	MarketDataClientErrorResult,
	RateLimitError,
	RequestError,
} from "../error";
import type { IMarketDataClient, MarketDataParams } from "../types";

export abstract class BaseResource {
	protected client: IMarketDataClient;

	constructor(client: IMarketDataClient) {
		this.client = client;
	}

	protected async _run<T>(
		fn: () => Promise<T>,
	): Promise<T | MarketDataClientErrorResult> {
		try {
			return await fn();
		} catch (error) {
			if (error instanceof Error) return new MarketDataClientErrorResult(error);
			return new MarketDataClientErrorResult(new Error(String(error)));
		}
	}

	protected async _makeRequest<T>(
		path: string,
		params: MarketDataParams = {},
		options: { headers?: Record<string, string> } = {},
	): Promise<T> {
		const finalParams = this._mergeGlobalParams(params);
		const url = this._buildUrl(path, finalParams);
		const headers = { ...this.client.headers, ...options.headers };

		return this._executeWithRetry<T>(url, headers);
	}

	private _mergeGlobalParams(params: MarketDataParams): MarketDataParams {
		const s = this.client.settings;
		const defaults: MarketDataParams = {};

		const mapping: MarketDataParams = {
			format: s.marketdataOutputFormat,
			dateformat: s.marketdataDateFormat,
			headers: s.marketdataAddHeaders,
			human: s.marketdataUseHumanReadable,
		};

		Object.entries(mapping).forEach(([param, setting]) => {
			if (setting !== undefined && params[param] === undefined) {
				defaults[param] = setting;
			}
		});

		return { ...defaults, ...params };
	}

	private _buildUrl(path: string, params: MarketDataParams): URL {
		const url = new URL(
			`${this.client.apiVersion}/${path}`,
			this.client.baseUrl,
		);
		const searchParams = new URLSearchParams();

		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				if (Array.isArray(value)) {
					searchParams.append(key, value.join(","));
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
					if (response.status === 429) {
						throw new RateLimitError(`Rate limit exceeded: ${text}`);
					}
					throw new RequestError(
						`Request failed with status ${response.status}: ${text}`,
					);
				}
				return (await response.json()) as T;
			},
			{
				retries: this.client.settings.marketdataMaxRetries,
				minTimeout: this.client.settings.marketdataRetryInitialWait * 1000,
				maxTimeout: this.client.settings.marketdataRetryMaxWait * 1000,
				factor: this.client.settings.marketdataRetryFactor,
			},
		);
	}

	private _checkRateLimits(): void {
		if (
			this.client.rateLimits &&
			this.client.rateLimits.requestsRemaining <= 0
		) {
			throw new RateLimitError("Rate limit exceeded");
		}
	}

	private _updateRateLimits(headers: Headers): void {
		if (headers.has("x-api-ratelimit-remaining")) {
			this.client.rateLimits = {
				requestsLimit: Number(headers.get("x-api-ratelimit-limit")),
				requestsRemaining: Number(headers.get("x-api-ratelimit-remaining")),
				requestsReset: Number(headers.get("x-api-ratelimit-reset")),
				requestsConsumed: Number(headers.get("x-api-ratelimit-consumed")),
			};
		}
	}

	protected validateParams<T>(schema: z.ZodType<T>, params: unknown): T {
		return schema.parse(params);
	}
}
