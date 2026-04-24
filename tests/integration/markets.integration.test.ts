import { describe, expect, it } from "vitest";
import { MarketDataClient } from "@/client";

const skip = !process.env.MARKETDATA_RUN_INTEGRATION_TESTS;

describe.skipIf(skip)("markets integration (live API)", () => {
	const client = new MarketDataClient();

	it("status returns open/closed for today", async () => {
		const rows = await client.markets.status();
		expect(rows).toBeInstanceOf(Array);
		expect(rows.length).toBeGreaterThan(0);
		expect(rows[0]).toHaveProperty("status");
	});
});
