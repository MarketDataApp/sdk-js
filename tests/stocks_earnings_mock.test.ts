import { describe, expect, it } from "vitest";
import { MarketDataClient } from "@/client";
import { fetchMock } from "./setup";
import { createMockResponse, loadMock } from "./test-utils";

const mockData = loadMock("stocks_earnings_response_200");
const mockHumanData = loadMock("stocks_earnings_human_response_200");

describe("StocksResource (Mock Earnings)", () => {
	it("earnings returns correct data structure from mock", async () => {
		const client = new MarketDataClient({ token: "test" });

		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("stocks/earnings/AAPL/")) {
				return createMockResponse({ json: mockData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		const result = await client.stocks.earnings("AAPL");

		expect(Array.isArray(result)).toBe(true);
		expect(result).toHaveLength(2);

		const first = result[0];
		expect(first).toHaveProperty("symbol", "AAPL");
		expect(first).toHaveProperty("reportedEPS", null);
		expect(first).toHaveProperty("estimatedEPS", 2.67);
	});

	it("earnings returns correct human-readable data structure from mock", async () => {
		const client = new MarketDataClient({ token: "test" });

		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("stocks/earnings/AAPL/")) {
				return createMockResponse({ json: mockHumanData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		const result = await client.stocks.earnings("AAPL", {
			useHumanReadable: true,
		});

		expect(Array.isArray(result)).toBe(true);
		expect(result).toHaveLength(2);

		const first = result[0];
		expect(first).toHaveProperty("Symbol", "AAPL");
		expect(first).toHaveProperty("Reported_EPS", null);
		expect(first).toHaveProperty("Estimated_EPS", 2.67);
		expect(first).toHaveProperty("Surprise_EPS_Percent", null);
	});
});
