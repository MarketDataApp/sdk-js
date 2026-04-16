import { describe, expect, it } from "vitest";
import { MarketDataClient } from "@/client";
import { fetchMock } from "./setup";
import { createMockResponse, loadMock } from "./test-utils";

const mockData = loadMock("options_chain_response_200");
const mockHumanData = loadMock("options_chain_human_response_200");

describe("OptionsResource (Mock Chain)", () => {
	const client = new MarketDataClient({ token: "test-token" });

	it("chain returns correct data structure from mock (internal)", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("options/chain/")) {
				return createMockResponse({ json: mockData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		const result = await client.options.chain({
			symbol: "AAPL",
		});

		if (result.isErr()) {
			console.error("Error:", result.error);
			throw new Error(`Unexpected error: ${result.error.message}`);
		}

		const data = result.value;
		expect(data).toBeDefined();
		expect(Array.isArray(data)).toBe(true);
		expect(data.length).toBeGreaterThan(0);
		expect(data[0]).toHaveProperty("optionSymbol");
		expect(typeof data[0].optionSymbol).toBe("string");
	});

	it("chain returns correct human-readable data structure from mock", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("options/chain/")) {
				return createMockResponse({ json: mockHumanData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		const result = await client.options.chain({
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
		expect(Array.isArray(data)).toBe(true);
		expect(data.length).toBeGreaterThan(0);
		expect(data[0]).toHaveProperty("Expiration_Date");
		expect(data[0]).toHaveProperty("Option_Side");
		expect(data[0]).not.toHaveProperty("Option Side");
		expect(typeof data[0].Expiration_Date).toBe("number");
	});
});
