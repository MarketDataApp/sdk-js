import { describe, expect, it } from "vitest";
import { MarketDataClient } from "@/client";
import { DateFormat } from "@/enums";
import { ServerError, ValidationError } from "@/error";
import { fetchMock } from "./setup";
import { createMockResponse } from "./test-utils";

describe("MarketDataClient", () => {
	it("initializes with config", () => {
		const client = new MarketDataClient({ token: "test-token" });
		expect(client.token).toBe("test-token");
		expect(client.headers.Authorization).toBe("Bearer test-token");
	});

	describe("stocks.prices", () => {
		it("fetches prices with correct params and aliases", async () => {
			const client = new MarketDataClient({ token: "test-token" });

			fetchMock.mockImplementation(async (url: string) => {
				if (url.includes("/user/") && !url.includes("v1/user/")) {
					return createMockResponse({
						headers: {
							"x-api-ratelimit-limit": "100",
							"x-api-ratelimit-remaining": "100",
							"x-api-ratelimit-reset": "0",
							"x-api-ratelimit-consumed": "0",
						},
					});
				}
				if (url.includes("/v1/stocks/prices/")) {
					return createMockResponse({
						json: {
							s: "ok",
							symbol: ["AAPL", "MSFT"],
							mid: [150, 250],
							change: [1.5, 2.5],
							changepct: [0.01, 0.01],
							updated: [1700000000, 1700000000],
						},
					});
				}
				return createMockResponse({ ok: false, status: 404 });
			});

			const result = await client.stocks.prices({
				symbols: ["AAPL", "MSFT"],

				dateformat: DateFormat.UNIX,
				headers: true,
			});

			expect(fetchMock).toHaveBeenCalledTimes(2);
			const url = new URL(fetchMock.mock.calls[1][0]);

			expect(url.pathname).toContain("/v1/stocks/prices/");
			expect(url.searchParams.get("symbols")).toBe("AAPL,MSFT");
			expect(url.searchParams.get("dateformat")).toBe("unix");
			expect(url.searchParams.get("headers")).toBe("true");

			expect(result).toEqual([
				{
					symbol: "AAPL",
					mid: 150,
					change: 1.5,
					changepct: 0.01,
					updated: 1700000000,
				},
				{
					symbol: "MSFT",
					mid: 250,
					change: 2.5,
					changepct: 0.01,
					updated: 1700000000,
				},
			]);
		});

		it("fetches human-readable prices", async () => {
			const client = new MarketDataClient({ token: "test-token" });

			fetchMock.mockImplementation(async (url: string) => {
				if (url.includes("/user/") && !url.includes("v1/user/"))
					return createMockResponse();
				if (url.includes("/v1/stocks/prices/")) {
					return createMockResponse({
						json: {
							s: "ok",
							Symbol: ["AAPL"],
							Mid: [150],
							"Change $": [1.5],
							"Change %": [0.01],
							Date: [1700000000],
						},
					});
				}
				return createMockResponse({ ok: false, status: 404 });
			});

			const result = await client.stocks.prices({
				symbols: "AAPL",
				useHumanReadable: true,
			});

			expect(result).toEqual([
				{
					Symbol: "AAPL",
					Mid: 150,
					Change_Price: 1.5,
					Change_Percent: 0.01,
					Date: 1700000000,
				},
			]);
		});

		it("throws ValidationError on invalid params", async () => {
			const client = new MarketDataClient();

			await expect(
				client.stocks.prices({
					symbols: 123 as unknown as string,
				}),
			).rejects.toBeInstanceOf(ValidationError);
		});

		it("retries on failure", async () => {
			const client = new MarketDataClient({ maxRetries: 2 });

			let stockPriceCallCount = 0;
			fetchMock.mockImplementation(async (url: string) => {
				if (url.includes("/user/") && !url.includes("v1/user/")) {
					return createMockResponse({
						headers: {
							"x-api-ratelimit-limit": "100",
							"x-api-ratelimit-remaining": "100",
							"x-api-ratelimit-reset": "0",
							"x-api-ratelimit-consumed": "0",
						},
					});
				}

				if (url.includes("/status/")) {
					return createMockResponse({
						json: {
							service: ["/v1/stocks/prices/"],
							status: ["online"],
							online: [true],
							updated: [Date.now()],
						},
					});
				}

				if (url.includes("stocks/prices")) {
					stockPriceCallCount++;
					if (stockPriceCallCount <= 2) {
						return createMockResponse({
							ok: false,
							status: 502,
							text: "Error",
						});
					}
					return createMockResponse({
						json: {
							s: "ok",
							symbol: ["AAPL"],
							mid: [150],
							change: [1.5],
							changepct: [0.01],
							updated: [1700000000],
						},
					});
				}

				return createMockResponse({ ok: false, status: 404 });
			});

			const result = await client.stocks.prices({ symbols: "AAPL" });

			expect(stockPriceCallCount).toBe(3);
			expect(result).toEqual([
				{
					symbol: "AAPL",
					mid: 150,
					change: 1.5,
					changepct: 0.01,
					updated: 1700000000,
				},
			]);
		});

		it("throws ServerError after max retries on 5xx", async () => {
			const client = new MarketDataClient({ token: "test-token" });

			fetchMock.mockImplementation(async (url: string) => {
				if (url.includes("/user/") && !url.includes("v1/user/")) {
					return createMockResponse({
						headers: {
							"x-api-ratelimit-limit": "100",
							"x-api-ratelimit-remaining": "100",
							"x-api-ratelimit-reset": "0",
							"x-api-ratelimit-consumed": "0",
						},
					});
				}
				if (url.includes("/status/")) {
					return createMockResponse({
						json: {
							service: ["/v1/stocks/prices/"],
							status: ["online"],
							online: [true],
							updated: [Date.now()],
						},
					});
				}
				return createMockResponse({ ok: false, status: 502, text: "Fail" });
			});

			await expect(
				client.stocks.prices({ symbols: "AAPL" }),
			).rejects.toBeInstanceOf(ServerError);
			expect(fetchMock).toHaveBeenCalledTimes(5);
		});
	});
});
