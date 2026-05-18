import { describe, expect, it } from "vitest";
import { MarketDataClient } from "@/client";
import {
	AuthenticationError,
	BadRequestError,
	ForbiddenError,
	MarketDataClientError,
	NetworkError,
	NotFoundError,
	ParseError,
	PaymentRequiredError,
	RateLimitError,
	RequestError,
	ServerError,
	ValidationError,
} from "@/error";
import { fetchMock } from "./setup";
import { createMockResponse } from "./test-utils";

describe("error hierarchy", () => {
	it("every class extends MarketDataClientError", () => {
		for (const Cls of [
			AuthenticationError,
			BadRequestError,
			PaymentRequiredError,
			ForbiddenError,
			NotFoundError,
			RateLimitError,
			ServerError,
			NetworkError,
			ParseError,
			ValidationError,
			RequestError,
		]) {
			const e = new Cls("boom");
			expect(e).toBeInstanceOf(MarketDataClientError);
			expect(e.name).toBe(Cls.name);
			expect(e.exception_type).toBe(Cls.name);
		}
	});

	it("RequestError is a deprecated alias of NetworkError", () => {
		expect(new RequestError("x")).toBeInstanceOf(NetworkError);
	});

	it("preserves HTTP context fields", () => {
		const ts = new Date("2026-04-24T16:30:12Z");
		const err = new BadRequestError("bad", {
			request_id: "abc-SJC",
			status_code: 400,
			request_url: "https://api.marketdata.app/v1/stocks/quotes/$$$",
			timestamp: ts,
		});
		expect(err.request_id).toBe("abc-SJC");
		expect(err.status_code).toBe(400);
		expect(err.request_url).toBe(
			"https://api.marketdata.app/v1/stocks/quotes/$$$",
		);
		expect(err.timestamp).toBe(ts);
	});

	it("defaults timestamp to now when context omits it", () => {
		const before = Date.now();
		const err = new ServerError("down");
		const after = Date.now();
		expect(err.timestamp.getTime()).toBeGreaterThanOrEqual(before);
		expect(err.timestamp.getTime()).toBeLessThanOrEqual(after);
	});

	it("support_info assembles metadata into a support-ticket string", () => {
		const err = new RateLimitError("rate limit exceeded", {
			request_id: "8a1b-SJC",
			status_code: 429,
			request_url: "https://api.marketdata.app/v1/stocks/prices/AAPL/",
			timestamp: new Date("2026-04-24T16:30:12Z"),
		});
		const info = err.support_info;
		expect(info).toContain("[MarketData SDK] Request failed");
		expect(info).toContain("Exception:    RateLimitError");
		expect(info).toContain("Message:      rate limit exceeded");
		expect(info).toContain("Status Code:  429");
		expect(info).toContain(
			"Request URL:  https://api.marketdata.app/v1/stocks/prices/AAPL/",
		);
		expect(info).toContain("Request ID:   8a1b-SJC");
		expect(info).toMatch(
			/Timestamp:\s+\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} \w+/,
		);
	});

	it("support_info omits missing fields", () => {
		const err = new ValidationError("bad input");
		const info = err.support_info;
		expect(info).toContain("Exception:    ValidationError");
		expect(info).toContain("Message:      bad input");
		expect(info).not.toContain("Status Code:");
		expect(info).not.toContain("Request URL:");
		expect(info).not.toContain("Request ID:");
		expect(info).toContain("Timestamp:");
	});
});

