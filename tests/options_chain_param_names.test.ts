/**
 * Regression test for issue #19 — OptionsChainInputSchema declared filter
 * parameters under names the live API does not recognise (snake_case, plus
 * `days_to_expiration` where the API wants `dte`). Because the schema is
 * `.passthrough()` the wrong key shipped and the API silently ignored it, so
 * a caller following the SDK's types got an unfiltered chain back.
 *
 * The API names are authoritative per `api/options/chain.mdx`. This asserts
 * that a filtered `chain()` call serializes each documented filter under its
 * live-API name. (Because the schema passes unknown keys through, this is a
 * wire-contract guard rather than a schema-shape guard — it locks the
 * intended query keys and would catch a serialization-layer regression.)
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

describe("options.chain filters ship under their live-API names (#19)", () => {
	const client = new MarketDataClient({ token: "test-token" });

	it("serializes every filter under the name the API recognises", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("options/chain/")) {
				return createMockResponse({
					json: loadMock("options_chain_response_200"),
				});
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		await client.options.chain("AAPL", {
			dte: 30,
			strikeLimit: 10,
			minBid: 0.05,
			maxBid: 50,
			minAsk: 0.05,
			maxAsk: 50,
			maxBidAskSpread: 0.5,
			maxBidAskSpreadPct: 0.1,
			minOpenInterest: 100,
			minVolume: 50,
		});

		const url = firstMatchingRequestUrl("options/chain/AAPL/");
		const sp = url.searchParams;

		// Correct, live-API names are present.
		expect(sp.get("dte")).toBe("30");
		expect(sp.get("strikeLimit")).toBe("10");
		expect(sp.get("minBid")).toBe("0.05");
		expect(sp.get("maxBid")).toBe("50");
		expect(sp.get("minAsk")).toBe("0.05");
		expect(sp.get("maxAsk")).toBe("50");
		expect(sp.get("maxBidAskSpread")).toBe("0.5");
		expect(sp.get("maxBidAskSpreadPct")).toBe("0.1");
		expect(sp.get("minOpenInterest")).toBe("100");
		expect(sp.get("minVolume")).toBe("50");

		// The old, API-ignored names must never ship.
		for (const stale of [
			"days_to_expiration",
			"strike_limit",
			"min_bid",
			"max_bid",
			"min_ask",
			"max_ask",
			"max_bid_ask_spread",
			"max_bid_ask_spread_pct",
			"min_open_interest",
			"min_volume",
		]) {
			expect(sp.has(stale)).toBe(false);
		}
	});
});
