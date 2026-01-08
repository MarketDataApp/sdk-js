import type { ResultAsync } from "neverthrow";
import { z } from "zod";
import { DateFormat, Mode, OutputFormat } from "@/enums";
import type { MarketDataClientError } from "@/error";
import type { Logger } from "@/logger";
import type { MarketDataSettings } from "@/settings";
import type { stockRequestResult } from "@/utils";

export interface IMarketDataClient {
	readonly settings: MarketDataSettings;
	readonly token?: string;
	readonly baseUrl: string;
	readonly apiVersion: string;
	readonly headers: Record<string, string>;
	rateLimits?: UserRateLimits;
	readonly logger: Logger;
	_makeRequest<T>(
		path: string,
		params?: MarketDataParams,
		options?: {
			headers?: Record<string, string>;
			schema?: z.ZodType<T>;
			service?: string;
			includeApiVersion?: boolean;
			skipRateLimitCheck?: boolean;
			skipRetry?: boolean;
		},
	): MarketDataResult<T>;
}

export type MarketDataResult<T> = ResultAsync<T, MarketDataClientError>;

export type TypedResult<
	T extends Record<string, unknown>,
	H extends Record<string, unknown>,
	P,
> = MarketDataResult<
	P extends { useHumanReadable: true } | { human: true }
		? stockRequestResult<H>
		: stockRequestResult<T>
>;

export interface UserRateLimits {
	requestsLimit: number;
	requestsRemaining: number;
	requestsReset: number;
	requestsConsumed: number;
}

export { OutputFormat, DateFormat, Mode };

export const BooleanString = z
	.union([z.boolean(), z.string()])
	.transform((val) => {
		if (typeof val === "boolean") return val;
		return val.toLowerCase() === "true" || val === "1";
	});

export const BaseMarketDataParamsSchema = z.object({
	outputFormat: z.enum(OutputFormat).optional().default(OutputFormat.JSON),
	dateFormat: z.enum(DateFormat).optional(),
	columns: z.array(z.string()).optional(),
	addHeaders: BooleanString.optional(),
	useHumanReadable: BooleanString.optional(),
	mode: z.enum(Mode).optional(),
});

export type MarketDataParam =
	| string
	| string[]
	| number
	| boolean
	| Date
	| Date[]
	| null
	| undefined;
export type MarketDataParams = Record<string, MarketDataParam>;

export const UserUniversalAPIParamsSchema = BaseMarketDataParamsSchema.extend({
	filename: z.string().optional(),
});

export const UserUniversalAPIParamsInputSchema = z.preprocess(
	(val: unknown) => {
		if (typeof val !== "object" || val === null) return val;
		const out = val as Record<string, unknown>;

		if ("dateformat" in out) {
			out.dateFormat = out.dateformat;
			delete out.dateformat;
		}
		if ("headers" in out) {
			out.addHeaders = out.headers;
			delete out.headers;
		}
		if ("human" in out) {
			out.useHumanReadable = out.human;
			delete out.human;
		}
		if ("output_format" in out) {
			out.outputFormat = out.output_format;
			delete out.output_format;
		}

		return out;
	},
	UserUniversalAPIParamsSchema,
);

export type UserUniversalAPIParams = z.infer<
	typeof UserUniversalAPIParamsSchema
>;
export type UserUniversalAPIParamsInput = z.input<
	typeof UserUniversalAPIParamsInputSchema
>;

export interface MarketDataConfig {
	token?: string;
	baseUrl?: string;
	apiVersion?: string;
	debug?: boolean;
	logger?: Logger;
	maxRetries?: number;
	retryInitialWait?: number;
	retryFactor?: number;
	retryMaxWait?: number;
}
