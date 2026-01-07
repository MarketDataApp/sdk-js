import type { z } from "zod";
import { MarketDataClientErrorResult } from "@/error";
import type { IMarketDataClient, MarketDataParams } from "@/types";

export abstract class BaseResource {
	protected client: IMarketDataClient;

	constructor(client: IMarketDataClient) {
		this.client = client;
	}

	protected async _run<T>(fn: () => Promise<T>): Promise<T | MarketDataClientErrorResult> {
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
		options: { headers?: Record<string, string>; schema?: z.ZodType<T>; service?: string } = {},
	): Promise<T> {
		const finalParams = this._mergeGlobalParams(params);
		return (this.client as any)._makeRequest(path, finalParams, options);
	}

	private _mergeGlobalParams(params: MarketDataParams): MarketDataParams {
		const s = this.client.settings;
		const mapping: MarketDataParams = {
			format: s.marketdataOutputFormat,
			dateformat: s.marketdataDateFormat,
			headers: s.marketdataAddHeaders,
			human: s.marketdataUseHumanReadable,
		};

		const defaults = Object.entries(mapping).reduce<MarketDataParams>((acc, [param, setting]) => {
			if (setting !== undefined && params[param] === undefined) {
				acc[param] = setting;
			}
			return acc;
		}, {});

		return { ...defaults, ...params };
	}

	protected validateParams<T>(schema: z.ZodType<T>, params: unknown): T {
		return schema.parse(params);
	}
}
