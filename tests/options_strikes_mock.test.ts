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

		const data = await client.options.strikes({ symbol: "AAPL" });

		expect(data).toBeDefined();
		if (!data) throw new Error("expected non-null data");
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

		const data = await client.options.strikes({
			symbol: "AAPL",
			useHumanReadable: true,
		});

		expect(data).toBeDefined();
		if (!data) throw new Error("expected non-null data");
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

		const data = await client.options.strikes("AAPL");
		expect(data).toBeDefined();
	});

	it("strikes 404 resolves to empty-shape with no_data:true", async () => {
		fetchMock.mockImplementation(async () =>
			createMockResponse({ ok: false, status: 404, text: "Not Found" }),
		);
		const pending = client.options.strikes("AAPL");
		const result = await pending;
		expect(result).toEqual({ s: "no_data", updated: 0 });
		expect(pending.no_data).toBe(true);
	});

	it("strikes human 404 resolves to empty-shape with no_data:true", async () => {
		fetchMock.mockImplementation(async () =>
			createMockResponse({ ok: false, status: 404, text: "Not Found" }),
		);
		const pending = client.options.strikes("AAPL", { useHumanReadable: true });
		const result = await pending;
		expect(result).toEqual({ Date: 0 });
		expect(pending.no_data).toBe(true);
	});
});
