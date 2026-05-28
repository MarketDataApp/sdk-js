import { z } from "zod";

export const ApiStatusSchema = z.object({
	service: z.array(z.string()),
	status: z.array(z.string()),
	online: z.array(z.boolean()),
	uptimePct30d: z.array(z.number()).optional(),
	uptimePct90d: z.array(z.number()).optional(),
	updated: z.array(z.number()),
});
export type ApiStatusResponse = z.infer<typeof ApiStatusSchema>;

export const HeadersSchema = z.record(z.string(), z.unknown());
export type HeadersResponse = z.infer<typeof HeadersSchema>;
