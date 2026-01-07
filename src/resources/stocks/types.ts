import { z } from "zod";
import { UserUniversalAPIParamsInputSchema } from "../../types";

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

export type StocksPricesInput = z.input<typeof StocksPricesInputSchema>;

export const StocksPricesParamsSchema = z.intersection(
	StocksPricesInputPreprocessed,
	UserUniversalAPIParamsInputSchema,
);

export type StocksPricesParams = z.input<typeof StocksPricesParamsSchema>;
