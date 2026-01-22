import { describe, expect, it, vi } from "vitest";
import { MarketDataClient } from "@/client";

describe("Arbitrary Parameters", () => {
	it("should pass arbitrary parameters to the URL", async () => {
		const client = new MarketDataClient({ token: "test_token" });

		const fetchMock = vi.fn().mockImplementation(async (url) => {
			console.log(`Captured fetch call to: ${url}`);
			return {
				ok: true,
				json: async () => ({ status: "success", data: [] }),
				headers: new Headers({ "content-type": "application/json" }),
			};
		});
		global.fetch = fetchMock;

		// We pass a custom parameter. TypeScript should allow this because
		// the params type extends MarketDataParams which has an index signature.
		await client.stocks.quotes("AAPL", { custom_param: "custom_value" });

		const calls = fetchMock.mock.calls;
		const quotesCall = calls.find((call) =>
			call[0].includes("stocks/bulkquotes"),
		);

		if (!quotesCall) {
			console.log(
				"Captured URLs:",
				calls.map((c) => c[0]),
			);
		}

		expect(quotesCall).toBeDefined();
		expect(quotesCall![0]).toContain("custom_param=custom_value");
	});
});
