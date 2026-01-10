import { z } from "zod";

export const FundsCandleHumanSchema = z.object({
	s: z.string().optional(),
	Date: z.array(z.number()),
	Open: z.array(z.number()),
	High: z.array(z.number()),
	Low: z.array(z.number()),
	Close: z.array(z.number()),
});

export const FundsCandleSchema = z.object({
	s: z.string().optional(),
	t: z.array(z.number()),
	o: z.array(z.number()),
	h: z.array(z.number()),
	l: z.array(z.number()),
	c: z.array(z.number()),
});

export type FundsCandleHumanResponse = z.infer<typeof FundsCandleHumanSchema>;
export type FundsCandleResponse = z.infer<typeof FundsCandleSchema>;
