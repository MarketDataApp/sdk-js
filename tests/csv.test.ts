
import { describe, expect, it, vi } from "vitest";
import { OutputFormat } from "../src/enums";
import { MarketDataClient } from "../src/client";

const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock("../src/fileUtils", () => ({
    saveBlobToFile: vi.fn().mockResolvedValue("/absolute/path/to/out.csv"),
}));

import { saveBlobToFile } from "../src/fileUtils";

describe("CSV Output Support", () => {
    it("returns a Blob when outputFormat is CSV", async () => {
        const client = new MarketDataClient({ token: "test-token" });
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
                email: "test@example.com"
            }),
        });

        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: new Headers({
                "content-type": "text/csv",
            }),
            blob: async () => mockBlob,
            json: async () => { throw new Error("Should not convert to JSON"); }
        });

        const result = await client.stocks.prices("AAPL", {
            outputFormat: OutputFormat.CSV,
        });

        if (result.isErr()) {
            console.error("Test failed with error:", result.error);
        }
        expect(result.isOk()).toBe(true);
        const data = result._unsafeUnwrap();

        expect(data).toBeInstanceOf(Blob);
        expect(await (data as unknown as Blob).text()).toBe(csvContent);
    });

    it("returns a Blob when global outputFormat is CSV", async () => {
        const client = new MarketDataClient({
            token: "test-token",
        });
        (client.settings as any).marketdataOutputFormat = OutputFormat.CSV;

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
                email: "test@example.com"
            }),
        });

        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: new Headers({
                "content-type": "text/csv",
            }),
            blob: async () => mockBlob,
            json: async () => { throw new Error("Should not convert to JSON"); }
        });

        const result = await client.stocks.prices("MSFT");

        expect(result.isOk()).toBe(true);
        const data = result._unsafeUnwrap();

        expect(data).toBeInstanceOf(Blob);
        expect(await (data as unknown as Blob).text()).toBe(csvContent);
    });
});

describe("Chained Methods Support", () => {
    it("allows saving directly via .save()", async () => {
        const client = new MarketDataClient({ token: "test-token" });
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

        const savedPath = await client.stocks.prices("AAPL", { outputFormat: "csv" }).save("my_file.csv");

        expect(saveBlobToFile).toHaveBeenCalledWith(expect.any(Blob), "my_file.csv");
        expect(savedPath).toBe("/absolute/path/to/out.csv");
    });

    it("allows retrieving blob via .blob()", async () => {
        const client = new MarketDataClient({ token: "test-token" });
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

        const blob = await client.stocks.prices("AAPL", { outputFormat: "csv" }).blob();
        expect(blob).toBeInstanceOf(Blob);
        expect(await blob.text()).toBe("blob content");
    });
});
