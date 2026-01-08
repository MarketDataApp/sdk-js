import type { z } from "zod";

import { MarketDataClientErrorResult } from "@/error";
import { processParams } from "@/params";
import type { IMarketDataClient, MarketDataParams, TypedResult } from "@/types";
import { getDataRecords } from "@/utils";

const DEFAULT_EXCLUDE_KEYS = ["s"] as const;

export abstract class BaseResource {
	protected readonly client: IMarketDataClient;

	constructor(client: IMarketDataClient) {
		this.client = client;
	}

	protected async _fetch<
		T extends Record<string, unknown>,
		H extends Record<string, unknown>,
		P extends MarketDataParams,
	>(
		path: string,
		params: P,
		options: {
			inputSchema: z.ZodType<unknown>;
			regularSchema?: z.ZodType<T>;
			humanSchema: z.ZodType<H>;
			service: string;
			excludeKeys?: string[];
		},
	): TypedResult<T, H, P> {
		return this._run(async () => {
			const validated = options.inputSchema.parse(params) as Record<
				string,
				unknown
			>;

			const schema = this._getSchema(
				validated as MarketDataParams,
				options.regularSchema,
				options.humanSchema,
			);

			const response = await this._makeRequest<T | H>(
				path,
				validated as MarketDataParams,
				{
					schema,
					service: options.service,
				},
			);

			return getDataRecords(
				response,
				options.excludeKeys || [...DEFAULT_EXCLUDE_KEYS],
			);
		}) as TypedResult<T, H, P>;
	}

	protected async _makeRequest<T>(
		path: string,
		params: MarketDataParams = {},
		options: {
			headers?: Record<string, string>;
			schema?: z.ZodType<T>;
			service?: string;
			includeApiVersion?: boolean;
			skipRateLimitCheck?: boolean;
			skipRetry?: boolean;
		} = {},
	): Promise<T> {
		const finalParams = processParams(params, this.client.settings);
		return this.client._makeRequest(path, finalParams, options);
	}

	protected async _run<T>(
		fn: () => Promise<T>,
	): Promise<T | MarketDataClientErrorResult> {
		try {
			return await fn();
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			return new MarketDataClientErrorResult(err);
		}
	}

	protected _isInternalFormat(params: MarketDataParams): boolean {
		const format =
			(params.outputFormat as string) ||
			this.client.settings.marketdataOutputFormat;
		return format === "internal";
	}

	protected _getSchema<T, H>(
		params: MarketDataParams,
		regularSchema?: z.ZodType<T>,
		humanSchema?: z.ZodType<H>,
	): z.ZodType<T | H> | undefined {
		const useHuman =
			(params.useHumanReadable as boolean | undefined) ??
			this.client.settings.marketdataUseHumanReadable;

		if (useHuman && humanSchema) {
			return humanSchema;
		}

		const isInternal = this._isInternalFormat(params);
		return isInternal ? regularSchema : undefined;
	}
}
