import { describe, expect, it, vi } from "vitest";
import { MarketDataClient } from "../src/client";
import { OutputFormat } from "../src/enums";

const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock("../src/fileUtils", () => ({
	saveBlobToFile: vi.fn().mockResolvedValue("/absolute/path/to/out.csv"),
}));

import { saveBlobToFile } from "../src/fileUtils";

describe("CSV Output Support", () => {
	it("returns a Blob when outputFormat is CSV", async () => {
		const csvContent = "symbol,price\nAAPL,150.00";
		const mockBlob = new Blob([csvContent], { type: "text/csv" });

		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			headers: new Headers({
				"x-api-ratelimit-remaining": "100",
				"x-api-ratelimit-limit": "1000",
			}),
			json: async () => ({
				id: "user-123",
				email: "test@example.com",
			}),
		});

		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			headers: new Headers({
				"content-type": "text/csv",
			}),
			blob: async () => mockBlob,
			json: async () => {
				throw new Error("Should not convert to JSON");
			},
		});

		const client = new MarketDataClient({ token: "test-token" });
		await client.ready;

		const data = await client.stocks.prices("AAPL", {
			outputFormat: OutputFormat.CSV,
		});

		expect(data).toBeInstanceOf(Blob);
		expect(await (data as unknown as Blob).text()).toBe(csvContent);
	});

	it("returns a Blob when global outputFormat is CSV", async () => {
		const csvContent = "symbol,price\nMSFT,300.00";
		const mockBlob = new Blob([csvContent], { type: "text/csv" });

		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			headers: new Headers({
				"x-api-ratelimit-remaining": "100",
				"x-api-ratelimit-limit": "1000",
			}),
			json: async () => ({
				id: "user-123",
				email: "test@example.com",
			}),
		});

		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			headers: new Headers({
				"content-type": "text/csv",
			}),
			blob: async () => mockBlob,
			json: async () => {
				throw new Error("Should not convert to JSON");
			},
		});

		const client = new MarketDataClient({ token: "test-token" });
		// biome-ignore lint/suspicious/noExplicitAny: Accessing internal settings for testing
		(client.settings as any).marketdataOutputFormat = OutputFormat.CSV;
		await client.ready;

		const data = await client.stocks.prices("MSFT");

		expect(data).toBeInstanceOf(Blob);
		expect(await (data as unknown as Blob).text()).toBe(csvContent);
	});
});

describe("Chained Methods Support", () => {
	it("allows saving directly via .save()", async () => {
		const csvContent = "chained,content";
		const mockBlob = new Blob([csvContent], { type: "text/csv" });

		mockFetch.mockResolvedValueOnce({
			ok: true,
			headers: new Headers(),
			json: async () => ({ id: "u1" }),
		});

		mockFetch.mockResolvedValueOnce({
			ok: true,
			headers: new Headers({ "content-type": "text/csv" }),
			blob: async () => mockBlob,
		});

		const client = new MarketDataClient({ token: "test-token" });
		await client.ready;

		const savedPath = await client.stocks
			.prices("AAPL", { outputFormat: "csv" })
			.save("my_file.csv");

		expect(saveBlobToFile).toHaveBeenCalledWith(
			expect.any(Blob),
			"my_file.csv",
		);
		expect(savedPath).toBe("/absolute/path/to/out.csv");
	});

	it("allows retrieving blob via .blob()", async () => {
		const mockBlob = new Blob(["blob content"], { type: "text/plain" });

		mockFetch.mockResolvedValueOnce({
			ok: true,
			headers: new Headers(),
			json: async () => ({ id: "u1" }),
		});

		mockFetch.mockResolvedValueOnce({
			ok: true,
			headers: new Headers(),
			blob: async () => mockBlob,
		});

		const client = new MarketDataClient({ token: "test-token" });
		await client.ready;

		const blob = await client.stocks
			.prices("AAPL", { outputFormat: "csv" })
			.blob();
		expect(blob).toBeInstanceOf(Blob);
		expect(await blob.text()).toBe("blob content");
	});
});