describe("error hierarchy — wired into client", () => {
	it("maps 401 to AuthenticationError with cf-ray and status_code", async () => {
		const client = new MarketDataClient({ token: "bad-token" });
		fetchMock.mockImplementation(async () =>
			createMockResponse({
				ok: false,
				status: 401,
				text: '{"s":"error","errmsg":"Unauthorized"}',
				headers: { "cf-ray": "8a1b2c3d4e5f6g7h-SJC" },
			}),
		);
		await expect(
			client.stocks.prices({ symbols: "AAPL", skipRateLimitCheck: true }),
		).rejects.toBeInstanceOf(AuthenticationError);

		fetchMock.mockImplementation(async () =>
			createMockResponse({
				ok: false,
				status: 401,
				text: '{"s":"error","errmsg":"Unauthorized"}',
				headers: { "cf-ray": "8a1b2c3d4e5f6g7h-SJC" },
			}),
		);
		try {
			await client.stocks.prices({ symbols: "AAPL", skipRateLimitCheck: true });
			throw new Error("expected rejection");
		} catch (e) {
			expect(e).toBeInstanceOf(AuthenticationError);
			const err = e as AuthenticationError;
			expect(err.request_id).toBe("8a1b2c3d4e5f6g7h-SJC");
			expect(err.status_code).toBe(401);
		}
	});

	it("maps 400 to BadRequestError", async () => {
		const client = new MarketDataClient({ token: "t" });
		fetchMock.mockImplementation(async () =>
			createMockResponse({
				ok: false,
				status: 400,
				text: '{"s":"error","errmsg":"bad symbol"}',
			}),
		);
		await expect(
			client.stocks.prices({ symbols: "$$$", skipRateLimitCheck: true }),
		).rejects.toBeInstanceOf(BadRequestError);
	});

	it("404 resolves as no_data rather than throwing NotFoundError", async () => {
		// Per spec §5 / ADR decision, 404 is "no data" — the SDK returns an
		// empty result with `no_data: true` instead of throwing. The
		// NotFoundError class is still exported for callers who want to
		// opt into a throw (via custom interceptor, etc.).
		fetchMock.mockImplementation(async () =>
			createMockResponse({
				ok: false,
				status: 404,
				text: '{"s":"no_data"}',
			}),
		);
		const client = new MarketDataClient({ token: "t" });
		await client.ready;
		const pending = client.stocks.prices({ symbols: "AAPL" });
		const data = await pending;
		expect(data).toEqual([]);
		expect(pending.no_data).toBe(true);
		expect(await pending.hasData()).toBe(false);
		// The class is still instantiable for consumers who want it:
		expect(new NotFoundError("x")).toBeInstanceOf(NotFoundError);
	});

	it("maps 402 to PaymentRequiredError", async () => {
		const client = new MarketDataClient({ token: "t" });
		fetchMock.mockImplementation(async () =>
			createMockResponse({
				ok: false,
				status: 402,
				text: '{"s":"error","errmsg":"Plan does not include this endpoint"}',
			}),
		);
		await expect(
			client.stocks.prices({ symbols: "AAPL", skipRateLimitCheck: true }),
		).rejects.toBeInstanceOf(PaymentRequiredError);
	});

	it("maps 403 to ForbiddenError (multi-IP block)", async () => {
		const client = new MarketDataClient({ token: "t" });
		fetchMock.mockImplementation(async () =>
			createMockResponse({
				ok: false,
				status: 403,
				text: '{"s":"error","errmsg":"Account temporarily blocked: multiple IPs"}',
			}),
		);
		await expect(
			client.stocks.prices({ symbols: "AAPL", skipRateLimitCheck: true }),
		).rejects.toBeInstanceOf(ForbiddenError);
	});

	it("maps 413 to BadRequestError", async () => {
		const client = new MarketDataClient({ token: "t" });
		fetchMock.mockImplementation(async () =>
			createMockResponse({
				ok: false,
				status: 413,
				text: '{"s":"error","errmsg":"Payload too large"}',
			}),
		);
		await expect(
			client.stocks.prices({ symbols: "AAPL", skipRateLimitCheck: true }),
		).rejects.toBeInstanceOf(BadRequestError);
	});

	it("maps malformed JSON in a 200 response to ParseError, not NetworkError", async () => {
		const client = new MarketDataClient({ token: "t" });
		fetchMock.mockImplementation(async () => ({
			ok: true,
			status: 200,
			headers: new Headers(),
			json: async () => {
				throw new SyntaxError("Unexpected token < in JSON at position 0");
			},
			text: async () => "<html>upstream proxy garbled this</html>",
		}));
		await expect(
			client.stocks.prices({ symbols: "AAPL", skipRateLimitCheck: true }),
		).rejects.toBeInstanceOf(ParseError);
	});
});
