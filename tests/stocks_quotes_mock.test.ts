import { describe, expect, it } from "vitest";
import { MarketDataClient } from "@/client";
import { fetchMock } from "./setup";
import { createMockResponse, loadMock } from "./test-utils";

const mockData = loadMock("stocks_quotes_response_200");
const mockHumanData = loadMock("stocks_quotes_human_response_200");

describe("StocksResource Quotes (Mock Data)", () => {
	it("quotes returns correct data structure from mock", async () => {
		const client = new MarketDataClient({ token: "test" });

		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("stocks/bulkquotes/")) {
				return createMockResponse({ json: mockData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		const result = await client.stocks.quotes({ symbols: ["AAPL", "MSFT"] });

		expect(Array.isArray(result)).toBe(true);
		expect(result).toHaveLength(2);

		const aapl = result.find((r) => r.symbol === "AAPL");
		expect(aapl).toBeDefined();
		expect(aapl).toHaveProperty("ask", 278.02);
		expect(aapl).toHaveProperty("bid", 277.97);
		expect(aapl).toHaveProperty("mid", 277.995);
		expect(aapl).toHaveProperty("volume", 4964676);

		const msft = result.find((r) => r.symbol === "MSFT");
		expect(msft).toBeDefined();
		expect(msft).toHaveProperty("ask", 479.45);
		expect(msft).toHaveProperty("bid", 479.37);
	});

	it("quotes returns correct human-readable data structure from mock", async () => {
		const client = new MarketDataClient({ token: "test" });

		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("stocks/bulkquotes/")) {
				return createMockResponse({ json: mockHumanData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		const result = await client.stocks.quotes("AAPL", {
			useHumanReadable: true,
		});

		expect(Array.isArray(result)).toBe(true);
		expect(result).toHaveLength(1);

		const aapl = result[0];
		expect(aapl).toHaveProperty("Symbol", "AAPL");
		expect(aapl).toHaveProperty("Ask", 278.55);
		expect(aapl).toHaveProperty("Bid", 278.54);
		expect(aapl).toHaveProperty("Change_Price", 0.51);
		expect(aapl).toHaveProperty("Change_Percent", 0.0018);
	});

	it("quotes handles symbol as string or array via overload", async () => {
		const client = new MarketDataClient({ token: "test" });

		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("stocks/bulkquotes/")) {
				return createMockResponse({ json: mockData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		const result1 = await client.stocks.quotes("AAPL");
		expect(result1).toBeDefined();

		const result2 = await client.stocks.quotes(["AAPL", "MSFT"]);
		expect(result2).toHaveLength(2);

		const result3 = await client.stocks.quotes({
			symbols: "AAPL",
			"52week": true,
			extended: true,
		});
		expect(result3).toBeDefined();

		const url = new URL(
			fetchMock.mock.calls[fetchMock.mock.calls.length - 1][0],
		);
		expect(url.searchParams.get("52week")).toBe("true");
		expect(url.searchParams.get("extended")).toBe("true");
	});
});
