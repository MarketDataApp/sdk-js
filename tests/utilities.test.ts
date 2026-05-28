import { describe, expect, it } from "vitest";
import { MarketDataClient } from "@/client";
import { NotFoundError } from "@/error";
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

	it("user() 404 throws NotFoundError instead of resolving empty", async () => {
		// /user/ identifies the bearer; a 404 means the account record is gone,
		// which is an integrity error rather than "no data". It must propagate
		// as NotFoundError, opting out of the spec §9 swallow-to-empty path.
		fetchMock.mockImplementation(async () =>
			createMockResponse({ ok: false, status: 404, text: "Not Found" }),
		);
		const client = new MarketDataClient({
			token: "t",
			skipStartupValidation: true,
		});
		await expect(client.utilities.user()).rejects.toBeInstanceOf(NotFoundError);
	});

	it("status() hits /status/ with no auth gating", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("/status/")) {
				// Path-only endpoint — any query string returns 404 from the
				// live API. Regression guard for #21.
				expect(new URL(url).search).toBe("");
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

	it("status() 404 resolves to empty-shape with no_data:true", async () => {
		fetchMock.mockImplementation(async () =>
			createMockResponse({ ok: false, status: 404, text: "Not Found" }),
		);
		const client = new MarketDataClient({ skipStartupValidation: true });
		const pending = client.utilities.status();
		const result = await pending;
		expect(result).toEqual({
			service: [],
			status: [],
			online: [],
			updated: [],
		});
		expect(pending.no_data).toBe(true);
	});

	it("headers() hits /headers/ and returns the echo", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			expect(url).toContain("/headers/");
			// Path-only endpoint — any query string returns 404 from the
			// live API. Regression guard for #21.
			expect(new URL(url).search).toBe("");
			return createMockResponse({
				json: { "user-agent": "marketdata-sdk-javascript/0.0.1" },
			});
		});
		const client = new MarketDataClient({ skipStartupValidation: true });
		const h = await client.utilities.headers();
		expect(h["user-agent"]).toContain("marketdata-sdk-javascript/");
	});

	it("headers() 404 resolves to empty {} with no_data:true", async () => {
		fetchMock.mockImplementation(async () =>
			createMockResponse({ ok: false, status: 404, text: "Not Found" }),
		);
		const client = new MarketDataClient({ skipStartupValidation: true });
		const pending = client.utilities.headers();
		const result = await pending;
		expect(result).toEqual({});
		expect(pending.no_data).toBe(true);
	});
});
