import type { z } from "zod";
import { MarketDataClientErrorResult } from "@/error";
import { processParams } from "@/params";
import type {
	IMarketDataClient,
	MarketDataParams,
	UserUniversalAPIParams,
} from "@/types";
import { getDataRecords, type stockRequestResult } from "@/utils";

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
			includeApiVersion?: boolean;
			skipRateLimitCheck?: boolean;
			skipRetry?: boolean;
		} = {},
	): Promise<T> {
		const finalParams = processParams(
			params,
			options.universalParams || {},
			this.client.settings,
		);
		return this.client._makeRequest(path, finalParams, options);
	}

	protected async _fetch<
		T extends Record<string, any>,
		H extends Record<string, any> = T,
	>(
		path: string,
		params: any,
		options: {
			inputSchema: z.ZodType<any>;
			regularSchema: z.ZodType<T>;
			humanSchema: z.ZodType<H>;
			service: string;
			excludeKeys?: string[];
		},
	): Promise<stockRequestResult<T | H> | MarketDataClientErrorResult> {
		return this._run(async () => {
			const validated = this.validateParams(options.inputSchema, params);
			const useHuman =
				(params as any).useHumanReadable ??
				this.client.settings.marketdataUseHumanReadable;

			const response = await this._makeRequest<T | H>(path, validated, {
				schema: useHuman ? options.humanSchema : options.regularSchema,
				service: options.service,
			});

			return getDataRecords(response, options.excludeKeys || ["s"]);
		});
	}

	protected validateParams<T>(schema: z.ZodType<T>, params: unknown): T {
		return schema.parse(params);
	}
}
