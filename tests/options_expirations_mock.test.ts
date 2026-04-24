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
		expect(result.Expirations).toHaveLength(22);
		expect(result.Expirations[0]).toBe("2025-12-12");
	});

	test("expirations returns no_data sentinel on 404", async () => {
		// Mock default is a 404 for options paths; per spec §5 that now
		// resolves to `{s: "no_data"}` rather than throwing.
		const client = new MarketDataClient({ token: "test" });
		const result = await client.options.expirations("AAPL");
		expect(result.s).toBe("no_data");
	});
});
