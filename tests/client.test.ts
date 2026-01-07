import { beforeEach, describe, expect, it, vi } from "vitest";
import { MarketDataClient } from "@/client";
import { MarketDataClientErrorResult, RequestError } from "@/error";
import { DateFormat } from "@/types";


const fetchMock = vi.fn();
global.fetch = fetchMock;

describe("MarketDataClient", () => {
	beforeEach(() => {
		fetchMock.mockClear();
	});

	it("initializes with config", () => {

		const client = new MarketDataClient({ token: "test-token" });
		expect(client.token).toBe("test-token");
		expect(client.headers.Authorization).toBe("Bearer test-token");
	});

	describe("stocks.prices", () => {
		it("fetches prices with correct params and aliases", async () => {
			const client = new MarketDataClient({ token: "test-token" });

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ s: "ok", symbol: ["AAPL", "MSFT"] }),
				headers: new Headers(),
			});

			const result = await client.stocks.prices({
				symbols: ["AAPL", "MSFT"],

				dateformat: DateFormat.UNIX,
				headers: true,
			} as any);

			expect(fetchMock).toHaveBeenCalledTimes(1);
			const url = new URL(fetchMock.mock.calls[0][0]);

			expect(url.pathname).toContain("/v1/stocks/prices/");
			expect(url.searchParams.get("symbols")).toBe("AAPL,MSFT");
			expect(url.searchParams.get("dateFormat")).toBe("unix");
			expect(url.searchParams.get("addHeaders")).toBe("true");


			expect(result).toEqual([
				{ s: "ok", symbol: "AAPL" },
				{ s: "ok", symbol: "MSFT" }
			]);
		});

		it("handles validation errors gracefully (returns ErrorResult)", async () => {
			const client = new MarketDataClient();

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
			expect(result).toEqual([{ success: true }]);
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
