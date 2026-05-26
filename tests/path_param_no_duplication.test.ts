/**
 * Regression test for issue #17 — path-bound params must not be
 * forwarded into the query string of resource handlers that
 * interpolate them into the request path.
 *
 * The reference idiom is in `stocks/candles.ts` and `stocks/news.ts`:
 * destructure path-bound keys out of `params` before passing the rest
 * to `_fetch` / `_makeRequest`. Every handler whose endpoint contains
 * `${...}` interpolation must follow that idiom.
 */
import { describe, expect, it } from "vitest";
import { MarketDataClient } from "@/client";
import { fetchMock } from "./setup";
import { createMockResponse, loadMock } from "./test-utils";

function matchingRequestUrls(fragment: string): URL[] {
	return fetchMock.mock.calls
		.map((c) => c[0]?.toString() ?? "")
		.filter((u) => u.includes(fragment))
		.map((u) => new URL(u));
}

function firstMatchingRequestUrl(fragment: string): URL {
	const urls = matchingRequestUrls(fragment);
	expect(urls.length).toBeGreaterThan(0);
	return urls[0];
}

describe("Path-bound params are not duplicated in the query string (#17)", () => {
	const client = new MarketDataClient({ token: "test-token" });

	it("options.chain does not send ?symbol=…", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("options/chain/")) {
				return createMockResponse({
					json: loadMock("options_chain_response_200"),
				});
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		await client.options.chain("AAPL", { expiration: "2026-06-18" });

		const url = firstMatchingRequestUrl("options/chain/AAPL/");
		expect(url.searchParams.has("symbol")).toBe(false);
		expect(url.searchParams.get("expiration")).toBe("2026-06-18");
	});

	it("options.expirations does not send ?symbol=…", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("options/expirations/")) {
				return createMockResponse({
					json: loadMock("options_expirations_response_200"),
				});
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		await client.options.expirations("AAPL");

		const url = firstMatchingRequestUrl("options/expirations/AAPL/");
		expect(url.searchParams.has("symbol")).toBe(false);
	});

	it("options.strikes does not send ?symbol=…", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("options/strikes/")) {
				return createMockResponse({
					json: loadMock("options_strikes_response_200"),
				});
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		await client.options.strikes("AAPL");

		const url = firstMatchingRequestUrl("options/strikes/AAPL/");
		expect(url.searchParams.has("symbol")).toBe(false);
	});

	it("options.lookup does not send ?lookup=…", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("options/lookup/")) {
				return createMockResponse({
					json: loadMock("options_lookup_response_200"),
				});
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		await client.options.lookup("AAPL 7/28/23 $200 Call");

		const url = firstMatchingRequestUrl("options/lookup/");
		expect(url.searchParams.has("lookup")).toBe(false);
	});

	it("options.quotes per-leg URLs do not send ?symbol=… or ?symbols=…", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("options/quotes/")) {
				return createMockResponse({
					json: loadMock("options_quotes_response_200"),
				});
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		await client.options.quotes(["AAPL271217C00255000", "MSFT271217C00255000"]);

		const urls = matchingRequestUrls("options/quotes/");
		expect(urls.length).toBe(2);
		for (const url of urls) {
			expect(url.searchParams.has("symbol")).toBe(false);
			expect(url.searchParams.has("symbols")).toBe(false);
		}
	});

	it("stocks.earnings does not send ?symbol=…", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("stocks/earnings/")) {
				return createMockResponse({
					json: loadMock("stocks_earnings_response_200"),
				});
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		await client.stocks.earnings("AAPL");

		const url = firstMatchingRequestUrl("stocks/earnings/AAPL/");
		expect(url.searchParams.has("symbol")).toBe(false);
	});

	it("funds.candles does not send ?symbol=… or ?resolution=…", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("funds/candles/")) {
				return createMockResponse({
					json: loadMock("funds_candles_response_200"),
				});
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		await client.funds.candles("SPY", { resolution: "D" });

		const url = firstMatchingRequestUrl("funds/candles/");
		expect(url.searchParams.has("symbol")).toBe(false);
		expect(url.searchParams.has("resolution")).toBe(false);
		expect(url.pathname).toContain("/funds/candles/D/SPY/");
	});
});
