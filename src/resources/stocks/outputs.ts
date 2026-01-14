import { z } from "zod";

export const StockCandleHumanSchema = z.object({
	s: z.string().optional(),
	Date: z.array(z.number()),
	Open: z.array(z.number()),
	High: z.array(z.number()),
	Low: z.array(z.number()),
	Close: z.array(z.number()),
	Volume: z.array(z.number()),
});

export const StockCandleSchema = z.object({
	s: z.string().optional(),
	t: z.array(z.number()),
	o: z.array(z.number()),
	h: z.array(z.number()),
	l: z.array(z.number()),
	c: z.array(z.number()),
	v: z.array(z.number()),
});

export const StockPriceHumanSchema = z.object({
	s: z.string().optional(),
	Symbol: z.array(z.string()),
	Mid: z.array(z.number()),
	"Change $": z.array(z.number()),
	"Change %": z.array(z.number()),
	Date: z.array(z.number()),
});

export const StockPriceSchema = z.object({
	s: z.string().optional(),
	symbol: z.array(z.string()),
	mid: z.array(z.number()),
	change: z.array(z.number()),
	changepct: z.array(z.number()),
	updated: z.array(z.number()),
});

import type { UnpackedObject } from "@/utils";

export type StockCandleHumanRawResponse = z.infer<
	typeof StockCandleHumanSchema
>;
export type StockCandleRawResponse = z.infer<typeof StockCandleSchema>;
export type StockPriceHumanRawResponse = z.infer<typeof StockPriceHumanSchema>;
export type StockPriceRawResponse = z.infer<typeof StockPriceSchema>;

export type StockCandle = UnpackedObject<StockCandleRawResponse>;
export type StockCandleHuman = UnpackedObject<StockCandleHumanRawResponse>;
export type StockPrice = UnpackedObject<StockPriceRawResponse>;
export type StockPriceHuman = UnpackedObject<StockPriceHumanRawResponse>;

export type StockCandleResponse = StockCandle[];
export type StockCandleHumanResponse = StockCandleHuman[];
export type StockPriceResponse = StockPrice[];
export type StockPriceHumanResponse = StockPriceHuman[];
