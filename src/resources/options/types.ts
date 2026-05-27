import { z } from "zod";
import { UserUniversalAPIParamsInputSchema } from "@/types";

export const OptionsChainInputSchema = z
	.object({
		symbol: z.string().optional(),
		date: z.union([z.string(), z.date()]).optional(),
		expiration: z.union([z.string(), z.date()]).optional(),
		dte: z.number().optional(),
		from: z.union([z.string(), z.date()]).optional(),
		to: z.union([z.string(), z.date()]).optional(),
		month: z.number().int().min(1).max(12).optional(),
		year: z.number().int().optional(),
		weekly: z.boolean().optional(),
		monthly: z.boolean().optional(),
		quarterly: z.boolean().optional(),
		strike: z.union([z.number(), z.string()]).optional(),
		delta: z.number().optional(),
		strikeLimit: z.number().optional(),
		range: z.string().optional(),
		minBid: z.number().optional(),
		maxBid: z.number().optional(),
		minAsk: z.number().optional(),
		maxAsk: z.number().optional(),
		maxBidAskSpread: z.number().optional(),
		maxBidAskSpreadPct: z.number().optional(),
		minOpenInterest: z.number().int().optional(),
		minVolume: z.number().int().optional(),
		nonstandard: z.boolean().optional(),
		side: z.enum(["call", "put", "both"]).optional(),
		am: z.boolean().optional(),
		pm: z.boolean().optional(),
	})
	.passthrough();

export const OptionsChainParamsSchema = z.intersection(
	OptionsChainInputSchema,
	UserUniversalAPIParamsInputSchema,
);

export type OptionsChainParams = z.input<typeof OptionsChainParamsSchema>;

export const OptionsExpirationsInputSchema = z
	.object({
		symbol: z.string().optional(),
		strike: z.number().optional(),
		date: z.union([z.string(), z.date()]).optional(),
	})
	.passthrough();

export const OptionsExpirationsParamsSchema = z.intersection(
	OptionsExpirationsInputSchema,
	UserUniversalAPIParamsInputSchema,
);

export type OptionsExpirationsParams = z.input<
	typeof OptionsExpirationsParamsSchema
>;

export const OptionsStrikesInputSchema = z
	.object({
		symbol: z.string().optional(),
		expiration: z.union([z.string(), z.date()]).optional(),
		date: z.union([z.string(), z.date()]).optional(),
	})
	.passthrough();

export const OptionsStrikesParamsSchema = z.intersection(
	OptionsStrikesInputSchema,
	UserUniversalAPIParamsInputSchema,
);

export type OptionsStrikesParams = z.input<typeof OptionsStrikesParamsSchema>;

export const OptionsLookupInputSchema = z
	.object({
		lookup: z.string().min(1),
	})
	.passthrough();

export const OptionsLookupParamsSchema = z.intersection(
	OptionsLookupInputSchema,
	UserUniversalAPIParamsInputSchema,
);

export type OptionsLookupParams = z.input<typeof OptionsLookupParamsSchema>;

export const OptionsQuotesInputSchema = z
	.object({
		symbols: z.union([z.string(), z.array(z.string())]),
	})
	.passthrough();

export const OptionsQuotesParamsSchema = z.intersection(
	OptionsQuotesInputSchema,
	UserUniversalAPIParamsInputSchema,
);

export type OptionsQuotesParams = z.input<typeof OptionsQuotesParamsSchema>;
