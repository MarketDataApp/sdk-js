import type { ResultAsync } from "neverthrow";
import { z } from "zod";
import { DateFormat, Mode, OutputFormat } from "@/enums";
import type { MarketDataClientError } from "@/error";
import type { Logger } from "@/logger";
import type { MarketDataSettings } from "@/settings";

export interface IMarketDataClient {
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
	readonly apiVersion: string;
	readonly baseUrl: string;
	readonly headers: Record<string, string>;
	readonly logger: Logger;
	rateLimits?: UserRateLimits;
	readonly settings: MarketDataSettings;
	readonly token?: string;
}

export interface MarketDataResult<T>
	extends ResultAsync<T, MarketDataClientError> {
	save(filename?: string): Promise<string>;
	blob(): Promise<Blob>;
}

export type TypedResult<T, H, P> = MarketDataResult<
	P extends { outputFormat: "csv" }
		? Blob
		: P extends { useHumanReadable: true } | { human: true }
			? H
			: T
>;

export interface UserRateLimits {
	requestsConsumed: number;
	requestsLimit: number;
	requestsRemaining: number;
	requestsReset: number;
}

export { OutputFormat, DateFormat, Mode };

export const BooleanString = z
	.union([z.boolean(), z.string()])
	.transform((val) => {
		if (typeof val === "boolean") return val;
		return val.toLowerCase() === "true" || val === "1";
	});

export const BaseMarketDataParamsSchema = z.object({
	addHeaders: BooleanString.optional(),
	columns: z.array(z.string()).optional(),
	dateFormat: z.enum(DateFormat).optional(),
	mode: z.enum(Mode).optional(),
	outputFormat: z.enum(OutputFormat).optional(),
	useHumanReadable: BooleanString.optional(),
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
		if ("format" in out) {
			out.outputFormat = out.format;
			delete out.format;
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
	apiVersion?: string;
	baseUrl?: string;
	debug?: boolean;
	logger?: Logger;
	maxRetries?: number;
	retryFactor?: number;
	retryInitialWait?: number;
	retryMaxWait?: number;
	token?: string;
}
