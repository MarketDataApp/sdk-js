import { beforeEach, describe, expect, it, vi } from "vitest";
import { MarketDataClient } from "@/client";
import { MarketDataClientErrorResult, RequestError } from "@/error";
import { DateFormat } from "@/types";

// Mock fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe("MarketDataClient", () => {
	beforeEach(() => {
		fetchMock.mockClear();
	});

	it("initializes with config", () => {
		// We can use 'token' because MarketDataClient constructor maps it to 'marketdataToken'
		const client = new MarketDataClient({ token: "test-token" });
		expect(client.token).toBe("test-token");
		expect(client.headers.Authorization).toBe("Bearer test-token");
	});

	describe("stocks.prices", () => {
		it("fetches prices with correct params and aliases", async () => {
			const client = new MarketDataClient({ token: "test-token" });

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ status: "ok", data: [] }),
				headers: new Headers(),
			});

			const result = await client.stocks.prices({
				symbols: ["AAPL", "MSFT"],
				// Test Aliases
				dateformat: DateFormat.UNIX,
				headers: true,
			} as any);

			expect(fetchMock).toHaveBeenCalledTimes(1);
			const url = new URL(fetchMock.mock.calls[0][0]);

			expect(url.pathname).toContain("/v1/stocks/prices/");
			expect(url.searchParams.get("symbols")).toBe("AAPL,MSFT");
			expect(url.searchParams.get("dateFormat")).toBe("unix"); // Aliased
			expect(url.searchParams.get("addHeaders")).toBe("true"); // Aliased
			expect(result).toEqual({ status: "ok", data: [] });
		});

		it("handles validation errors gracefully (returns ErrorResult)", async () => {
			const client = new MarketDataClient();

			// Invalid symbols input (should be string or array of strings, passing number)
			const result = await client.stocks.prices({
				symbols: 123 as any,
			});

			expect(result).toBeInstanceOf(MarketDataClientErrorResult);
			if (result instanceof MarketDataClientErrorResult) {
				expect(result.error.name).toBe("ZodError");
			}
		});

		it("retries on failure", async () => {
			const client = new MarketDataClient();

			// Fail twice, succeed third time
			fetchMock
				.mockResolvedValueOnce({
					ok: false,
					status: 500,
					text: () => Promise.resolve("Error"),
					headers: new Headers(),
				})
				.mockResolvedValueOnce({
					ok: false,
					status: 500,
					text: () => Promise.resolve("Error"),
					headers: new Headers(),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve({ success: true }),
					headers: new Headers(),
				});

			const result = await client.stocks.prices({ symbols: "AAPL" });

			expect(fetchMock).toHaveBeenCalledTimes(3);
			expect(result).toEqual({ success: true });
		});

		it("returns error result after max retries", async () => {
			const client = new MarketDataClient();

			fetchMock.mockResolvedValue({
				ok: false,
				status: 500,
				text: () => Promise.resolve("Fail"),
				headers: new Headers(),
			});

			const result = await client.stocks.prices({ symbols: "AAPL" });

			expect(fetchMock).toHaveBeenCalledTimes(4);
			expect(result).toBeInstanceOf(MarketDataClientErrorResult);
			if (result instanceof MarketDataClientErrorResult) {
				expect(result.error).toBeInstanceOf(RequestError);
			}
		});
	});
});
