import { z } from "zod";
import { UserUniversalAPIParamsInputSchema } from "@/types";

export const OptionsChainInputSchema = z.object({
	symbol: z.string().optional(),
	date: z.union([z.string(), z.date()]).optional(),
	expiration: z.union([z.string(), z.date()]).optional(),
	days_to_expiration: z.number().optional(),
	from: z.union([z.string(), z.date()]).optional(),
	to: z.union([z.string(), z.date()]).optional(),
	month: z.number().int().min(1).max(12).optional(),
	year: z.number().int().optional(),
	weekly: z.boolean().optional(),
	monthly: z.boolean().optional(),
	quarterly: z.boolean().optional(),
	strike: z.union([z.number(), z.string()]).optional(),
	delta: z.number().optional(),
	strike_limit: z.number().optional(),
	range: z.string().optional(),
	min_bid: z.number().optional(),
	max_bid: z.number().optional(),
	min_ask: z.number().optional(),
	max_ask: z.number().optional(),
	max_bid_ask_spread: z.number().optional(),
	max_bid_ask_spread_pct: z.number().optional(),
	min_open_interest: z.number().int().optional(),
	min_volume: z.number().int().optional(),
	nonstandard: z.boolean().optional(),
	side: z.enum(["call", "put", "both"]).optional(),
	am: z.boolean().optional(),
	pm: z.boolean().optional(),
});

export const OptionsChainParamsSchema = z.intersection(
	OptionsChainInputSchema,
	UserUniversalAPIParamsInputSchema,
);

export type OptionsChainParams = z.input<typeof OptionsChainParamsSchema>;

export const OptionsExpirationsInputSchema = z.object({
	symbol: z.string().optional(),
	strike: z.number().optional(),
	date: z.union([z.string(), z.date()]).optional(),
});

export const OptionsExpirationsParamsSchema = z.intersection(
	OptionsExpirationsInputSchema,
	UserUniversalAPIParamsInputSchema,
);

export type OptionsExpirationsParams = z.input<
	typeof OptionsExpirationsParamsSchema
>;

export const OptionsLookupInputSchema = z.object({
	lookup: z.string().min(1),
});

export const OptionsLookupParamsSchema = z.intersection(
	OptionsLookupInputSchema,
	UserUniversalAPIParamsInputSchema,
);

export type OptionsLookupParams = z.input<typeof OptionsLookupParamsSchema>;
