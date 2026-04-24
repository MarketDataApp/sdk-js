import { describe, expect, it } from "vitest";
import { FETCH_TIMEOUT_MS, MarketDataClient } from "@/client";
import { NetworkError } from "@/error";
import { fetchMock } from "./setup";

describe("99s fetch timeout", () => {
	it("exports the expected timeout constant", () => {
		expect(FETCH_TIMEOUT_MS).toBe(99_000);
	});

	it("rejects with NetworkError when fetch aborts via timeout", async () => {
		// Simulate an already-timed-out request: resolve the fetch mock with
		// a rejection that mimics an AbortSignal abort.
		fetchMock.mockImplementation(async (_url: string, init?: RequestInit) => {
			if (init?.signal) {
				return new Promise((_, reject) => {
					const s = init.signal as AbortSignal;
					if (s.aborted) {
						const err = new DOMException("Aborted", "AbortError");
						reject(err);
						return;
					}
					s.addEventListener("abort", () => {
						const err = new DOMException("Aborted", "AbortError");
						reject(err);
					});
				});
			}
			return new Response();
		});

		const client = new MarketDataClient({
			token: "t",
			skipStartupValidation: true,
			maxRetries: 0,
		});
		await client.ready;

		// Monkey-patch AbortSignal.timeout to trigger immediately so the test
		// doesn't actually wait 99 seconds.
		const original = AbortSignal.timeout;
		AbortSignal.timeout = () => {
			const ac = new AbortController();
			ac.abort(new DOMException("TimeoutError", "TimeoutError"));
			return ac.signal;
		};
		try {
			await expect(client.stocks.prices("AAPL")).rejects.toBeInstanceOf(
				NetworkError,
			);
		} finally {
			AbortSignal.timeout = original;
		}
	});
});
