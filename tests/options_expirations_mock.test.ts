import { describe, expect, test } from "vitest";
import { MarketDataClient } from "@/client";
import { fetchMock } from "./setup";
import { createMockResponse, loadMock } from "./test-utils";

describe("Options Expirations Mocks", () => {
	test("expirations", async () => {
		const mockData = loadMock("options_expirations_response_200");
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("options/expirations/AAPL/")) {
				return createMockResponse({ json: mockData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		const client = new MarketDataClient({ token: "test" });

		const result = await client.options.expirations("AAPL");
		if (!result) throw new Error("expected non-null result");
		expect(result.s).toBe("ok");
		expect(result.expirations).toHaveLength(22);
		expect(result.expirations[0]).toBe("2025-12-05");
	});

	test("expirations human readable", async () => {
		const mockData = loadMock("options_expirations_human_response_200");
		fetchMock.mockImplementation(async (url: string) => {
			if (url.includes("options/expirations/AAPL/")) {
				return createMockResponse({ json: mockData });
			}
			return createMockResponse({ ok: false, status: 404, text: "Not Found" });
		});

		const client = new MarketDataClient({ token: "test" });

		const result = await client.options.expirations("AAPL", {
			useHumanReadable: true,
		});
		if (!result) throw new Error("expected non-null result");
		expect(result.Expirations).toHaveLength(22);
		expect(result.Expirations[0]).toBe("2025-12-12");
	});

	test("expirations 404 resolves to null with no_data:true", async () => {
		// Spec §9.1: 404 surfaces as an empty result with no_data:true,
		// not an exception. Single-object endpoints resolve to null.
		fetchMock.mockImplementation(async () =>
			createMockResponse({ ok: false, status: 404, text: "Not Found" }),
		);
		const client = new MarketDataClient({ token: "test" });
		const pending = client.options.expirations("AAPL");
		const result = await pending;
		expect(result).toBeNull();
		expect(pending.no_data).toBe(true);
	});
});
