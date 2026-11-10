/**
 * API 2.0.0 changed the `dte` query parameter of GET /v1/options/chain/{underlying}/
 * from integer to string. The new string form accepts a comma-separated list,
 * a closed range, and a comparison operator, in addition to the single value
 * the SDK already sent as a number. This asserts each accepted form ships on
 * the wire exactly as given, and that the pre-existing numeric form still works.
 */
import { describe, expect, it } from "vitest";
import { MarketDataClient } from "@/client";
import { fetchMock } from "./setup";
import { createMockResponse, loadMock } from "./test-utils";

const mockData = loadMock("options_chain_response_200");

function firstMatchingRequestUrl(fragment: string): URL {
	const urls = fetchMock.mock.calls
		.map((c) => c[0]?.toString() ?? "")
		.filter((u) => u.includes(fragment))
		.map((u) => new URL(u));
	expect(urls.length).toBeGreaterThan(0);
	return urls[0];
}

describe("options.chain dte filter forms", () => {
	const client = new MarketDataClient({ token: "test-token" });

	it("sends a single numeric value as before (regression)", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("options/chain/")) {
				return createMockResponse({ json: mockData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		await client.options.chain({ symbol: "AAPL", dte: 30 });

		const url = firstMatchingRequestUrl("options/chain/AAPL/");
		expect(url.searchParams.get("dte")).toBe("30");
	});

	it("sends a single value given as a string", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("options/chain/")) {
				return createMockResponse({ json: mockData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		await client.options.chain({ symbol: "AAPL", dte: "30" });

		const url = firstMatchingRequestUrl("options/chain/AAPL/");
		expect(url.searchParams.get("dte")).toBe("30");
	});

	it("sends a comma-separated list of values", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("options/chain/")) {
				return createMockResponse({ json: mockData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		await client.options.chain({ symbol: "AAPL", dte: "15,30,45" });

		const url = firstMatchingRequestUrl("options/chain/AAPL/");
		expect(url.searchParams.get("dte")).toBe("15,30,45");
	});

	it("sends a closed range", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("options/chain/")) {
				return createMockResponse({ json: mockData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		await client.options.chain({ symbol: "AAPL", dte: "0-45" });

		const url = firstMatchingRequestUrl("options/chain/AAPL/");
		expect(url.searchParams.get("dte")).toBe("0-45");
	});

	it("sends a >= comparison operator", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("options/chain/")) {
				return createMockResponse({ json: mockData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		await client.options.chain({ symbol: "AAPL", dte: ">=30" });

		const url = firstMatchingRequestUrl("options/chain/AAPL/");
		expect(url.searchParams.get("dte")).toBe(">=30");
	});

	it("sends a < comparison operator", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("options/chain/")) {
				return createMockResponse({ json: mockData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		await client.options.chain({ symbol: "AAPL", dte: "<45" });

		const url = firstMatchingRequestUrl("options/chain/AAPL/");
		expect(url.searchParams.get("dte")).toBe("<45");
	});
});
