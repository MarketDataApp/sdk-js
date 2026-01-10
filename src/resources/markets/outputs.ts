import { z } from "zod";

export const MarketStatusHumanSchema = z.object({
	s: z.string().optional(),
	Date: z.array(z.number()),
	Status: z.array(z.string()),
});

export const MarketStatusSchema = z.object({
	s: z.string().optional(),
	date: z.array(z.number()),
	status: z.array(z.string()),
});

export type MarketStatusHumanResponse = z.infer<typeof MarketStatusHumanSchema>;
export type MarketStatusResponse = z.infer<typeof MarketStatusSchema>;
