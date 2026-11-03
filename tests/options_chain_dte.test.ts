/**
 * `dte` on `options.chain` changed from an integer to a string in API 2.0.0.
 * It still accepts a single value, and now also accepts a comma-separated
 * list, a closed range, and a comparison operator — the same syntax `strike`
 * and `delta` already use.
 */
import { describe, expect, it } from "vitest";
import { MarketDataClient } from "@/client";
import { fetchMock } from "./setup";
import { createMockResponse, loadMock } from "./test-utils";

function firstMatchingRequestUrl(fragment: string): URL {
	const urls = fetchMock.mock.calls
		.map((c) => c[0]?.toString() ?? "")
		.filter((u) => u.includes(fragment))
		.map((u) => new URL(u));
	expect(urls.length).toBeGreaterThan(0);
	return urls[0];
}

describe("options.chain dte filter (API 2.0.0: integer -> string)", () => {
	const client = new MarketDataClient({ token: "test-token" });

	it("regression: a single numeric value still ships as-is", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("options/chain/")) {
				return createMockResponse({
					json: loadMock("options_chain_response_200"),
				});
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		await client.options.chain({ symbol: "AAPL", dte: 30 });

		const url = firstMatchingRequestUrl("options/chain/AAPL/");
		expect(url.searchParams.get("dte")).toBe("30");
	});

	it("accepts a comma-separated list of values", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("options/chain/")) {
				return createMockResponse({
					json: loadMock("options_chain_response_200"),
				});
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		await client.options.chain({ symbol: "AAPL", dte: "15,30,45" });

		const url = firstMatchingRequestUrl("options/chain/AAPL/");
		expect(url.searchParams.get("dte")).toBe("15,30,45");
	});

	it("accepts a closed range", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("options/chain/")) {
				return createMockResponse({
					json: loadMock("options_chain_response_200"),
				});
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		await client.options.chain({ symbol: "AAPL", dte: "0-45" });

		const url = firstMatchingRequestUrl("options/chain/AAPL/");
		expect(url.searchParams.get("dte")).toBe("0-45");
	});

	it("accepts a >= comparison operator", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("options/chain/")) {
				return createMockResponse({
					json: loadMock("options_chain_response_200"),
				});
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		await client.options.chain({ symbol: "AAPL", dte: ">=30" });

		const url = firstMatchingRequestUrl("options/chain/AAPL/");
		expect(url.searchParams.get("dte")).toBe(">=30");
	});

	it("accepts a < comparison operator", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("options/chain/")) {
				return createMockResponse({
					json: loadMock("options_chain_response_200"),
				});
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		await client.options.chain({ symbol: "AAPL", dte: "<45" });

		const url = firstMatchingRequestUrl("options/chain/AAPL/");
		expect(url.searchParams.get("dte")).toBe("<45");
	});
});
