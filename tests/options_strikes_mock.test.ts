import { describe, expect, it } from "vitest";
import { MarketDataClient } from "@/client";
import { fetchMock } from "./setup";
import { createMockResponse, loadMock } from "./test-utils";

const mockData = loadMock("options_strikes_response_200");
const mockHumanData = loadMock("options_strikes_human_response_200");

describe("OptionsResource (Mock Strikes)", () => {
	const client = new MarketDataClient({ token: "test-token" });

	it("strikes returns correct data structure from mock (internal)", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("options/strikes/")) {
				return createMockResponse({ json: mockData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		const result = await client.options.strikes({
			symbol: "AAPL",
		});

		if (result.isErr()) {
			console.error("Error:", result.error);
			throw new Error(`Unexpected error: ${result.error.message}`);
		}

		const data = result.value;
		expect(data).toBeDefined();
		expect(data.s).toBe("ok");
		expect(data.updated).toBeDefined();
		const keys = Object.keys(data).filter((k) => k !== "s" && k !== "updated");
		expect(keys.length).toBeGreaterThan(0);
		expect(Array.isArray(data[keys[0]])).toBe(true);
	});

	it("strikes returns correct human-readable data structure from mock", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("options/strikes/")) {
				return createMockResponse({ json: mockHumanData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		const result = await client.options.strikes({
			symbol: "AAPL",
			useHumanReadable: true,
		});

		if (result.isErr()) {
			console.error("Full error:", JSON.stringify(result.error, null, 2));
			console.error("Error message:", result.error.message);
			throw new Error(`Test failed with error: ${result.error.message}`);
		}

		const data = result.value;
		expect(data).toBeDefined();
		expect(data.Date).toBeDefined();
		const keys = Object.keys(data).filter((k) => k !== "Date");
		expect(keys.length).toBeGreaterThan(0);
		expect(Array.isArray(data[keys[0]])).toBe(true);
	});

	it("accepts positional symbol", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("options/strikes/AAPL/")) {
				return createMockResponse({ json: mockData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		const result = await client.options.strikes("AAPL");
		expect(result.isOk()).toBe(true);
	});
});
