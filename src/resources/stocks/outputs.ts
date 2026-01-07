import { z } from "zod";

export const StockPriceSchema = z.object({
	s: z.string().optional(),
	symbol: z.array(z.string()),
	mid: z.array(z.number()),
	change: z.array(z.number()),
	changepct: z.array(z.number()),
	updated: z.array(z.number()),
});

export const StockPriceHumanSchema = z.object({
	s: z.string().optional(),
	Symbol: z.array(z.string()),
	Mid: z.array(z.number()),
	"Change $": z.array(z.number()),
	"Change %": z.array(z.number()),
	Date: z.array(z.number()),
});

export type StockPriceResponse = z.infer<typeof StockPriceSchema>;
export type StockPriceHumanResponse = z.infer<typeof StockPriceHumanSchema>;
