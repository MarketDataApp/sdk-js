import { describe, expect, it } from "vitest";
import { MarketDataClient } from "@/client";
import { fetchMock } from "./setup";
import { createMockResponse, loadMock } from "./test-utils";

const mockData = loadMock("stocks_news_response_200");
const mockHumanData = loadMock("stocks_news_human_response_200");

describe("StocksResource News (Mock Data)", () => {
	it("news returns correct data structure from mock", async () => {
		const client = new MarketDataClient({ token: "test" });

		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("stocks/news/")) {
				return createMockResponse({ json: mockData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		const result = await client.stocks.news({ symbol: "AAPL" });

		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBeGreaterThan(0);

		const news = result[0];
		expect(news).toHaveProperty("symbol", "AAPL");
		expect(news).toHaveProperty("headline");
		expect(news).toHaveProperty("content");
		expect(news).toHaveProperty("source");
		expect(news).toHaveProperty("publicationDate");
		expect(news).toHaveProperty("updated");
	});

	it("news returns correct human-readable data structure from mock", async () => {
		const client = new MarketDataClient({ token: "test" });

		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("stocks/news/")) {
				return createMockResponse({ json: mockHumanData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		const result = await client.stocks.news({
			symbol: "AAPL",
			useHumanReadable: true,
		});

		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBeGreaterThan(0);

		const news = result[0];
		expect(news).toHaveProperty("Symbol", "AAPL");
		expect(news).toHaveProperty("headline");
		expect(news).toHaveProperty("content");
		expect(news).toHaveProperty("source");
		expect(news).toHaveProperty("publicationDate");
		expect(news).toHaveProperty("Date");
	});

	it("news works with overload (symbol, params)", async () => {
		const client = new MarketDataClient({ token: "test" });

		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("stocks/news/AAPL/")) {
				return createMockResponse({ json: mockData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		const result = await client.stocks.news("AAPL", {});
		expect(Array.isArray(result)).toBe(true);
		expect(result[0].symbol).toBe("AAPL");
	});
});
