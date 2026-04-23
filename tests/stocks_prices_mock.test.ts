import { describe, expect, it } from "vitest";
import { MarketDataClient } from "@/client";
import { fetchMock } from "./setup";
import { createMockResponse, loadMock } from "./test-utils";

const mockData = loadMock("stocks_prices_response_200");
const mockHumanData = loadMock("stocks_prices_human_response_200");

describe("StocksResource (Mock Data)", () => {
	it("prices returns correct data structure from mock", async () => {
		const client = new MarketDataClient({ token: "test" });

		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("stocks/prices/")) {
				return createMockResponse({ json: mockData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		const result = await client.stocks.prices({ symbols: ["AAPL", "TSLA"] });

		expect(Array.isArray(result)).toBe(true);
		expect(result).toHaveLength(2);

		const aapl = result.find((r) => r.symbol === "AAPL");
		expect(aapl).toBeDefined();
		expect(aapl).toHaveProperty("mid", 280.02);

		const tsla = result.find((r) => r.symbol === "TSLA");
		expect(tsla).toBeDefined();
		expect(tsla).toHaveProperty("mid", 455.76);
	});

	it("prices returns correct human-readable data structure from mock", async () => {
		const client = new MarketDataClient({ token: "test" });

		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("stocks/prices/")) {
				return createMockResponse({ json: mockHumanData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		const result = await client.stocks.prices({
			symbols: ["AAPL"],
			useHumanReadable: true,
		});

		expect(Array.isArray(result)).toBe(true);
		expect(result).toHaveLength(2);

		const aapl = result[0];
		expect(aapl).toHaveProperty("Symbol", "AAPL");
		expect(aapl).toHaveProperty("Mid", 278.72);
		expect(aapl).toHaveProperty("Change_Price", 0.69);

		const tsla = result[1];
		expect(tsla).toHaveProperty("Symbol", "TSLA");
		expect(tsla).toHaveProperty("Mid", 455.66);
	});
});
