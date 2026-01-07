import { z } from "zod";
import { DateFormat, Mode, OutputFormat } from "./enums";
import type { MarketDataSettings } from "./settings";

export interface IMarketDataClient {
	settings: MarketDataSettings;
	token?: string;
	baseUrl: string;
	apiVersion: string;
	headers: Record<string, string>;
	rateLimits?: UserRateLimits;
}

export interface UserRateLimits {
	requestsLimit: number;
	requestsRemaining: number;
	requestsReset: number;
	requestsConsumed: number;
}

export { OutputFormat, DateFormat, Mode };

export type MarketDataParam =
	| string
	| number
	| boolean
	| null
	| undefined
	| string[];
export type MarketDataParams = Record<string, MarketDataParam>;

export const UserUniversalAPIParamsSchema = z.object({
	outputFormat: z
		.nativeEnum(OutputFormat)
		.optional()
		.default(OutputFormat.JSON),
	dateFormat: z.nativeEnum(DateFormat).optional(),
	columns: z.array(z.string()).optional(),
	addHeaders: z.boolean().optional(),
	useHumanReadable: z.boolean().optional(),
	mode: z.nativeEnum(Mode).optional(),
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
	maxRetries?: number;
	retryInitialWait?: number;
	retryFactor?: number;
	retryMaxWait?: number;
}
