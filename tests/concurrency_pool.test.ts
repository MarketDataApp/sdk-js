import { describe, expect, it } from "vitest";
import { MarketDataClient } from "@/client";
import { MAX_CONCURRENT_REQUESTS } from "@/internalSettings";
import { fetchMock } from "./setup";
import { createMockResponse } from "./test-utils";

describe("global concurrency pool", () => {
	it("caps in-flight requests at MAX_CONCURRENT_REQUESTS across all endpoints", async () => {
		let inflight = 0;
		let peak = 0;
		const fanout = MAX_CONCURRENT_REQUESTS * 3; // 150 concurrent requests

		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("/user/")) {
				return createMockResponse({
					json: {},
					headers: {
						"x-api-ratelimit-limit": "100000",
						"x-api-ratelimit-remaining": "100000",
						"x-api-ratelimit-reset": "0",
						"x-api-ratelimit-consumed": "0",
					},
				});
			}

			inflight += 1;
			peak = Math.max(peak, inflight);
			await new Promise((r) => setTimeout(r, 10));
			inflight -= 1;

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
					"x-api-ratelimit-remaining": "100000",
					"x-api-ratelimit-consumed": "0",
					"x-api-ratelimit-reset": "0",
					"x-api-ratelimit-limit": "100000",
				},
			});
		});

		const client = new MarketDataClient({ token: "t" });
		await client.ready;

		await Promise.all(
			Array.from({ length: fanout }, () =>
				client.stocks.prices({ symbols: "AAPL" }),
			),
		);

		expect(peak).toBeLessThanOrEqual(MAX_CONCURRENT_REQUESTS);
		expect(peak).toBeGreaterThan(1); // confirm the test actually ran in parallel
	});

	it("options.quotes fan-out shares the same pool", async () => {
		let inflight = 0;
		let peak = 0;

		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("/user/")) {
				return createMockResponse({
					json: {},
					headers: {
						"x-api-ratelimit-limit": "100000",
						"x-api-ratelimit-remaining": "100000",
						"x-api-ratelimit-reset": "0",
						"x-api-ratelimit-consumed": "0",
					},
				});
			}

			inflight += 1;
			peak = Math.max(peak, inflight);
			await new Promise((r) => setTimeout(r, 10));
			inflight -= 1;

			return createMockResponse({
				json: {
					s: "ok",
					optionSymbol: ["AAPL250620C00150000"],
					underlying: ["AAPL"],
					expiration: [1719014400],
					side: ["call"],
					strike: [150],
					bid: [1],
					ask: [1.1],
					mid: [1.05],
					last: [1.03],
					bidSize: [10],
					askSize: [10],
					volume: [100],
					openInterest: [1000],
					updated: [1700000000],
				},
				headers: {
					"x-api-ratelimit-remaining": "100000",
					"x-api-ratelimit-consumed": "0",
					"x-api-ratelimit-reset": "0",
					"x-api-ratelimit-limit": "100000",
				},
			});
		});

		const client = new MarketDataClient({ token: "t" });
		await client.ready;

		const symbols = Array.from(
			{ length: MAX_CONCURRENT_REQUESTS * 2 },
			(_, i) => `AAPL25062000000000${i}`,
		);

		await client.options.quotes({ symbols }).catch(() => undefined);

		expect(peak).toBeLessThanOrEqual(MAX_CONCURRENT_REQUESTS);
	});
});
