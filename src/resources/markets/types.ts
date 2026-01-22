import { z } from "zod";
import { UserUniversalAPIParamsInputSchema } from "@/types";

export const MarketStatusParamsSchema = z.intersection(
	z
		.object({
			country: z.string().optional(),
			date: z.union([z.date(), z.string()]).optional(),
			from: z.union([z.date(), z.string()]).optional(),
			to: z.union([z.date(), z.string()]).optional(),
			countback: z.number().int().optional(),
		})
		.passthrough(),
	UserUniversalAPIParamsInputSchema,
);

export type MarketStatusParams = z.input<typeof MarketStatusParamsSchema>;
