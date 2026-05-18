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

		const client = new MarketDataClient({ token: "test" });

		const result = (await client.options.lookup("AAPL")) as Record<
			string,
			unknown
		>;
		expect(result.s).toBe("ok");
		expect(result.optionSymbol).toBe("AAPL230728C00200000");
	});

	test("lookup human readable", async () => {
		const mockData = loadMock("options_lookup_human_response_200");
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("options/lookup/AAPL/")) {
				return createMockResponse({ json: mockData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		const client = new MarketDataClient({ token: "test" });

		const result = (await client.options.lookup("AAPL", {
			useHumanReadable: true,
		})) as Record<string, unknown>;

		expect(result.Symbol).toBe("AAPL230728C00200000");
	});

	test("lookup 404 resolves to empty-shape with no_data:true", async () => {
		fetchMock.mockImplementation(async () =>
			createMockResponse({ ok: false, status: 404, text: "Not Found" }),
		);
		const client = new MarketDataClient({ token: "test" });
		const pending = client.options.lookup("AAPL");
		const result = await pending;
		expect(result).toEqual({ s: "no_data", optionSymbol: "" });
		expect(pending.no_data).toBe(true);
	});

	test("lookup human 404 resolves to empty-shape with no_data:true", async () => {
		fetchMock.mockImplementation(async () =>
			createMockResponse({ ok: false, status: 404, text: "Not Found" }),
		);
		const client = new MarketDataClient({ token: "test" });
		const pending = client.options.lookup("AAPL", { useHumanReadable: true });
		const result = await pending;
		expect(result).toEqual({ s: "no_data", Symbol: "" });
		expect(pending.no_data).toBe(true);
	});
});
