import type { z } from "zod";
import { MarketDataClientErrorResult } from "@/error";
import { processParams } from "@/params";
import type {
	IMarketDataClient,
	MarketDataParams,
	UserUniversalAPIParams,
} from "@/types";

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
		options: {
			headers?: Record<string, string>;
			schema?: z.ZodType<T>;
			service?: string;
			universalParams?: Partial<UserUniversalAPIParams>;
		} = {},
	): Promise<T> {
		const finalParams = processParams(
			params,
			options.universalParams || {},
			this.client.settings,
		);
		return (this.client as any)._makeRequest(path, finalParams, options);
	}

	protected validateParams<T>(schema: z.ZodType<T>, params: unknown): T {
		return schema.parse(params);
	}
}
