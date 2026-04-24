import { z } from "zod";

export const UtilitiesParamsSchema = z.object({}).passthrough();
export type UtilitiesParams = z.infer<typeof UtilitiesParamsSchema>;
