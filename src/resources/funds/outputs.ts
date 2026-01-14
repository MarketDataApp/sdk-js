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

import type { UnpackedObject } from "@/utils";

export type FundsCandleHumanRawResponse = z.infer<
	typeof FundsCandleHumanSchema
>;
export type FundsCandleRawResponse = z.infer<typeof FundsCandleSchema>;

export type FundsCandle = UnpackedObject<FundsCandleRawResponse>;
export type FundsCandleHuman = UnpackedObject<FundsCandleHumanRawResponse>;

export type FundsCandleResponse = FundsCandle[];
export type FundsCandleHumanResponse = FundsCandleHuman[];
