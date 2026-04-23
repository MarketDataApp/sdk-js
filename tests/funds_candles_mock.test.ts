import { describe, expect, it } from "vitest";
import { MarketDataClient } from "@/client";
import { fetchMock } from "./setup";
import { createMockResponse, loadMock } from "./test-utils";

const mockData = loadMock("funds_candles_response_200");
const mockHumanData = loadMock("funds_candles_human_response_200");

describe("FundsResource (Mock Candles)", () => {
	const client = new MarketDataClient({ token: "test-token" });

	it("candles returns correct data structure from mock", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("funds/candles/")) {
				return createMockResponse({ json: mockData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		const result = await client.funds.candles({
			symbol: "VFFVX",
			resolution: "D",
			from: "2020-01-01",
			to: "2020-01-10",
		});

		expect(result).toBeDefined();
		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBeGreaterThan(0);
		expect(result[0]).toHaveProperty("t");
		expect(result[0]).toHaveProperty("o");
		expect(result[0]).not.toHaveProperty("v");
	});

	it("candles returns correct human-readable data structure from mock", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("funds/candles/")) {
				return createMockResponse({ json: mockHumanData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		const result = await client.funds.candles({
			symbol: "VFFVX",
			resolution: "D",
			from: "2020-01-01",
			to: "2020-01-10",
			useHumanReadable: true,
		});

		expect(result).toBeDefined();
		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBeGreaterThan(0);
		expect(result[0]).toHaveProperty("Date");
		expect(result[0]).toHaveProperty("Open");
		expect(result[0]).not.toHaveProperty("Volume");
	});

	it("candles supports (symbol, params) overload", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("funds/candles/D/VFFVX/")) {
				return createMockResponse({ json: mockData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		const result = await client.funds.candles("VFFVX", {
			resolution: "D",
		});

		expect(result).toBeDefined();
		expect(result.length).toBeGreaterThan(0);
	});
});
