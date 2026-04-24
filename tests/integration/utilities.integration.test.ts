import { describe, expect, it } from "vitest";
import { MarketDataClient } from "@/client";

const skip = !process.env.MARKETDATA_RUN_INTEGRATION_TESTS;

describe.skipIf(skip)("utilities integration (live API)", () => {
	const client = new MarketDataClient();

	it("status returns service health", async () => {
		const s = await client.utilities.status();
		expect(s.service.length).toBeGreaterThan(0);
		expect(s.online[0]).toBe(true);
	});

	it("user returns rate-limit info when a token is configured", async () => {
		if (!client.token) return; // demo mode — skip gracefully
		const u = await client.utilities.user();
		expect(typeof u.remaining).toBe("number");
	});

	it("headers echoes the SDK User-Agent", async () => {
		const h = await client.utilities.headers();
		const ua =
			(h["user-agent"] as string | undefined) ??
			(h["User-Agent"] as string | undefined);
		expect(ua).toMatch(/marketdata-sdk-javascript\//);
	});
});
