import { describe, expect, it, vi } from "vitest";
import { MarketDataClient } from "@/client";

const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock("../src/fileUtils", () => ({
	saveBlobToFile: vi.fn().mockResolvedValue("/tmp/out"),
}));

const userMock = {
	ok: true,
	headers: new Headers({
		"x-api-ratelimit-limit": "1000",
		"x-api-ratelimit-remaining": "1000",
		"x-api-ratelimit-reset": "0",
		"x-api-ratelimit-consumed": "0",
	}),
	json: async () => ({ id: "u" }),
};

describe("response model methods on MarketDataPromise", () => {
	it("isJson() true for the default format", async () => {
		mockFetch.mockResolvedValueOnce(userMock);
		mockFetch.mockResolvedValueOnce({
			ok: true,
			headers: new Headers(),
			json: async () => ({
				s: "ok",
				symbol: ["AAPL"],
				mid: [150],
				change: [0],
				changepct: [0],
				updated: [1700000000],
			}),
		});

		const client = new MarketDataClient({ token: "t" });
		await client.ready;

		const pending = client.stocks.prices("AAPL");
		expect(pending.isJson()).toBe(true);
		expect(pending.isCsv()).toBe(false);
		expect(pending.isHtml()).toBe(false);
		const data = await pending;
		expect(data).toHaveLength(1);
		expect(await pending.hasData()).toBe(true);
	});

	it("isCsv() true when outputFormat is csv", async () => {
		mockFetch.mockResolvedValueOnce(userMock);
		mockFetch.mockResolvedValueOnce({
			ok: true,
			headers: new Headers({ "content-type": "text/csv" }),
			blob: async () => new Blob(["s,p\nAAPL,150"], { type: "text/csv" }),
		});

		const client = new MarketDataClient({ token: "t" });
		await client.ready;

		const pending = client.stocks.prices("AAPL", { outputFormat: "csv" });
		expect(pending.isCsv()).toBe(true);
		expect(pending.isJson()).toBe(false);
		const blob = await pending;
		expect(blob).toBeInstanceOf(Blob);
	});

	it("no_data + hasData() false after a 404", async () => {
		mockFetch.mockResolvedValueOnce(userMock);
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 404,
			headers: new Headers(),
			text: async () => '{"s":"no_data"}',
			json: async () => ({ s: "no_data" }),
		});

		const client = new MarketDataClient({ token: "t" });
		await client.ready;

		const pending = client.stocks.prices("AAPL");
		const data = await pending;
		expect(data).toEqual([]);
		expect(pending.no_data).toBe(true);
		expect(await pending.hasData()).toBe(false);
	});

	it("saveToFile() is an alias for save()", async () => {
		mockFetch.mockResolvedValueOnce(userMock);
		mockFetch.mockResolvedValueOnce({
			ok: true,
			headers: new Headers({ "content-type": "text/csv" }),
			blob: async () => new Blob(["x"], { type: "text/csv" }),
		});

		const client = new MarketDataClient({ token: "t" });
		await client.ready;

		const path = await client.stocks
			.prices("AAPL", { outputFormat: "csv" })
			.saveToFile("out.csv");
		expect(path).toBe("/tmp/out");
	});
});
