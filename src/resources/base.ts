import { err, errAsync, ok, okAsync, type Result } from "neverthrow";

import type { z } from "zod";
import { ValidationError } from "@/error";
import { DEFAULT_EXCLUDE_KEYS } from "@/internalSettings";
import { processParams } from "@/params";
import type {
	IMarketDataClient,
	MarketDataParams,
	MarketDataResult,
	TypedResult,
} from "@/types";

import {
	getDataRecords,
	transformHumanKeys,
	type UnpackedObject,
} from "@/utils";

export abstract class BaseResource {
	constructor(client: IMarketDataClient) {
		this.client = client;
	}

	protected readonly client: IMarketDataClient;

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
	): TypedResult<UnpackedObject<T>[], UnpackedObject<H>[], P> {
		const validation = this._validateAndNormalize(params, options.inputSchema);
		if (validation.isErr()) {
			return errAsync(validation.error) as TypedResult<
				UnpackedObject<T>[],
				UnpackedObject<H>[],
				P
			>;
		}

		const validated = validation.value;
		const useHuman =
			(validated.useHumanReadable as boolean | string | undefined) ??
			(validated.human as boolean | string | undefined) ??
			this.client.settings.marketdataUseHumanReadable;

		const isHuman =
			useHuman === true || useHuman === "true" || useHuman === "1";

		const schema = this._getSchema(
			validated as MarketDataParams,
			options.regularSchema,
			options.humanSchema,
		);

		return this._makeRequest<Record<string, unknown>>(
			path,
			validated as MarketDataParams,
			{
				// biome-ignore lint/suspicious/noExplicitAny: Generic schema requires any type assertion
				schema: isHuman ? undefined : (schema as z.ZodType<any>),
				service: options.service,
			},
		).andThen((response) => {
			let data = response;
			if (isHuman) {
				const transformed = transformHumanKeys(data);
				const parseResult = options.humanSchema.safeParse(transformed);
				if (!parseResult.success) {
					return errAsync(
						new ValidationError(JSON.stringify(parseResult.error.issues)),
					);
				}
				// biome-ignore lint/suspicious/noExplicitAny: Parsed data needs to be cast to any for further processing
				data = parseResult.data as any;
			}
			return okAsync(
				getDataRecords(
					// biome-ignore lint/suspicious/noExplicitAny: Data records utility handles any type input
					data as any,
					options.excludeKeys || [...DEFAULT_EXCLUDE_KEYS],
				),
			);
		}) as TypedResult<UnpackedObject<T>[], UnpackedObject<H>[], P>;
	}

	protected _getSchema<T, H>(
		params: MarketDataParams,
		regularSchema?: z.ZodType<T>,
		humanSchema?: z.ZodType<H>,
	): z.ZodType<T | H> | undefined {
		const useHuman =
			(params.useHumanReadable as boolean | string | undefined) ??
			(params.human as boolean | string | undefined) ??
			this.client.settings.marketdataUseHumanReadable;

		const isHuman =
			useHuman === true || useHuman === "true" || useHuman === "1";

		if (isHuman && humanSchema) {
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
		const result = schema.safeParse(params);
		if (!result.success) {
			return err(new ValidationError(result.error.message));
		}
		return ok(result.data as P);
	}
}
