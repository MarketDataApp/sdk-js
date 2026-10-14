import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MarketDataClient } from "@/client";
import { BadRequestError } from "@/error";
import { saveBlobToFile } from "@/fileUtils";
import type { Logger, LogLevel } from "@/logger";
import { encodePathSegment, transformHumanKeys } from "@/utils";
import { fetchMock } from "./setup";
import { createMockResponse } from "./test-utils";

class CapturingLogger implements Logger {
	public messages: string[] = [];
	debug(message: string): void {
		this.messages.push(message);
	}
	info(message: string): void {
		this.messages.push(message);
	}
	warn(message: string): void {
		this.messages.push(message);
	}
	error(message: string): void {
		this.messages.push(message);
	}
	setLogLevel(_level: LogLevel): void {}
}

describe("security hardening", () => {
	describe("encodePathSegment", () => {
		it("leaves valid symbols unchanged", () => {
			expect(encodePathSegment("AAPL")).toBe("AAPL");
			expect(encodePathSegment("BRK.B")).toBe("BRK.B");
			expect(encodePathSegment("AAPL250117C00150000")).toBe(
				"AAPL250117C00150000",
			);
			expect(encodePathSegment("D")).toBe("D");
		});

		it("neutralizes path traversal and delimiter characters", () => {
			expect(encodePathSegment("../user")).toBe("..%2Fuser");
			expect(encodePathSegment("AAPL/extra")).toBe("AAPL%2Fextra");
			expect(encodePathSegment("AAPL?x=1")).toBe("AAPL%3Fx%3D1");
			expect(encodePathSegment("AAPL#frag")).toBe("AAPL%23frag");
		});
	});

	describe("path injection", () => {
		it("keeps a traversal-attempt symbol inside the endpoint path", async () => {
			const client = new MarketDataClient({ token: "test" });
			await client.ready;
			fetchMock.mockClear();

			// "account" (not "user"/"status") so the shared fetch mock's substring
			// routing can't accidentally match the smuggled segment.
			await client.stocks.earnings("AAPL/../../account");

			const urls = fetchMock.mock.calls.map((c) => String(c[0]));
			expect(urls.length).toBeGreaterThan(0);
			for (const url of urls) {
				expect(new URL(url).pathname.startsWith("/v1/stocks/earnings/")).toBe(
					true,
				);
			}
		});

		it("keeps a traversal-attempt options symbol inside the endpoint path", async () => {
			const client = new MarketDataClient({ token: "test" });
			await client.ready;
			fetchMock.mockClear();

			await client.options.expirations("SPX/../../account");

			const urls = fetchMock.mock.calls.map((c) => String(c[0]));
			expect(urls.length).toBeGreaterThan(0);
			for (const url of urls) {
				expect(
					new URL(url).pathname.startsWith("/v1/options/expirations/"),
				).toBe(true);
			}
		});
	});

	describe("transformHumanKeys prototype safety", () => {
		it("treats a hostile __proto__ key as inert data", () => {
			// The key transform collapses "__" to "_", so "____proto____" is the
			// hostile spelling that lands on "__proto__" after transformation.
			// JSON.parse creates it as an own property, exactly like a hostile
			// API response body would arrive.
			const hostile = JSON.parse(
				'{"____proto____": {"polluted": true}, "Close $": 1}',
			) as Record<string, unknown>;

			const out = transformHumanKeys(hostile);

			expect(Object.getPrototypeOf(out)).toBe(Object.prototype);
			expect(
				(Object.prototype as Record<string, unknown>).polluted,
			).toBeUndefined();
			expect((out as { polluted?: unknown }).polluted).toBeUndefined();
			expect(Object.getOwnPropertyDescriptor(out, "__proto__")?.value).toEqual({
				polluted: true,
			});
			expect(out.Close_Price).toBe(1);
		});
	});

	describe("token log redaction", () => {
		it("fully masks short tokens in the init debug log", () => {
			const logger = new CapturingLogger();
			new MarketDataClient({ token: "abcd", logger });
			const joined = logger.messages.join("\n");
			expect(joined).not.toContain("abcd");
			expect(joined).toContain("Token: ****");
		});

		it("reveals only the last 4 characters of a long token", () => {
			const logger = new CapturingLogger();
			const token = "secret-token-value-1234";
			new MarketDataClient({ token, logger });
			const joined = logger.messages.join("\n");
			expect(joined).not.toContain(token);
			expect(joined).toContain(`${"*".repeat(token.length - 4)}1234`);
		});
	});

	describe("error body bounding", () => {
		it("truncates an oversized errmsg from a hostile response", async () => {
			const client = new MarketDataClient({ token: "test" });
			await client.ready;

			const hugeMessage = "x".repeat(100_000);
			fetchMock.mockImplementation(async () =>
				createMockResponse({
					ok: false,
					status: 400,
					json: { errmsg: hugeMessage },
				}),
			);

			const error = await client.stocks
				.earnings("AAPL")
				.then(() => null)
				.catch((e: unknown) => e);

			expect(error).toBeInstanceOf(BadRequestError);
			expect((error as BadRequestError).message.length).toBeLessThan(700);
			expect((error as BadRequestError).message).toContain("truncated");
		});
	});

	describe("saveBlobToFile exclusive write", () => {
		it("refuses to overwrite an existing file", async () => {
			const dir = await mkdtemp(join(tmpdir(), "sdk-sec-"));
			const target = join(dir, "existing.csv");
			await writeFile(target, "original");

			const blob = new Blob(["a,b\n1,2\n"], { type: "text/csv" });
			await expect(saveBlobToFile(blob, target)).rejects.toThrow(
				/already exists/,
			);
			expect(await readFile(target, "utf-8")).toBe("original");
		});
	});
});
