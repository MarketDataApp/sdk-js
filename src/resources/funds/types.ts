import { z } from "zod";
import { UserUniversalAPIParamsInputSchema } from "@/types";

export const FundsCandlesInputSchema = z
	.object({
		symbol: z.string(),
		resolution: z
			.string()
			.regex(/^(?:[1-9]\d*(?:[DWMY])?|[DWMY]|daily|weekly|monthly|yearly)$/i)
			.default("D"),
		from: z.union([z.string(), z.date()]).optional(),
		to: z.union([z.string(), z.date()]).optional(),
		countback: z.number().optional(),
	})
	.passthrough();

export const FundsCandlesParamsSchema = z.intersection(
	FundsCandlesInputSchema,
	UserUniversalAPIParamsInputSchema,
);

export type FundsCandlesParams = z.input<typeof FundsCandlesParamsSchema>;
