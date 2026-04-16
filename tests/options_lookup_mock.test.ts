import { describe, expect, test } from "vitest";
import { MarketDataClient } from "@/client";
import { fetchMock } from "./setup";
import { createMockResponse, loadMock } from "./test-utils";

describe("Options Lookup Mocks", () => {
	test("lookup", async () => {
		const mockData = loadMock("options_lookup_response_200");
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("options/lookup/AAPL/")) {
				return createMockResponse({ json: mockData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		const client = new MarketDataClient({
			token: "test",
		});

		const result = await client.options.lookup("AAPL");
		expect(result.isOk()).toBe(true);
		if (result.isOk()) {
			expect((result.value as Record<string, unknown>).s).toBe("ok");
			expect((result.value as Record<string, unknown>).optionSymbol).toBe(
				"AAPL230728C00200000",
			);
		}
	});

	test("lookup human readable", async () => {
		const mockData = loadMock("options_lookup_human_response_200");
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("options/lookup/AAPL/")) {
				return createMockResponse({ json: mockData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		const client = new MarketDataClient({
			token: "test",
		});

		const result = await client.options.lookup("AAPL", {
			useHumanReadable: true,
		});

		expect(result.isOk()).toBe(true);
		if (result.isOk()) {
			expect((result.value as Record<string, unknown>).Symbol).toBe(
				"AAPL230728C00200000",
			);
		}
	});
});
