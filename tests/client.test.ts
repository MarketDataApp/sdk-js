import { describe, expect, it } from "vitest";
import { MarketDataClient } from "@/client";
import { MarketDataClientErrorResult, RequestError } from "@/error";
import { DateFormat } from "@/types";
import { fetchMock } from "./setup";

describe("MarketDataClient", () => {

	it("initializes with config", () => {

		const client = new MarketDataClient({ token: "test-token" });
		expect(client.token).toBe("test-token");
		expect(client.headers.Authorization).toBe("Bearer test-token");
	});

	describe("stocks.prices", () => {
		it("fetches prices with correct params and aliases", async () => {
			const client = new MarketDataClient({ token: "test-token" });

			fetchMock.mockImplementation((url: string) => {
				if (url.includes("/user/")) {
					return Promise.resolve({
						ok: true,
						json: async () => ({}),
						headers: new Headers({
							"x-api-ratelimit-limit": "100",
							"x-api-ratelimit-remaining": "100",
							"x-api-ratelimit-reset": "0",
							"x-api-ratelimit-consumed": "0",
						}),
					});
				}
				if (url.includes("stocks/prices/")) {
					return Promise.resolve({
						ok: true,
						json: async () => ({
							s: "ok",
							symbol: ["AAPL", "MSFT"],
							mid: [150, 250],
							change: [1.5, 2.5],
							changepct: [0.01, 0.01],
							updated: [1700000000, 1700000000],
						}),
						headers: new Headers(),
					});
				}
				return Promise.resolve({
					ok: false,
					status: 404,
					headers: new Headers(),
				});
			});

			const result = await client.stocks.prices({
				symbols: ["AAPL", "MSFT"],

				dateformat: DateFormat.UNIX,
				headers: true,
			} as any);

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

			fetchMock.mockImplementation((url: string) => {
				if (url.includes("/user/")) {
					return Promise.resolve({
						ok: true,
						json: async () => ({}),
						headers: new Headers(),
					});
				}
				if (url.includes("stocks/prices/")) {
					return Promise.resolve({
						ok: true,
						json: async () => ({
							s: "ok",
							Symbol: ["AAPL"],
							Mid: [150],
							"Change $": [1.5],
							"Change %": [0.01],
							Date: [1700000000],
						}),
						headers: new Headers(),
					});
				}
				return Promise.resolve({
					ok: false,
					status: 404,
					headers: new Headers(),
				});
			});

			const result = await client.stocks.prices({
				symbols: "AAPL",
				useHumanReadable: true,
			} as any);

			expect(result).toEqual([
				{
					Symbol: "AAPL",
					Mid: 150,
					"Change $": 1.5,
					"Change %": 0.01,
					Date: 1700000000,
				},
			]);
		});

		it("handles validation errors gracefully (returns ErrorResult)", async () => {
			const client = new MarketDataClient();

			const result = await client.stocks.prices({
				symbols: 123 as any,
			});

			expect(result).toBeInstanceOf(MarketDataClientErrorResult);
			if (result instanceof MarketDataClientErrorResult) {
				expect(result.error.name).toBe("ZodError");
			}
		});

		it("retries on failure", async () => {
			const client = new MarketDataClient({ maxRetries: 2 }); // 1 initial + 2 retries = 3 attempts total

			let stockPriceCallCount = 0;
			fetchMock.mockImplementation((url: string) => {
				// Handle /user/ calls (rate limit setup)
				if (url.includes("/user/")) {
					return Promise.resolve({
						ok: true,
						json: () => Promise.resolve({}),
						headers: new Headers({
							"x-api-ratelimit-limit": "100",
							"x-api-ratelimit-remaining": "100",
							"x-api-ratelimit-reset": "0",
							"x-api-ratelimit-consumed": "0",
						}),
					});
				}

				// Handle /status/ calls (service status check)
				if (url.includes("/status/")) {
					return Promise.resolve({
						ok: true,
						json: () => Promise.resolve({
							service: ["stocks/prices/"],
							status: ["online"],
							online: [true],
							updated: [Date.now()],
						}),
						headers: new Headers(),
					});
				}

				// Handle stocks/prices calls: fail first 2, succeed on 3rd
				if (url.includes("stocks/prices")) {
					stockPriceCallCount++;
					if (stockPriceCallCount <= 2) {
						return Promise.resolve({
							ok: false,
							status: 500,
							text: () => Promise.resolve("Error"),
							headers: new Headers(),
						});
					}
					return Promise.resolve({
						ok: true,
						json: () => Promise.resolve({
							s: "ok",
							symbol: ["AAPL"],
							mid: [150],
							change: [1.5],
							changepct: [0.01],
							updated: [1700000000],
						}),
						headers: new Headers(),
					});
				}

				return Promise.resolve({
					ok: false,
					status: 404,
					headers: new Headers(),
				});
			});

			const result = await client.stocks.prices({ symbols: "AAPL" });

			expect(stockPriceCallCount).toBe(3); // 1 initial + 2 retries
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

		it("returns error result after max retries", async () => {
			const client = new MarketDataClient({ token: "test-token" });

			fetchMock.mockImplementation((url: string) => {
				if (url.includes("/status/")) {
					return Promise.resolve({
						ok: true,
						json: () =>
							Promise.resolve({
								service: ["stocks/prices/"],
								status: ["online"],
								online: [true],
								updated: [Date.now()],
							}),
					});
				}
				return Promise.resolve({
					ok: false,
					status: 500,
					text: () => Promise.resolve("Fail"),
					headers: new Headers(),
				});
			});

			const result = await client.stocks.prices({ symbols: "AAPL" });

			expect(fetchMock).toHaveBeenCalledTimes(8); // 4 stocks/prices + 4 /user/ or /status/
			expect(result).toBeInstanceOf(MarketDataClientErrorResult);
			if (result instanceof MarketDataClientErrorResult) {
				expect(result.error).toBeInstanceOf(RequestError);
			}
		});
	});
});
