import { describe, expect, it } from "vitest";
import { MarketDataClient } from "@/client";

const skip = !process.env.MARKETDATA_RUN_INTEGRATION_TESTS;

describe.skipIf(skip)("options integration (live API)", () => {
	const client = new MarketDataClient();

	it("expirations returns a list for AAPL", async () => {
		const res = await client.options.expirations("AAPL");
		expect(res.expirations).toBeInstanceOf(Array);
		expect(res.expirations.length).toBeGreaterThan(0);
	});

	it("lookup converts human-readable to OCC symbol", async () => {
		const res = await client.options.lookup("AAPL 7/28/2023 200 Call");
		expect(res.optionSymbol).toMatch(/^AAPL\d{6}[CP]\d{8}$/);
	});

	it("chain returns rows for AAPL with a near expiration", async () => {
		const exps = await client.options.expirations("AAPL");
		const near = exps.expirations[0];
		const rows = await client.options.chain("AAPL", { expiration: near });
		expect(rows).toBeInstanceOf(Array);
		expect(rows.length).toBeGreaterThan(0);
	});
});
