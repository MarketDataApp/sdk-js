import { describe, expect, it } from "vitest";
import { MarketDataClient } from "@/client";
import type { UserRateLimits } from "@/types";
import { fetchMock } from "./setup";
import { createMockResponse } from "./test-utils";

describe("rate-limit race-condition fix", () => {
	describe("_updateRateLimits — monotonic snapshot guard", () => {
		it("discards a stale snapshot within the same window", () => {
			const client = new MarketDataClient({ token: "test-token" });
			const priv = client as unknown as {
				_updateRateLimits(h: Headers): void;
				rateLimits?: UserRateLimits;
			};

			priv._updateRateLimits(
				new Headers({
					"x-api-ratelimit-limit": "100",
					"x-api-ratelimit-remaining": "98",
					"x-api-ratelimit-reset": "1000",
					"x-api-ratelimit-consumed": "2",
				}),
			);
			expect(client.rateLimits?.requestsConsumed).toBe(2);

			// Late-arriving response from an earlier in-flight request:
			// lower consumed, same window → ignore.
			priv._updateRateLimits(
				new Headers({
					"x-api-ratelimit-limit": "100",
					"x-api-ratelimit-remaining": "100",
					"x-api-ratelimit-reset": "1000",
					"x-api-ratelimit-consumed": "0",
				}),
			);
			expect(client.rateLimits?.requestsConsumed).toBe(2);
			expect(client.rateLimits?.requestsRemaining).toBe(98);
		});

		it("accepts a fresher snapshot within the same window", () => {
			const client = new MarketDataClient({ token: "test-token" });
			const priv = client as unknown as {
				_updateRateLimits(h: Headers): void;
				rateLimits?: UserRateLimits;
			};

			priv._updateRateLimits(
				new Headers({
					"x-api-ratelimit-limit": "100",
					"x-api-ratelimit-remaining": "98",
					"x-api-ratelimit-reset": "1000",
					"x-api-ratelimit-consumed": "2",
				}),
			);

			priv._updateRateLimits(
				new Headers({
					"x-api-ratelimit-limit": "100",
					"x-api-ratelimit-remaining": "95",
					"x-api-ratelimit-reset": "1000",
					"x-api-ratelimit-consumed": "5",
				}),
			);
			expect(client.rateLimits?.requestsConsumed).toBe(5);
			expect(client.rateLimits?.requestsRemaining).toBe(95);
		});

		it("accepts a new window even if consumed is lower (reset bumped)", () => {
			const client = new MarketDataClient({ token: "test-token" });
			const priv = client as unknown as {
				_updateRateLimits(h: Headers): void;
				rateLimits?: UserRateLimits;
			};

			priv._updateRateLimits(
				new Headers({
					"x-api-ratelimit-limit": "100",
					"x-api-ratelimit-remaining": "5",
					"x-api-ratelimit-reset": "1000",
					"x-api-ratelimit-consumed": "95",
				}),
			);

			// Window rolled over — lower consumed, higher reset.
			priv._updateRateLimits(
				new Headers({
					"x-api-ratelimit-limit": "100",
					"x-api-ratelimit-remaining": "100",
					"x-api-ratelimit-reset": "2000",
					"x-api-ratelimit-consumed": "0",
				}),
			);
			expect(client.rateLimits?.requestsConsumed).toBe(0);
			expect(client.rateLimits?.requestsRemaining).toBe(100);
			expect(client.rateLimits?.requestsReset).toBe(2000);
		});

		it("ignores a snapshot from a prior window (reset went backwards)", () => {
			const client = new MarketDataClient({ token: "test-token" });
			const priv = client as unknown as {
				_updateRateLimits(h: Headers): void;
				rateLimits?: UserRateLimits;
			};

			priv._updateRateLimits(
				new Headers({
					"x-api-ratelimit-limit": "100",
					"x-api-ratelimit-remaining": "100",
					"x-api-ratelimit-reset": "2000",
					"x-api-ratelimit-consumed": "0",
				}),
			);

			// Stale response straddling window rollover — reset is from prior
			// window; must not overwrite the new-window snapshot.
			priv._updateRateLimits(
				new Headers({
					"x-api-ratelimit-limit": "100",
					"x-api-ratelimit-remaining": "1",
					"x-api-ratelimit-reset": "1000",
					"x-api-ratelimit-consumed": "99",
				}),
			);
			expect(client.rateLimits?.requestsReset).toBe(2000);
			expect(client.rateLimits?.requestsConsumed).toBe(0);
		});
	});

	describe("concurrent reservation — prevents TOCTOU over-dispatch", () => {
		it("blocks dispatch beyond `remaining` when N > remaining requests fan out", async () => {
			const client = new MarketDataClient({ token: "test-token" });

			let pricesCallCount = 0;
			fetchMock.mockImplementation(async (url: string) => {
				if (url.includes("/user/") && !url.includes("v1/user/")) {
					return createMockResponse({
						json: {},
						headers: {
							"x-api-ratelimit-limit": "100",
							"x-api-ratelimit-remaining": "2",
							"x-api-ratelimit-reset": "0",
							"x-api-ratelimit-consumed": "0",
						},
					});
				}
				if (url.includes("/v1/stocks/prices/")) {
					pricesCallCount += 1;
					return createMockResponse({
						json: {
							s: "ok",
							symbol: ["AAPL"],
							mid: [150],
							change: [0],
							changepct: [0],
							updated: [1700000000],
						},
						headers: {
							"x-api-ratelimit-limit": "100",
							"x-api-ratelimit-remaining": String(2 - pricesCallCount),
							"x-api-ratelimit-reset": "0",
							"x-api-ratelimit-consumed": String(pricesCallCount),
						},
					});
				}
				return createMockResponse({ ok: false, status: 404 });
			});

			const results = await Promise.all([
				client.stocks.prices({ symbols: "AAPL" }),
				client.stocks.prices({ symbols: "MSFT" }),
				client.stocks.prices({ symbols: "GOOGL" }),
			]);

			const oks = results.filter((r) => r.isOk());
			const errs = results.filter((r) => r.isErr());

			expect(oks.length).toBe(2);
			expect(errs.length).toBe(1);
			for (const e of errs) {
				if (e.isErr()) expect(e.error.name).toBe("RateLimitError");
			}

			// Only the two dispatchable requests actually hit the network.
			expect(pricesCallCount).toBe(2);
		});

		it("releases reserved credit after a successful request", async () => {
			const client = new MarketDataClient({ token: "test-token" });

			fetchMock.mockImplementation(async (url: string) => {
				if (url.includes("/user/") && !url.includes("v1/user/")) {
					return createMockResponse({
						json: {},
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
							symbol: ["AAPL"],
							mid: [150],
							change: [0],
							changepct: [0],
							updated: [1700000000],
						},
						headers: {
							"x-api-ratelimit-limit": "100",
							"x-api-ratelimit-remaining": "99",
							"x-api-ratelimit-reset": "0",
							"x-api-ratelimit-consumed": "1",
						},
					});
				}
				return createMockResponse({ ok: false, status: 404 });
			});

			const priv = client as unknown as { _inflightReservedCredits: number };

			const result = await client.stocks.prices({ symbols: "AAPL" });
			expect(result.isOk()).toBe(true);
			expect(priv._inflightReservedCredits).toBe(0);
		});

		it("releases reserved credit after a 5xx failure (retries exhausted)", async () => {
			const client = new MarketDataClient({
				token: "test-token",
				maxRetries: 0,
			});

			fetchMock.mockImplementation(async (url: string) => {
				if (url.includes("/user/") && !url.includes("v1/user/")) {
					return createMockResponse({
						json: {},
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
				return createMockResponse({
					ok: false,
					status: 502,
					text: "Bad Gateway",
				});
			});

			const priv = client as unknown as { _inflightReservedCredits: number };

			const result = await client.stocks.prices({ symbols: "AAPL" });
			expect(result.isErr()).toBe(true);
			expect(priv._inflightReservedCredits).toBe(0);
		});

		it("releases reserved credit after a 429 (no retry)", async () => {
			const client = new MarketDataClient({ token: "test-token" });

			fetchMock.mockImplementation(async (url: string) => {
				if (url.includes("/user/") && !url.includes("v1/user/")) {
					return createMockResponse({
						json: {},
						headers: {
							"x-api-ratelimit-limit": "100",
							"x-api-ratelimit-remaining": "100",
							"x-api-ratelimit-reset": "0",
							"x-api-ratelimit-consumed": "0",
						},
					});
				}
				return createMockResponse({
					ok: false,
					status: 429,
					text: "Rate limit exceeded",
				});
			});

			const priv = client as unknown as { _inflightReservedCredits: number };

			const result = await client.stocks.prices({ symbols: "AAPL" });
			expect(result.isErr()).toBe(true);
			expect(priv._inflightReservedCredits).toBe(0);
		});
	});
});
