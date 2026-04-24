import { describe, expect, it } from "vitest";
import { MarketDataClient } from "@/client";

const skip = !process.env.MARKETDATA_RUN_INTEGRATION_TESTS;

describe.skipIf(skip)("stocks integration (live API)", () => {
	const client = new MarketDataClient();

	it("prices — single symbol", async () => {
		const rows = await client.stocks.prices("AAPL");
		expect(rows).toBeInstanceOf(Array);
		expect(rows.length).toBeGreaterThanOrEqual(1);
	});

	it("prices — multi-symbol fan-out", async () => {
		const rows = await client.stocks.prices(["AAPL", "MSFT"]);
		expect(rows.length).toBeGreaterThanOrEqual(1);
	});

	it("quotes — bulk fan-out", async () => {
		const rows = await client.stocks.quotes(["AAPL", "MSFT"]);
		expect(rows).toBeInstanceOf(Array);
	});

	it("candles — daily with date range", async () => {
		const rows = await client.stocks.candles("AAPL", {
			resolution: "D",
			from: "2024-01-01",
			to: "2024-01-10",
		});
		expect(rows.length).toBeGreaterThan(0);
		expect(rows[0]).toHaveProperty("t");
		expect(rows[0]).toHaveProperty("o");
		expect(rows[0]).toHaveProperty("c");
	});

	it("candles — countback", async () => {
		const rows = await client.stocks.candles("AAPL", { countback: 5 });
		expect(rows.length).toBeLessThanOrEqual(5);
	});
});
