import { z } from "zod";
import { UserUniversalAPIParamsInputSchema } from "@/types";

export const StocksCandlesInputSchema = z
	.object({
		symbol: z.string(),
		resolution: z.string().default("D"),
		from: z.union([z.string(), z.date()]).optional(),
		to: z.union([z.string(), z.date()]).optional(),
		countback: z.number().optional(),
		extended: z.boolean().optional(),
		adjustsplits: z.boolean().optional(),
	})
	.passthrough();

export const StocksCandlesParamsSchema = z.intersection(
	StocksCandlesInputSchema,
	UserUniversalAPIParamsInputSchema,
);

export type StocksCandlesParams = z.input<typeof StocksCandlesParamsSchema>;

export const StocksPricesInputSchema = z
	.object({
		symbols: z.union([z.string(), z.array(z.string())]),
	})
	.passthrough();

export const StocksPricesInputPreprocessed = z.preprocess((val: unknown) => {
	if (
		typeof val === "object" &&
		val !== null &&
		"symbols" in val &&
		typeof (val as { symbols: unknown }).symbols === "string"
	) {
		const v = val as { symbols: string };
		return {
			...v,
			symbols: v.symbols.split(",").map((s: string) => s.trim()),
		};
	}
	return val;
}, StocksPricesInputSchema);

export const StocksPricesParamsSchema = z.intersection(
	StocksPricesInputPreprocessed,
	UserUniversalAPIParamsInputSchema,
);

export type StocksPricesInput = z.input<typeof StocksPricesInputSchema>;
export type StocksPricesParams = z.input<typeof StocksPricesParamsSchema>;

export const StocksEarningsInputSchema = z
	.object({
		symbol: z.string(),
	})
	.passthrough();

export const StocksEarningsParamsSchema = z.intersection(
	StocksEarningsInputSchema,
	UserUniversalAPIParamsInputSchema,
);

export type StocksEarningsParams = z.input<typeof StocksEarningsParamsSchema>;

export const StocksNewsBaseInputSchema = z
	.object({
		from: z.union([z.string(), z.date()]).optional(),
		to: z.union([z.string(), z.date()]).optional(),
		countback: z.number().optional(),
		date: z.union([z.string(), z.date()]).optional(),
	})
	.passthrough();

export const StocksNewsInputSchema = StocksNewsBaseInputSchema.extend({
	symbol: z.string(),
});

export const StocksNewsParamsSchema = z.intersection(
	StocksNewsInputSchema,
	UserUniversalAPIParamsInputSchema,
);

export const StocksNewsInternalParamsSchema = z.intersection(
	StocksNewsBaseInputSchema,
	UserUniversalAPIParamsInputSchema,
);

export type StocksNewsParams = z.input<typeof StocksNewsParamsSchema>;

export const StocksQuotesInputSchema = z
	.object({
		symbols: z.union([z.string(), z.array(z.string())]),
		"52week": z.boolean().optional(),
		extended: z.boolean().optional(),
	})
	.passthrough();

export const StocksQuotesParamsSchema = z.intersection(
	StocksQuotesInputSchema,
	UserUniversalAPIParamsInputSchema,
);

export type StocksQuotesParams = z.input<typeof StocksQuotesParamsSchema>;
