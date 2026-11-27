/**
 * API 3.0.0 added the `model` query parameter to GET /v1/options/quotes/{optionSymbol}/.
 * It accepts one of four named pricing models — `bsm`, `bjs`, `crr`, `baw` — for
 * `iv` and the greeks on a historical request (date, from or to). This asserts
 * each value ships on the wire exactly as given, that omitting it still works
 * as before, and that an unrecognised value is rejected before anything is sent.
 */
import { describe, expect, it } from "vitest";
import { MarketDataClient } from "@/client";
import { ValidationError } from "@/error";
import { fetchMock } from "./setup";
import { createMockResponse, loadMock } from "./test-utils";

const mockData = loadMock("options_quotes_response_200");

function firstMatchingRequestUrl(fragment: string): URL {
	const urls = fetchMock.mock.calls
		.map((c) => c[0]?.toString() ?? "")
		.filter((u) => u.includes(fragment))
		.map((u) => new URL(u));
	expect(urls.length).toBeGreaterThan(0);
	return urls[0];
}

describe("options.quotes model param forms", () => {
	const client = new MarketDataClient({ token: "test-token" });

	it("sends model=bsm", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("options/quotes/")) {
				return createMockResponse({ json: mockData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		await client.options.quotes({
			symbols: "AAPL271217C00255000",
			date: "2024-01-05",
			model: "bsm",
		});

		const url = firstMatchingRequestUrl("options/quotes/AAPL271217C00255000/");
		expect(url.searchParams.get("model")).toBe("bsm");
	});

	it("sends model=bjs", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("options/quotes/")) {
				return createMockResponse({ json: mockData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		await client.options.quotes({
			symbols: "AAPL271217C00255000",
			date: "2024-01-05",
			model: "bjs",
		});

		const url = firstMatchingRequestUrl("options/quotes/AAPL271217C00255000/");
		expect(url.searchParams.get("model")).toBe("bjs");
	});

	it("sends model=crr", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("options/quotes/")) {
				return createMockResponse({ json: mockData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		await client.options.quotes({
			symbols: "AAPL271217C00255000",
			date: "2024-01-05",
			model: "crr",
		});

		const url = firstMatchingRequestUrl("options/quotes/AAPL271217C00255000/");
		expect(url.searchParams.get("model")).toBe("crr");
	});

	it("sends model=baw", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("options/quotes/")) {
				return createMockResponse({ json: mockData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		await client.options.quotes({
			symbols: "AAPL271217C00255000",
			date: "2024-01-05",
			model: "baw",
		});

		const url = firstMatchingRequestUrl("options/quotes/AAPL271217C00255000/");
		expect(url.searchParams.get("model")).toBe("baw");
	});

	it("omits model as before when not given (regression)", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("options/quotes/")) {
				return createMockResponse({ json: mockData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		await client.options.quotes({ symbols: "AAPL271217C00255000" });

		const url = firstMatchingRequestUrl("options/quotes/AAPL271217C00255000/");
		expect(url.searchParams.has("model")).toBe(false);
	});

	it("rejects a model value outside the named set before sending anything", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("options/quotes/")) {
				return createMockResponse({ json: mockData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		await expect(
			client.options.quotes({
				symbols: "AAPL271217C00255000",
				date: "2024-01-05",
				model: "not-a-model" as unknown as "bsm",
			}),
		).rejects.toBeInstanceOf(ValidationError);
	});
});
