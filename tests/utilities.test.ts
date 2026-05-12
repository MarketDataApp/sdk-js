import { describe, expect, it } from "vitest";
import { MarketDataClient } from "@/client";
import { fetchMock } from "./setup";
import { createMockResponse } from "./test-utils";

describe("utilities namespace", () => {
	it("user() hits /user/ (no version prefix) and returns the payload", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			expect(url).toContain("/user/");
			expect(url).not.toContain("/v1/");
			return createMockResponse({
				json: {
					id: "abc",
					plan: "starter",
					limit: 10000,
					remaining: 9876,
					consumed: 124,
					reset: 1700000000,
				},
				headers: {
					"x-api-ratelimit-limit": "10000",
					"x-api-ratelimit-remaining": "9876",
					"x-api-ratelimit-reset": "0",
					"x-api-ratelimit-consumed": "124",
				},
			});
		});

		const client = new MarketDataClient({
			token: "t",
			skipStartupValidation: true,
		});
		const u = await client.utilities.user();
		expect(u.plan).toBe("starter");
		expect(u.remaining).toBe(9876);
	});

	it("status() hits /status/ with no auth gating", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("/status/")) {
				return createMockResponse({
					json: {
						service: ["/v1/stocks/prices/"],
						status: ["online"],
						online: [true],
						updated: [Math.floor(Date.now() / 1000)],
					},
				});
			}
			return createMockResponse({ json: {} });
		});
		const client = new MarketDataClient({ skipStartupValidation: true });
		const s = await client.utilities.status();
		expect(s.online[0]).toBe(true);
	});

	it("headers() hits /headers/ and returns the echo", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			expect(url).toContain("/headers/");
			return createMockResponse({
				json: { "user-agent": "marketdata-sdk-javascript/0.0.1" },
			});
		});
		const client = new MarketDataClient({ skipStartupValidation: true });
		const h = await client.utilities.headers();
		expect(h["user-agent"]).toContain("marketdata-sdk-javascript/");
	});
});
