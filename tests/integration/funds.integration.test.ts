import { describe, expect, it } from "vitest";
import { MarketDataClient } from "@/client";

const skip = !process.env.MARKETDATA_RUN_INTEGRATION_TESTS;

describe.skipIf(skip)("funds integration (live API)", () => {
	const client = new MarketDataClient();

	it("candles for VFINX (free tier)", async () => {
		const rows = await client.funds.candles("VFINX", {
			from: "2024-01-02",
			to: "2024-01-10",
		});
		expect(rows).toBeInstanceOf(Array);
		expect(rows.length).toBeGreaterThan(0);
		expect(rows[0]).toHaveProperty("c");
	});
});
