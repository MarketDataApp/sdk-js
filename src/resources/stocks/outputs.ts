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
	Change_Price: z.array(z.number()),
	Change_Percent: z.array(z.number()),
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

export const StockEarningsHumanSchema = z.object({
	s: z.string().optional(),
	Symbol: z.array(z.string()),
	Fiscal_Year: z.array(z.number()),
	Fiscal_Quarter: z.array(z.number()),
	Date: z.array(z.number()),
	Report_Date: z.array(z.number()),
	Report_Time: z.array(z.string().nullable()),
	Currency: z.array(z.string().nullable()),
	Reported_EPS: z.array(z.number().nullable()),
	Estimated_EPS: z.array(z.number().nullable()),
	Surprise_EPS: z.array(z.number().nullable()),
	Surprise_EPS_Percent: z.array(z.number().nullable()),
	Updated: z.array(z.number()),
});

export const StockEarningsSchema = z.object({
	s: z.string().optional(),
	symbol: z.array(z.string()),
	fiscalYear: z.array(z.number()),
	fiscalQuarter: z.array(z.number()),
	date: z.array(z.number()),
	reportDate: z.array(z.number()),
	reportTime: z.array(z.string().nullable()),
	currency: z.array(z.string().nullable()),
	reportedEPS: z.array(z.number().nullable()),
	estimatedEPS: z.array(z.number().nullable()),
	surpriseEPS: z.array(z.number().nullable()),
	surpriseEPSpct: z.array(z.number().nullable()),
	updated: z.array(z.number()),
});

export const StockNewsHumanSchema = z.object({
	s: z.string().optional(),
	Symbol: z.array(z.string()),
	headline: z.array(z.string()),
	content: z.array(z.string()),
	source: z.array(z.string()),
	publicationDate: z.array(z.number()),
	Date: z.number(),
});

export const StockNewsSchema = z.object({
	s: z.string().optional(),
	symbol: z.array(z.string()),
	headline: z.array(z.string()),
	content: z.array(z.string()),
	source: z.array(z.string()),
	publicationDate: z.array(z.number()),
	updated: z.number(),
});

import type { UnpackedObject } from "@/utils";

export type StockCandleHumanRawResponse = z.infer<
	typeof StockCandleHumanSchema
>;
export type StockCandleRawResponse = z.infer<typeof StockCandleSchema>;
export type StockPriceHumanRawResponse = z.infer<typeof StockPriceHumanSchema>;
export type StockPriceRawResponse = z.infer<typeof StockPriceSchema>;
export type StockEarningsHumanRawResponse = z.infer<
	typeof StockEarningsHumanSchema
>;
export type StockEarningsRawResponse = z.infer<typeof StockEarningsSchema>;
export type StockNewsHumanRawResponse = z.infer<typeof StockNewsHumanSchema>;
export type StockNewsRawResponse = z.infer<typeof StockNewsSchema>;

export type StockCandle = UnpackedObject<StockCandleRawResponse>;
export type StockCandleHuman = UnpackedObject<StockCandleHumanRawResponse>;
export type StockPrice = UnpackedObject<StockPriceRawResponse>;
export type StockPriceHuman = UnpackedObject<StockPriceHumanRawResponse>;
export type StockNews = UnpackedObject<StockNewsRawResponse>;
export type StockNewsHuman = UnpackedObject<StockNewsHumanRawResponse>;

export type StockCandleResponse = StockCandle[];
export type StockCandleHumanResponse = StockCandleHuman[];
export type StockPriceResponse = StockPrice[];
export type StockPriceHumanResponse = StockPriceHuman[];
export type StockEarningsResponse = UnpackedObject<StockEarningsRawResponse>[];
export type StockEarningsHumanResponse =
	UnpackedObject<StockEarningsHumanRawResponse>[];
export type StockNewsResponse = StockNews[];
export type StockNewsHumanResponse = StockNewsHuman[];
