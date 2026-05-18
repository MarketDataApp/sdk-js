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

	it("candles fan-out: all ranges 404 → [] + no_data:true", async () => {
		// Intraday + >365-day span forces multi-leg fan-out
		fetchMock.mockImplementation(async () =>
			createMockResponse({ ok: false, status: 404, text: "Not Found" }),
		);
		const pending = client.stocks.candles({
			symbol: "AAPL",
			resolution: "H",
			from: "2020-01-01",
			to: "2023-01-01",
		});
		const result = await pending;
		expect(result).toEqual([]);
		expect(pending.no_data).toBe(true);
	});

	it("candles fan-out: mixed 404+200 → real data preserved, no_data:false", async () => {
		// First range returns 404, subsequent ranges return real candles.
		// mergeResponses should keep only the real data; the empty-columnar
		// leg contributes nothing to the flatMap.
		let callCount = 0;
		fetchMock.mockImplementation(async () => {
			callCount++;
			if (callCount === 1) {
				return createMockResponse({
					ok: false,
					status: 404,
					text: "Not Found",
				});
			}
			return createMockResponse({ json: mockData });
		});
		const pending = client.stocks.candles({
			symbol: "AAPL",
			resolution: "H",
			from: "2020-01-01",
			to: "2023-01-01",
		});
		const result = await pending;
		expect(callCount).toBeGreaterThan(1);
		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBeGreaterThan(0);
		expect(result[0]).toHaveProperty("t");
		// No row should have undefined columns from the sentinel leg
		for (const row of result) {
			expect(row.t).toBeDefined();
			expect(row.o).toBeDefined();
		}
		expect(pending.no_data).toBe(false);
	});
});
