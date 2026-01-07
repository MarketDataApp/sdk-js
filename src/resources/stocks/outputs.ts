import { z } from "zod";

export const StockPriceSchema = z.object({
	s: z.string(),
	symbol: z.array(z.string()),
	mid: z.array(z.number()),
	change: z.array(z.number()),
	changepct: z.array(z.number()),
	updated: z.array(z.number()),
});

export type StockPriceResponse = z.infer<typeof StockPriceSchema>;
