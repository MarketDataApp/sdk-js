import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MarketDataClient } from "@/client";


const fetchMock = vi.fn();
global.fetch = fetchMock;


const mockDataPath = join(__dirname, "mocks", "stocks_prices_response_200.json");
const mockData = JSON.parse(readFileSync(mockDataPath, "utf-8"));

describe("StocksResource (Mock Data)", () => {
    beforeEach(() => {
        fetchMock.mockClear();
    });

    it("prices returns correct data structure from mock", async () => {
        const client = new MarketDataClient({ token: "test" });

        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => mockData,
            headers: new Headers(),
        });

        const result = await client.stocks.prices({ symbols: ["AAPL", "TSLA"] });

        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(2);

        const aapl = (result as any[]).find(r => r.symbol === "AAPL");
        expect(aapl).toBeDefined();
        expect(aapl).toHaveProperty("s", "ok");
        expect(aapl).toHaveProperty("mid", 280.02);


        const tsla = (result as any[]).find(r => r.symbol === "TSLA");
        expect(tsla).toBeDefined();
        expect(tsla).toHaveProperty("mid", 455.76);
    });
});
