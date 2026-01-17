import { z } from "zod";
import { UserUniversalAPIParamsInputSchema } from "@/types";

export const StocksCandlesInputSchema = z.object({
	symbol: z.string(),
	resolution: z.string().default("D"),
	from: z.union([z.string(), z.date()]).optional(),
	to: z.union([z.string(), z.date()]).optional(),
	countback: z.number().optional(),
	extended: z.boolean().optional(),
	adjustsplits: z.boolean().optional(),
});

export const StocksCandlesParamsSchema = z.intersection(
	StocksCandlesInputSchema,
	UserUniversalAPIParamsInputSchema,
);

export type StocksCandlesParams = z.input<typeof StocksCandlesParamsSchema>;

export const StocksPricesInputSchema = z.object({
	symbols: z.union([z.string(), z.array(z.string())]),
});

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

export const StocksEarningsInputSchema = z.object({
	symbol: z.string(),
});

export const StocksEarningsParamsSchema = z.intersection(
	StocksEarningsInputSchema,
	UserUniversalAPIParamsInputSchema,
);

export type StocksEarningsParams = z.input<typeof StocksEarningsParamsSchema>;
