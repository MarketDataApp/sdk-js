import { z } from "zod";

export const OptionsChainHumanSchema = z.object({
	s: z.string().optional(),
	Symbol: z.array(z.string()),
	Underlying: z.array(z.string()),
	Expiration_Date: z.array(z.number()),
	Option_Side: z.array(z.string()),
	Strike: z.array(z.number()),
	First_Traded: z.array(z.number()),
	Days_To_Expiration: z.array(z.number()),
	Date: z.array(z.number()),
	Bid: z.array(z.number().nullable()),
	Bid_Size: z.array(z.number().nullable()),
	Mid: z.array(z.number().nullable()),
	Ask: z.array(z.number().nullable()),
	Ask_Size: z.array(z.number().nullable()),
	Last: z.array(z.number().nullable()),
	Open_Interest: z.array(z.number().nullable()),
	Volume: z.array(z.number().nullable()),
	In_The_Money: z.array(z.boolean()),
	Intrinsic_Value: z.array(z.number()),
	Extrinsic_Value: z.array(z.number()),
	Underlying_Price: z.array(z.number()),
	IV: z.array(z.number().nullable()),
	Delta: z.array(z.number().nullable()),
	Gamma: z.array(z.number().nullable()),
	Theta: z.array(z.number().nullable()),
	Vega: z.array(z.number().nullable()),
});

export const OptionsChainSchema = z.object({
	s: z.string().optional(),
	optionSymbol: z.array(z.string()),
	underlying: z.array(z.string()),
	expiration: z.array(z.number()),
	side: z.array(z.string()),
	strike: z.array(z.number()),
	firstTraded: z.array(z.number()),
	dte: z.array(z.number()),
	updated: z.array(z.number()),
	bid: z.array(z.number().nullable()),
	bidSize: z.array(z.number().nullable()),
	mid: z.array(z.number().nullable()),
	ask: z.array(z.number().nullable()),
	askSize: z.array(z.number().nullable()),
	last: z.array(z.number().nullable()),
	openInterest: z.array(z.number().nullable()),
	volume: z.array(z.number().nullable()),
	inTheMoney: z.array(z.boolean()),
	intrinsicValue: z.array(z.number()),
	extrinsicValue: z.array(z.number()),
	underlyingPrice: z.array(z.number()),
	iv: z.array(z.number().nullable()),
	delta: z.array(z.number().nullable()),
	gamma: z.array(z.number().nullable()),
	theta: z.array(z.number().nullable()),
	vega: z.array(z.number().nullable()),
});
export const OptionsLookupSchema = z.object({
	s: z.string(),
	optionSymbol: z.string(),
	updated: z.number().optional(),
});

export const OptionsLookupHumanSchema = z.object({
	s: z.string().optional(),
	Symbol: z.string(),
});

export const OptionsExpirationsSchema = z.object({
	s: z.string(),
	expirations: z.array(z.string()),
	updated: z.number(),
});

export const OptionsExpirationsHumanSchema = z.object({
	s: z.string().optional(),
	Expirations: z.array(z.string()),
	Date: z.number(),
});

import type { UnpackedObject } from "@/utils";

export type OptionsLookupHumanRawResponse = z.infer<
	typeof OptionsLookupHumanSchema
>;
export type OptionsLookupRawResponse = z.infer<typeof OptionsLookupSchema>;
export type OptionsChainHumanRawResponse = z.infer<
	typeof OptionsChainHumanSchema
>;
export type OptionsChainRawResponse = z.infer<typeof OptionsChainSchema>;
export type OptionsExpirationsRawResponse = z.infer<
	typeof OptionsExpirationsSchema
>;
export type OptionsExpirationsHumanRawResponse = z.infer<
	typeof OptionsExpirationsHumanSchema
>;

export type OptionsChain = UnpackedObject<OptionsChainRawResponse>;
export type OptionsChainHuman = UnpackedObject<OptionsChainHumanRawResponse>;

export type OptionsLookupResponse = OptionsLookupRawResponse;
export type OptionsLookupHumanResponse = OptionsLookupHumanRawResponse;
export type OptionsChainResponse = OptionsChain[];
export type OptionsChainHumanResponse = OptionsChainHuman[];
export type OptionsExpirationsResponse = OptionsExpirationsRawResponse;
export type OptionsExpirationsHumanResponse =
	OptionsExpirationsHumanRawResponse;

/** @deprecated Use OptionsLookupResponse */
export type OptionsLookup = OptionsLookupResponse;
/** @deprecated Use OptionsLookupHumanResponse */
export type OptionsLookupHumanReadable = OptionsLookupHumanResponse;
/** @deprecated Use OptionsExpirationsResponse */
export type OptionsExpirations = OptionsExpirationsResponse;
/** @deprecated Use OptionsExpirationsHumanReadable */
export type OptionsExpirationsHumanReadable = OptionsExpirationsHumanResponse;
