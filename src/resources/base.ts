import type { z } from "zod";
import type { DateFormat, Mode, OutputFormat } from "@/enums";
import { MarketDataClientErrorResult } from "@/error";
import { processParams } from "@/params";
import type {
	IMarketDataClient,
	MarketDataParams,
	TypedResult,
	UserUniversalAPIParams,
} from "@/types";
import { getDataRecords } from "@/utils";

const DEFAULT_EXCLUDE_KEYS = ["s"] as const;

function extractUniversalParams(
	validated: unknown,
): Partial<UserUniversalAPIParams> {
	const v = validated as Record<string, unknown>;
	return {
		outputFormat: v.outputFormat as OutputFormat | undefined,
		dateFormat: v.dateFormat as DateFormat | undefined,
		addHeaders: v.addHeaders as boolean | undefined,
		useHumanReadable: v.useHumanReadable as boolean | undefined,
		mode: v.mode as Mode | undefined,
		columns: v.columns as string[] | undefined,
	};
}

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
			regularSchema: z.ZodType<T>;
			humanSchema: z.ZodType<H>;
			service: string;
			excludeKeys?: string[];
		},
	): TypedResult<T, H, P> {
		return this._run(async () => {
			const validated = this.validateParams(options.inputSchema, params);
			const universalParams = extractUniversalParams(validated);

			const useHuman =
				universalParams.useHumanReadable ??
				this.client.settings.marketdataUseHumanReadable;

			const response = await this._makeRequest<T | H>(
				path,
				validated as MarketDataParams,
				{
					schema: useHuman ? options.humanSchema : options.regularSchema,
					service: options.service,
					universalParams,
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

	protected async _run<T>(
		fn: () => Promise<T>,
	): Promise<T | MarketDataClientErrorResult> {
		try {
			return await fn();
		} catch (error) {
			if (error instanceof Error) {
				return new MarketDataClientErrorResult(error);
			}
			return new MarketDataClientErrorResult(new Error(String(error)));
		}
	}

	protected validateParams<T>(schema: z.ZodType<T>, params: unknown): T {
		return schema.parse(params);
	}
}
