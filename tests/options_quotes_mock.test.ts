import { describe, expect, it } from "vitest";
import { MarketDataClient } from "@/client";
import { fetchMock } from "./setup";
import { createMockResponse, loadMock } from "./test-utils";

const mockData = loadMock("options_quotes_response_200");
const mockHumanData = loadMock("options_quotes_human_response_200");

describe("OptionsResource (Mock Quotes)", () => {
	const client = new MarketDataClient({ token: "test-token" });

	it("quotes returns correct data structure from mock (internal)", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("options/quotes/")) {
				return createMockResponse({ json: mockData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		const data = await client.options.quotes({
			symbols: "AAPL271217C00255000",
		});

		expect(data).toBeDefined();
		expect(Array.isArray(data)).toBe(true);
		expect(data.length).toBeGreaterThan(0);
		expect(data[0]).toHaveProperty("optionSymbol");
		expect(typeof data[0].optionSymbol).toBe("string");
	});

	it("quotes returns correct human-readable data structure from mock", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("options/quotes/")) {
				return createMockResponse({ json: mockHumanData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		const data = await client.options.quotes({
			symbols: ["AAPL271217C00255000"],
			useHumanReadable: true,
		});

		expect(data).toBeDefined();
		expect(Array.isArray(data)).toBe(true);
		expect(data.length).toBeGreaterThan(0);
		expect(data[0]).toHaveProperty("Expiration_Date");
		expect(data[0]).toHaveProperty("Option_Side");
		expect(data[0]).not.toHaveProperty("Option Side");
		expect(typeof data[0].Expiration_Date).toBe("number");
	});

	it("quotes handles multiple symbols by making multiple requests", async () => {
		let callCount = 0;
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("options/quotes/")) {
				callCount++;
				return createMockResponse({ json: mockData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		const symbols = ["AAPL271217C00255000", "MSFT271217C00255000"];
		const data = await client.options.quotes(symbols);

		expect(callCount).toBe(2);
		expect(data.length).toBe(2);
	});

	it("quotes fan-out exposes save/blob at the Promise boundary", async () => {
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("options/quotes/")) {
				return createMockResponse({ json: mockData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		const pending = client.options.quotes({
			symbols: "AAPL271217C00255000",
		});
		expect(typeof pending.save).toBe("function");
		expect(typeof pending.blob).toBe("function");

		const blob = await pending.blob();
		expect(blob).toBeInstanceOf(Blob);
	});
});
