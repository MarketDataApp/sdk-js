import { z } from "zod";

export const MarketStatusParamsSchema = z.object({
	country: z.string().optional(),
	date: z.union([z.date(), z.string()]).optional(),
	from: z.union([z.date(), z.string()]).optional(),
	to: z.union([z.date(), z.string()]).optional(),
	countback: z.number().int().optional(),
});

export type MarketStatusParams = z.infer<typeof MarketStatusParamsSchema>;
