import { err, errAsync, ok, type Result } from "neverthrow";

import type { z } from "zod";
import { ValidationError } from "@/error";
import { processParams } from "@/params";
import type {
	IMarketDataClient,
	MarketDataParams,
	MarketDataResult,
	TypedResult,
} from "@/types";
import { getDataRecords } from "@/utils";

const DEFAULT_EXCLUDE_KEYS = ["s"] as const;

export abstract class BaseResource {
	protected readonly client: IMarketDataClient;

	constructor(client: IMarketDataClient) {
		this.client = client;
	}

	protected _fetch<
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
		const normalization = this._validateAndNormalize(
			params,
			options.inputSchema,
		);
		if (normalization.isErr()) {
			return errAsync(normalization.error) as TypedResult<T, H, P>;
		}

		const validated = normalization.value;

		const schema = this._getSchema(
			validated as MarketDataParams,
			options.regularSchema,
			options.humanSchema,
		);

		return this._makeRequest<T | H>(path, validated as MarketDataParams, {
			schema,
			service: options.service,
		}).map((response: T | H) =>
			getDataRecords(
				response,
				options.excludeKeys || [...DEFAULT_EXCLUDE_KEYS],
			),
		) as TypedResult<T, H, P>;
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

	protected _isInternalFormat(params: MarketDataParams): boolean {
		const format =
			(params.outputFormat as string) ||
			this.client.settings.marketdataOutputFormat;
		return format === "internal";
	}

	protected _makeRequest<T>(
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
	): MarketDataResult<T> {
		const finalParams = processParams(params, this.client.settings);
		return this.client._makeRequest(path, finalParams, options);
	}

	protected _validateAndNormalize<P extends MarketDataParams>(
		params: P,
		schema: z.ZodType<unknown>,
	): Result<P, ValidationError> {
		const validationResult = schema.safeParse(params);
		if (!validationResult.success) {
			return err(new ValidationError(validationResult.error.message));
		}
		return ok(validationResult.data as P);
	}
}
