import { describe, expect, it } from "vitest";
import { MarketDataClient } from "@/client";
import { AuthenticationError } from "@/error";
import { fetchMock } from "./setup";
import { createMockResponse } from "./test-utils";

describe("eager startup validation", () => {
	it("awaits /user/ from the constructor and populates rateLimits", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("/user/")) {
				return createMockResponse({
					json: { id: "u" },
					headers: {
						"x-api-ratelimit-limit": "1000",
						"x-api-ratelimit-remaining": "999",
						"x-api-ratelimit-reset": "0",
						"x-api-ratelimit-consumed": "1",
					},
				});
			}
			return createMockResponse({ json: {} });
		});
		const client = new MarketDataClient({ token: "t" });
		await client.ready;
		expect(client.rateLimits?.requestsRemaining).toBe(999);
	});

	it("rejects `ready` with AuthenticationError on bad token", async () => {
		fetchMock.mockImplementation(async () =>
			createMockResponse({
				ok: false,
				status: 401,
				text: '{"s":"error","errmsg":"Unauthorized"}',
			}),
		);
		const client = new MarketDataClient({ token: "bad" });
		await expect(client.ready).rejects.toBeInstanceOf(AuthenticationError);
	});

	it("does not emit unhandledRejection when `ready` rejects and caller never awaits it", async () => {
		fetchMock.mockImplementation(async () =>
			createMockResponse({
				ok: false,
				status: 401,
				text: '{"s":"error","errmsg":"Unauthorized"}',
			}),
		);

		const unhandled: unknown[] = [];
		const handler = (reason: unknown) => unhandled.push(reason);
		process.on("unhandledRejection", handler);
		try {
			const client = new MarketDataClient({ token: "bad" });
			// Flush enough ticks for the /user/ fetch and downstream throw to
			// settle. If the constructor failed to attach a synchronous catch,
			// Node would emit unhandledRejection by now.
			await new Promise((r) => setImmediate(r));
			await new Promise((r) => setImmediate(r));
			expect(unhandled).toEqual([]);
			// Rejection is still observable to consumers who do await `ready`.
			await expect(client.ready).rejects.toBeInstanceOf(AuthenticationError);
		} finally {
			process.off("unhandledRejection", handler);
		}
	});

	it("swallows transient startup failures so subsequent requests can retry", async () => {
		let first = true;
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("/user/") && first) {
				first = false;
				return createMockResponse({ ok: false, status: 503, text: "down" });
			}
			return createMockResponse({
				json: { s: "ok", symbol: ["AAPL"], mid: [150], updated: [1] },
				headers: { "x-api-ratelimit-remaining": "100" },
			});
		});
		const client = new MarketDataClient({ token: "t" });
		// Transient startup failure should NOT reject `ready` — only Auth
		// errors are fatal at startup per ADR-008.
		await expect(client.ready).resolves.toBeUndefined();
	});

	it("skipStartupValidation=true bypasses /user/", async () => {
		let userHit = false;
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("/user/")) userHit = true;
			return createMockResponse({ json: {} });
		});
		const client = new MarketDataClient({
			token: "t",
			skipStartupValidation: true,
		});
		await client.ready;
		expect(userHit).toBe(false);
	});

	it("no token ⇒ no startup call", async () => {
		// `.env` may populate MARKETDATA_TOKEN; isolate this test from that.
		const originalToken = process.env.MARKETDATA_TOKEN;
		delete process.env.MARKETDATA_TOKEN;
		try {
			let anyHit = false;
			fetchMock.mockImplementation(async () => {
				anyHit = true;
				return createMockResponse({ json: {} });
			});
			const client = new MarketDataClient();
			await client.ready;
			expect(anyHit).toBe(false);
		} finally {
			if (originalToken !== undefined)
				process.env.MARKETDATA_TOKEN = originalToken;
		}
	});
});
