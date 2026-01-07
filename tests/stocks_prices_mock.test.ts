import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MarketDataClient } from "../src/client";

// Mock fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

// Load mock data
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

        expect(result).toEqual(mockData);
        expect(result).toHaveProperty("s", "ok");
        expect(result).toHaveProperty("mid");
        expect(Array.isArray((result as any).mid)).toBe(true);
    });
});
