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
export interface OptionsLookup {
	[key: string]: unknown;
	s: string;
	optionSymbol: string;
}

export interface OptionsLookupHumanReadable {
	[key: string]: unknown;
	Symbol: string;
}

export type OptionsChainHumanResponse = z.infer<typeof OptionsChainHumanSchema>;
export type OptionsChainResponse = z.infer<typeof OptionsChainSchema>;

export interface OptionsExpirations {
	[key: string]: unknown;
	s: string;
	expirations: string[];
	updated: number;
}

export interface OptionsExpirationsHumanReadable {
	[key: string]: unknown;
	Expirations: string[];
	Date: number;
}
