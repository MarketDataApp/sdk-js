import { describe, expect, it } from "vitest";
import { MarketDataClient } from "@/client";
import { fetchMock } from "./setup";
import { createMockResponse, loadMock } from "./test-utils";

const mockData = loadMock("stocks_candles_response_200");
const mockHumanData = loadMock("stocks_candles_human_response_200");

describe("StocksResource (Mock Candles)", () => {
	const client = new MarketDataClient({ token: "test-token" });

	it("candles returns correct data structure from mock", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("stocks/candles/")) {
				return createMockResponse({ json: mockData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		const result = await client.stocks.candles({
			symbol: "AAPL",
			resolution: "D",
			from: "2023-01-01",
			to: "2023-01-10",
		});

		expect(result).toBeDefined();
		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBeGreaterThan(0);
		expect(result[0]).toHaveProperty("t");
		expect(result[0]).toHaveProperty("o");
	});

	it("candles returns correct human-readable data structure from mock", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("stocks/candles/")) {
				return createMockResponse({ json: mockHumanData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		const result = await client.stocks.candles({
			symbol: "AAPL",
			resolution: "D",
			from: "2023-01-01",
			to: "2023-01-10",
			useHumanReadable: true,
		});

		expect(result).toBeDefined();
		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBeGreaterThan(0);
		expect(result[0]).toHaveProperty("Date");
		expect(result[0]).toHaveProperty("Open");
	});

	it("candles fan-out exposes save/blob at the Promise boundary", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("stocks/candles/")) {
				return createMockResponse({ json: mockData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		const pending = client.stocks.candles({
			symbol: "AAPL",
			resolution: "D",
			from: "2023-01-01",
			to: "2023-01-10",
		});
		expect(typeof pending.save).toBe("function");
		expect(typeof pending.blob).toBe("function");

		const blob = await pending.blob();
		expect(blob).toBeInstanceOf(Blob);
	});
});
