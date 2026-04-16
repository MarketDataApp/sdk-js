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

import type { UnpackedObject } from "@/utils";

export type MarketStatusHumanRawResponse = z.infer<
	typeof MarketStatusHumanSchema
>;
export type MarketStatusRawResponse = z.infer<typeof MarketStatusSchema>;

export type MarketStatusHumanResponse =
	UnpackedObject<MarketStatusHumanRawResponse>[];
export type MarketStatusResponse = UnpackedObject<MarketStatusRawResponse>[];
